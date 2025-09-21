'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: 'executing' | 'completed' | 'error';
  error?: string;
}

interface ContentBlock {
  type: 'text' | 'tool_call';
  id: string;
  content?: string;
  toolCall?: ToolCall;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  contentBlocks?: ContentBlock[];
}

// Tool Call Component
function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'executing':
        return <div className="w-3 h-3 border border-[#697565] border-t-transparent rounded-full animate-spin"></div>;
      case 'completed':
        return <span className="text-green-400">✓</span>;
      case 'error':
        return <span className="text-red-400">✗</span>;
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case 'executing':
        return 'Running...';
      case 'completed':
        return 'Completed';
      case 'error':
        return `Error: ${toolCall.error}`;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1C20]/50 border border-[#1A1C20]/30 text-sm">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="font-medium text-[#ECDFCC]">{toolCall.name}</span>
      </div>
      <div className="flex-1 text-[#C4B8A8]/80">
        {getStatusText()}
      </div>
    </div>
  );
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageCounterRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    messageCounterRef.current += 1;
    const newMessage: Message = {
      ...message,
      id: `message-${messageCounterRef.current}-${Date.now()}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    addMessage({
      type: 'user',
      content: userMessage
    });

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Add streaming assistant message
    const assistantMessageId = addMessage({
      type: 'assistant',
      content: '',
      isStreaming: true,
      contentBlocks: []
    });

    try {
      // Call our streaming API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: conversationHistory
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let currentContent = '';
      let currentContentBlocks: ContentBlock[] = [];
      let currentTextBlockId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              
              switch (eventData.type) {
                case 'text_start':
                  // Start a new text block
                  currentTextBlockId = `text-${Date.now()}-${Math.random()}`;
                  currentContentBlocks = [
                    ...currentContentBlocks,
                    {
                      type: 'text',
                      id: currentTextBlockId,
                      content: ''
                    }
                  ];
                  break;
                  
                case 'text_delta':
                  // Append text to current content and current text block
                  currentContent += eventData.data.text;
                  
                  if (currentTextBlockId) {
                    currentContentBlocks = currentContentBlocks.map(block =>
                      block.id === currentTextBlockId
                        ? { ...block, content: (block.content || '') + eventData.data.text }
                        : block
                    );
                  }
                  
                  updateMessage(assistantMessageId, {
                    content: currentContent,
                    isStreaming: true,
                    contentBlocks: currentContentBlocks
                  });
                  break;
                  
                case 'text_stop':
                  // Text block completed
                  currentTextBlockId = null;
                  break;
                  
                case 'tool_use_start':
                  // Add tool call to content blocks
                  const newTool: ToolCall = {
                    id: eventData.data.tool.id,
                    name: eventData.data.tool.name,
                    input: eventData.data.tool.input,
                    status: 'executing'
                  };
                  
                  currentContentBlocks = [
                    ...currentContentBlocks,
                    {
                      type: 'tool_call',
                      id: eventData.data.tool.id,
                      toolCall: newTool
                    }
                  ];
                  
                  updateMessage(assistantMessageId, {
                    content: currentContent,
                    isStreaming: true,
                    contentBlocks: currentContentBlocks
                  });
                  break;
                  
                case 'tool_execution_start':
                  // Update tool status to executing
                  currentContentBlocks = currentContentBlocks.map(block => {
                    if (block.type === 'tool_call' && block.toolCall?.id === eventData.data.tool_id) {
                      return {
                        ...block,
                        toolCall: {
                          ...block.toolCall,
                          status: 'executing' as const
                        }
                      };
                    }
                    return block;
                  });
                  
                  updateMessage(assistantMessageId, {
                    content: currentContent,
                    isStreaming: true,
                    contentBlocks: currentContentBlocks
                  });
                  break;
                  
                case 'tool_execution_complete':
                  // Update tool status to completed
                  currentContentBlocks = currentContentBlocks.map(block => {
                    if (block.type === 'tool_call' && block.toolCall?.id === eventData.data.tool_id) {
                      return {
                        ...block,
                        toolCall: {
                          ...block.toolCall,
                          status: 'completed' as const
                        }
                      };
                    }
                    return block;
                  });
                  
                  updateMessage(assistantMessageId, {
                    content: currentContent,
                    isStreaming: true,
                    contentBlocks: currentContentBlocks
                  });
                  break;
                  
                case 'tool_execution_error':
                  // Update tool status to error
                  currentContentBlocks = currentContentBlocks.map(block => {
                    if (block.type === 'tool_call' && block.toolCall?.id === eventData.data.tool_id) {
                      return {
                        ...block,
                        toolCall: {
                          ...block.toolCall,
                          status: 'error' as const,
                          error: eventData.data.error
                        }
                      };
                    }
                    return block;
                  });
                  
                  updateMessage(assistantMessageId, {
                    content: currentContent,
                    isStreaming: true,
                    contentBlocks: currentContentBlocks
                  });
                  break;
                  
                case 'complete':
                  // Streaming complete
                  updateMessage(assistantMessageId, {
                    content: currentContent,
                    isStreaming: false,
                    contentBlocks: currentContentBlocks
                  });
                  
                  // Update conversation history
                  setConversationHistory(prev => [
                    ...prev,
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: currentContent }
                  ]);
                  break;
                  
                case 'error':
                  throw new Error(eventData.data.error);
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError);
            }
          }
        }
      }

    } catch (err) {
      console.error('Chat error:', err);
      
      if (err instanceof Error && err.name === 'AbortError') {
        updateMessage(assistantMessageId, {
          content: 'Request cancelled',
          isStreaming: false
        });
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        
        updateMessage(assistantMessageId, {
          content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
          isStreaming: false
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "What's my current roster?",
    "Who should I start this week?", 
    "Show me available free agents",
    "How did my team perform?",
    "Any trade recommendations?"
  ];

  return (
    <div className="flex flex-col h-screen bg-[#0F1014]">
      {/* Header */}
      <div className="border-b border-[#1A1C20]/50 px-6 py-4 bg-[#0F1014]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#ECDFCC] tracking-tight">Fantasy Football AI</h1>
            <p className="text-sm text-[#C4B8A8]/80 mt-0.5">Your AI-powered fantasy football assistant</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#697565] to-[#697565]/70 flex items-center justify-center">
            <span className="text-[#ECDFCC] text-sm font-medium">⚡</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="text-center space-y-8 py-12">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#697565] to-[#697565]/70 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏈</span>
                </div>
                <h2 className="text-3xl font-bold text-[#ECDFCC] tracking-tight">
                  Welcome to Fantasy Football AI
                </h2>
                <p className="text-[#C4B8A8]/90 max-w-lg mx-auto text-lg leading-relaxed">
                  Your intelligent assistant for managing your ESPN Fantasy Football team. Get insights on roster decisions, matchups, and player analysis.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full gap-3",
                    message.type === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#697565] to-[#697565]/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-[#ECDFCC] text-sm font-medium">🤖</span>
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
                    message.type === 'user' 
                      ? "bg-[#697565] text-[#ECDFCC] rounded-br-md" 
                      : "bg-[#1A1C20] text-[#ECDFCC] rounded-bl-md border border-[#1A1C20]/50"
                  )}>
                    {message.type === 'assistant' ? (
                      <div className="space-y-3">
                        {/* Render content blocks in chronological order */}
                        {message.contentBlocks && message.contentBlocks.length > 0 ? (
                          message.contentBlocks.map((block) => (
                            <div key={block.id}>
                              {block.type === 'tool_call' && block.toolCall ? (
                                <ToolCallDisplay toolCall={block.toolCall} />
                              ) : block.type === 'text' && block.content ? (
                                <MarkdownRenderer content={block.content} />
                              ) : null}
                            </div>
                          ))
                        ) : message.content ? (
                          <MarkdownRenderer content={message.content} />
                        ) : message.isStreaming ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#ECDFCC]">Thinking</span>
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-[#697565] rounded-full animate-bounce"></div>
                              <div className="w-1 h-1 bg-[#697565] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1 h-1 bg-[#697565] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#ECDFCC]">
                        {message.content}
                      </div>
                    )}
                  </div>
                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ECDFCC] to-[#C4B8A8] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-[#1E201E] text-sm font-medium">👤</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[#1A1C20]/50 bg-[#0F1014] shadow-lg">
        <div className="max-w-4xl mx-auto p-6">
          {/* Quick Start Prompts - moved here above input */}
          {messages.length === 0 && (
            <div className="mb-6 space-y-4">
              <p className="text-sm font-medium text-[#C4B8A8]/80 text-center">Get started with these questions:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    disabled={isLoading}
                    className="group p-3 text-left rounded-xl bg-[#1A1C20]/50 hover:bg-[#1A1C20] border border-[#1A1C20]/30 hover:border-[#697565]/30 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#697565] group-hover:bg-[#697565] transition-colors"></div>
                      <span className="text-sm text-[#ECDFCC] group-hover:text-[#ECDFCC] font-medium">{prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Fantasy Football AI..."
                disabled={isLoading}
                className="w-full h-14 text-base pl-4 pr-12 rounded-2xl border-[#1A1C20]/50 bg-[#1A1C20]/30 backdrop-blur-sm focus:bg-[#1A1C20]/50 focus:border-[#697565]/50 transition-all duration-200"
              />
              {input.trim() && !isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <button
                    type="submit"
                    className="w-8 h-8 rounded-full bg-[#697565] hover:bg-[#697565]/90 flex items-center justify-center transition-colors duration-200 shadow-sm"
                  >
                    <span className="text-[#ECDFCC] text-sm">↑</span>
                  </button>
                </div>
              )}
            </div>
            {isLoading && (
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleStop}
                className="h-14 px-6 rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#ECDFCC] border-t-transparent rounded-full animate-spin"></div>
                  <span>Stop</span>
                </div>
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
