'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatBotProps {
  className?: string;
}

export default function ChatBot({ 
  className = '' 
}: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-message',
      type: 'system',
      content: 'Welcome! I can help you manage your ESPN Fantasy Football team. Ask me about your roster, matchups, free agents, or any other fantasy football questions!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [error, setError] = useState<string | null>(null);
  
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
    setError(null);
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
      content: 'Thinking...',
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

        // Show tool calls if any were made
        if (data.toolCalls && data.toolCalls.length > 0) {
          addMessage({
            type: 'system',
            content: `🔧 Used tools: ${data.toolCalls.join(', ')}`
          });
        }

        // Handle errors
        if (data.error) {
          setError(data.error);
        }
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
          content: `Error: ${errorMessage}`,
          isStreaming: false
        });
        
        setError(errorMessage);
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

  const clearChat = () => {
    messageCounterRef.current = 0;
    setMessages([{
      id: 'cleared-welcome-message',
      type: 'system',
      content: 'Chat cleared. How can I help you with your fantasy football team?',
      timestamp: new Date()
    }]);
    setConversationHistory([]);
    setError(null);
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h3 className="font-semibold text-gray-900">Fantasy Football Assistant</h3>
        </div>
        <div className="flex space-x-2">
          {isLoading && (
            <button
              onClick={handleStop}
              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          )}
          <button
            onClick={clearChat}
            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex justify-between items-start">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-700 border'
                  : 'bg-gray-50 text-gray-900 border'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse"></span>
                )}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {String(message.timestamp.toLocaleTimeString())}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your fantasy team..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Send'
            )}
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            "What's my current roster?",
            "Who should I start this week?", 
            "Show me available free agents",
            "How did my team perform this week?",
            "Any trade recommendations?"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => !isLoading && setInput(suggestion)}
              disabled={isLoading}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
