'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
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
      isStreaming: true
    });

    try {
      // Call our API endpoint
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

      const data = await response.json();

      if (response.ok) {
        // Update conversation history if provided
        if (data.conversationHistory) {
          setConversationHistory(data.conversationHistory);
        }

        // Update the assistant message with the response
        updateMessage(assistantMessageId, {
          content: data.response,
          isStreaming: false
        });
      } else {
        throw new Error(data.error || 'Failed to get response');
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
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold text-gray-900">Fantasy Football AI</h1>
          <p className="text-sm text-gray-500">Your AI-powered fantasy football assistant</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Welcome to Fantasy Football AI
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  I can help you manage your ESPN Fantasy Football team. Ask me about your roster, matchups, free agents, or any other fantasy football questions!
                </p>
              </div>
              
              {/* Quick Start Prompts */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(prompt)}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    message.type === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <Card className={cn(
                    "max-w-[80%] border-0 shadow-sm",
                    message.type === 'user' 
                      ? "bg-gray-900 text-white" 
                      : "bg-gray-50"
                  )}>
                    <div className="p-4">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content || (message.isStreaming ? 'Thinking...' : '')}
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse rounded"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your fantasy team..."
                disabled={isLoading}
                className="w-full h-12 text-base border-gray-200 focus-visible:ring-gray-900"
              />
            </div>
            <div className="flex gap-2">
              {isLoading && (
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleStop}
                  className="h-12 px-4"
                >
                  Stop
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-12 px-6"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
