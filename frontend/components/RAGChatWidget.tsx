/**
 * RAGChatWidget Component for TulsiHealth
 * AI-powered medical assistant with RAG knowledge base
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  RefreshCw,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  confidence?: number;
  category?: 'diagnosis' | 'medicine' | 'general' | 'emergency';
}

interface RAGSession {
  id: string;
  patientId?: string;
  context?: string;
  startTime: Date;
  messages: Message[];
}

interface RAGChatWidgetProps {
  patientId?: string;
  context?: string;
  placeholder?: string;
  showSources?: boolean;
  maxMessages?: number;
  onSessionEnd?: (session: RAGSession) => void;
}

export default function RAGChatWidget({
  patientId,
  context,
  placeholder = "Ask me anything about AYUSH medicine, symptoms, or treatments...",
  showSources = true,
  maxMessages = 50,
  onSessionEnd
}: RAGChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize session
    initializeSession();
  }, [patientId, context]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/rag/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        
        // Add welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          type: 'assistant',
          content: getWelcomeMessage(),
          timestamp: new Date(),
          category: 'general'
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      // Add fallback welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: "Hello! I'm your TulsiHealth AI assistant. I can help you with AYUSH medicine, symptom analysis, and treatment recommendations. How can I assist you today?",
        timestamp: new Date(),
        category: 'general'
      };
      setMessages([welcomeMessage]);
    }
  };

  const getWelcomeMessage = () => {
    if (patientId) {
      return "Hello! I'm your TulsiHealth AI assistant. I can help you with AYUSH medicine, symptom analysis, and treatment recommendations for this patient. How can I assist you today?";
    }
    return "Hello! I'm your TulsiHealth AI assistant. I can help you with AYUSH medicine, symptom analysis, and treatment recommendations. How can I assist you today?";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: input.trim(),
          patientId,
          context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          sources: data.sources,
          confidence: data.confidence,
          category: data.category
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback response
        const fallbackMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: "I apologize, but I'm having trouble processing your request right now. Please try again or contact your healthcare provider for immediate assistance.",
          timestamp: new Date(),
          category: 'general'
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: "I'm experiencing technical difficulties. Please try again later.",
        timestamp: new Date(),
        category: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const provideFeedback = async (messageId: string, feedback: 'up' | 'down') => {
    try {
      await fetch('/api/rag/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          messageId,
          feedback
        }),
      });
    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  };

  const clearChat = () => {
    setMessages([]);
    initializeSession();
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'diagnosis':
        return <Lightbulb className="w-4 h-4" />;
      case 'medicine':
        return <BookOpen className="w-4 h-4" />;
      case 'emergency':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'diagnosis':
        return 'text-yellow-400';
      case 'medicine':
        return 'text-blue-400';
      case 'emergency':
        return 'text-red-400';
      default:
        return 'text-green-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Medical Assistant</h3>
            <p className="text-xs text-gray-400">Powered by RAG Technology</p>
          </div>
        </div>
        
        <button
          onClick={clearChat}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Clear chat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-blue-500' 
                  : 'bg-gradient-to-br from-green-500 to-green-700'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  getCategoryIcon(message.category)
                )}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col space-y-1 ${
                message.type === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className={`p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Confidence Score */}
                  {message.type === 'assistant' && message.confidence && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Confidence:</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                message.confidence > 0.8 ? 'bg-green-500' :
                                message.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${message.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-400">
                            {Math.round(message.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sources */}
                  {message.type === 'assistant' && showSources && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Sources:</p>
                      <div className="space-y-1">
                        {message.sources.slice(0, 3).map((source, index) => (
                          <div key={index} className="text-xs text-gray-400">
                            <BookOpen className="w-3 h-3 inline mr-1" />
                            {source}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Actions */}
                {message.type === 'assistant' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Copy message"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => provideFeedback(message.id, 'up')}
                      className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => provideFeedback(message.id, 'down')}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                    
                    <span className="text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                )}
                
                {message.type === 'user' && (
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex space-x-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors resize-none"
            disabled={isLoading}
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-2 text-xs text-gray-400 flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3" />
          <span>AI assistant for informational purposes only. Not a substitute for professional medical advice.</span>
        </div>
      </div>
    </div>
  );
}
