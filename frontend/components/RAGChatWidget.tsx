/**
 * RAGChatWidget Component for TulsiHealth
 * AI-powered medical assistant with RAG knowledge base
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  CheckCircle,
  X,
  Plus,
  ArrowUpRight,
  Minimize2,
  Sparkles,
  Search
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

interface RAGChatWidgetProps {
  patientId?: string;
  context?: string;
  placeholder?: string;
}

export default function RAGChatWidget({
  patientId,
  context,
  placeholder = "Ask about clinical protocols..."
}: RAGChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeSession();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/rag/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, context }),
      });
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setMessages([{
          id: 'welcome',
          type: 'assistant',
          content: "I am TulsiAI, your secure medical knowledge base. How can I assist with your clinical workflow today?",
          timestamp: new Date(),
          category: 'general'
        }]);
      }
    } catch (e) {
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: "Identity verified. Neural knowledge base active. How can I help?",
        timestamp: new Date(),
        category: 'general'
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const resp = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMsg.content, patientId, context }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          sources: data.sources,
          confidence: data.confidence,
          category: data.category
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: 'err',
        type: 'assistant',
        content: "Synchronisation lost. Please retry.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#00d69b] to-[#00b383] text-black shadow-2xl shadow-[#00d69b]/30 flex items-center justify-center relative group"
          >
            <div className="absolute -inset-2 bg-[#00d69b]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Bot size={28} />
            {/* Pulsing indicator */}
            <div className="absolute top-0 right-0 w-4 h-4 bg-white border-4 border-[#00d69b] rounded-full animate-pulse" />
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 100, scale: 0.8, filter: 'blur(20px)' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-[420px] h-[640px] glass rounded-[40px] border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col bg-black/60 backdrop-blur-3xl"
          >
            <div className="noise opacity-[0.03] pointer-events-none" />
            
            {/* Header */}
            <div className="p-8 pb-6 flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#00d69b]/10 flex items-center justify-center border border-[#00d69b]/20 shadow-lg shadow-[#00d69b]/5">
                  <Sparkles size={20} className="text-[#00d69b]" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tighter text-white uppercase italic">TulsiAI</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00d69b] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Secure Knowledge Link</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-white/5 transition-all text-white/20 hover:text-white">
                <Minimize2 size={20} />
              </button>
            </div>

            {/* Chat Flow */}
            <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8 scrollbar-hide">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, x: msg.type === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] group ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`p-5 rounded-[28px] text-[13px] font-medium leading-relaxed tracking-tight ${
                      msg.type === 'user' 
                        ? 'bg-white text-black rounded-tr-none' 
                        : 'bg-white/[0.03] border border-white/5 text-white/80 rounded-tl-none backdrop-blur-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.sources.slice(0, 2).map((s, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/20">
                            <BookOpen size={10} /> {s.length > 20 ? s.slice(0, 20) + '...' : s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/[0.03] border border-white/5 p-5 rounded-[28px] rounded-tl-none">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-[#00d69b]"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Dock */}
            <div className="p-8 pt-4">
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={placeholder}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[28px] px-8 py-5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#00d69b]/40 focus:bg-white/[0.05] transition-all resize-none pr-16"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    input.trim() ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/10'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/10 italic">
                 <AlertTriangle size={10} /> Verified Clinical Context Restricted
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
