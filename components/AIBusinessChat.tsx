'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIBusinessChatProps {
  businessContext?: string;
}

interface QuickPrompt {
  title: string;
  prompt: string;
  description: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    title: 'Suggest Replacement',
    prompt: 'Suggest me a trendy replacement for Chili Pepper Fried Chicken (8). Give me a simple response of ONE item you think will be a good replacement that fits the business model.',
    description: 'Get a trendy menu replacement suggestion',
  },
  {
    title: 'Sales Dip Analysis',
    prompt: 'Why is there a dip in sales in June and July?',
    description: 'Understand seasonal sales patterns',
  },
  {
    title: 'Ingredient Market Analysis',
    prompt: 'What are the current market conditions, latest news, and cost trends for chicken? Include information about supply availability, recent price changes, and any factors that could affect my supply chain.',
    description: 'Get market intelligence for any ingredient (ask about any ingredient)',
  },
];

export default function AIBusinessChat({ businessContext }: AIBusinessChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your business analytics assistant. Ask me anything about your business data, trends, or get suggestions to improve your operations.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldScrollRef = useRef(true);

  const scrollToBottom = (smooth: boolean = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' });
    }
  };

  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Only scroll when new messages are added, and only if we should scroll
  useEffect(() => {
    // Use a small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      if (shouldScrollRef.current && isExpanded) {
        scrollToBottom(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [messages.length, isExpanded]); // Only trigger on message count change, not content change

  // Auto-focus input when chat is expanded
  useEffect(() => {
    if (isExpanded) {
      // Small delay to ensure the input is rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleQuickPrompt = async (prompt: string) => {
    setShowQuickPrompts(false);
    
    const userMessage: Message = {
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date(),
    };
    
    shouldScrollRef.current = false;
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: businessContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      if (!data.response) {
        throw new Error('No response from server');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      shouldScrollRef.current = true;
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: error.message || 'Sorry, I encountered an error. Please check your API key in .env.local and try again.',
        timestamp: new Date(),
      };
      shouldScrollRef.current = true;
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const messageToSend = input.trim();

    const userMessage: Message = {
      role: 'user',
      content: messageToSend.trim(),
      timestamp: new Date(),
    };

    // Hide quick prompts after first message
    setShowQuickPrompts(false);
    
    // Don't scroll when user sends message - wait for assistant response
    // The message will be visible if user is already at bottom
    shouldScrollRef.current = false;
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: businessContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Server returned an error
        throw new Error(data.error || 'Failed to get response');
      }

      if (!data.response) {
        throw new Error('No response from server');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      // Always scroll when assistant responds (user wants to see the response)
      shouldScrollRef.current = true;
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: error.message || 'Sorry, I encountered an error. Please check your API key in .env.local and try again.',
        timestamp: new Date(),
      };
      // Allow scrolling when error message is shown
      shouldScrollRef.current = true;
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus input after a small delay to avoid scroll jump
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl shadow-xl flex flex-col overflow-hidden transition-all duration-300">
      {/* Header - Clickable to expand/collapse */}
      <div 
        className={`p-4 cursor-pointer hover:bg-slate-700/30 transition-colors ${isExpanded ? 'border-b border-slate-700/50' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100">AI Business Assistant</h3>
              <p className="text-xs text-gray-400">
                {isExpanded ? 'Click to collapse' : 'Click to open chat'}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="flex flex-col" style={{ height: '500px' }}>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0"
            onClick={(e) => e.stopPropagation()}
            onScroll={() => {
              // Track if user manually scrolls up - don't auto-scroll if they do
              // But allow scrolling again if they scroll back to bottom
              if (isNearBottom()) {
                shouldScrollRef.current = true;
              } else {
                shouldScrollRef.current = false;
              }
            }}
          >
        {/* Quick Prompts - Show when no user messages yet */}
        {showQuickPrompts && messages.filter(m => m.role === 'user').length === 0 && (
          <div className="space-y-3 mb-4">
            <p className="text-xs text-gray-400 font-medium">Quick Prompts:</p>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_PROMPTS.map((quickPrompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(quickPrompt.prompt)}
                  disabled={isLoading}
                  className="text-left p-3 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg transition-all hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 group-hover:text-gray-100">
                        {quickPrompt.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {quickPrompt.description}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-500 group-hover:text-gray-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white'
                  : 'bg-slate-700/50 text-gray-100 border border-slate-600/50'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="text-sm text-gray-100 [&>*:last-child]:mb-0">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-100">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ inline, children, ...props }: any) => {
                        if (inline) {
                          return (
                            <code className="bg-slate-800/70 px-1.5 py-0.5 rounded text-xs font-mono text-pink-300" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <pre className="bg-slate-800/70 p-3 rounded text-xs font-mono overflow-x-auto mb-2 border border-slate-600/50">
                            <code className="text-gray-200" {...props}>{children}</code>
                          </pre>
                        );
                      },
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 text-gray-100">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 text-gray-100">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-2 text-gray-100">{children}</h3>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-slate-500 pl-3 italic my-2 text-gray-300">
                          {children}
                        </blockquote>
                      ),
                      a: ({ children, href }) => (
                        <a 
                          href={href} 
                          className="text-blue-400 hover:text-blue-300 underline break-all" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      hr: () => <hr className="my-3 border-slate-600" />,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                          <table className="min-w-full border border-slate-600 rounded">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-slate-600 px-3 py-2 bg-slate-800/50 font-semibold text-left">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-slate-600 px-3 py-2">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              )}
              <p className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 text-gray-100 border border-slate-600/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700/50 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your business..."
                className="flex-1 bg-slate-700/50 border border-slate-600 text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

