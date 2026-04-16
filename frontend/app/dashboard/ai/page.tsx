'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Activity, Stethoscope, ScanLine, Users, BarChart3, Settings,
  LayoutDashboard, BrainCircuit, LogOut, Send, Mic, Globe2,
  BookOpen, Bot, User as UserIcon, Zap, RefreshCw,
  RotateCcw, Sparkles, ChevronRight, AlertCircle, Info
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STARTERS = [
  'Patient has fever and joint pain for 3 days',
  'What is the NAMASTE code for Amavata?',
  'ஜ்வரம், மூட்டு வலி — சிகிச்சை என்ன?',
  'Recovery prediction for 65yo male with Prameha',
];

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const }
};

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-3 mb-6">
      <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0">
        <Bot size={14} className="text-[#00d69b]" />
      </div>
      <div className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] px-5 py-4 rounded-[20px] rounded-bl-[4px]">
        <div className="flex gap-1.5 items-center">
          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-[#00d69b]/40" />
          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#00d69b]/40" />
          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#00d69b]/40" />
        </div>
      </div>
    </motion.div>
  );
}

function buildAIResponse(userMsg: string): string {
  const msg = userMsg.toLowerCase();
  const isTamil = /[\u0B80-\u0BFF]/.test(userMsg);

  if (isTamil) {
    return `**ஜ்வர (Fever) மதிப்பீடு:**\n\nஇந்த அறிகுறிகள் **Vataja Jwara (வாதஜ ஜ்வரம்)** என்று சுட்டுகின்றன.\n\n**குறியீடுகள்:**\n- NAMASTE: \`AYU-D-0001\`\n- ICD-11: \`1D01\`\n\n**சிகிச்சை பரிந்துரை:**\n- Sudarshana Churna — 2g BD\n- Tulsi Kwatha — 20ml TDS\n\n⚠️ மருத்துவர் பரிந்துரை அவசியம்.`;
  }
  if (msg.includes('fever') || msg.includes('jwara')) {
    return `**Clinical Assessment — Vataja Jwara**\n\nSymptoms align with **Vataja Jwara** in AYUSH taxonomy.\n\n**Dual Coding:**\n- 🌿 NAMASTE: \`AYU-D-0001\`\n- 🔬 ICD-11 MMS: \`1D01\`\n\n**Protocol suggestion:**\n- Sudarshana Churna — 500mg BD\n- Tulsi Kwatha — 20ml TDS\n\n⚠️ Assistive only. Check contraindications.`;
  }
  if (msg.includes('diabetes') || msg.includes('prameha')) {
    return `**Assessment — Prameha (Diabetes)**\n\n**Dual Coding:**\n- 🌿 NAMASTE: \`AYU-D-0201\`\n- 🔬 ICD-11 MMS: \`5A11\`\n\n**Recovery Prediction:** 72% at 12mo\n\n**Protocol:**\n- Karela juice — 30ml morning fasting\n- Gudmar — 400mg BD\n\n⚠️ Assistive only.`;
  }
  return `**TulsiHealth AI Assistant**\n\nI bridge **Ayurveda & Modern Medicine**.\n- 🌿 NAMASTE Code Lookup\n- 🔬 Dual Coding Map\n- 🧠 Recovery Prediction\n- 🗣️ Multilingual Support\n\nTry: *"What is the NAMASTE code for Amavata?"*`;
}

export default function AIAssistantPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `**Vanakkam! I'm TulsiHealth AI** 🌿\n\nI bridge **Ayurveda & Modern Medicine** using neural mapping. I can help you with:\n- NAMASTE, ICD-11, and TM2 codes\n- Symptom-to-Diagnosis mapping\n- Recovery outcome prediction\n- Assistive clinical protocols\n\nHow can I help you today?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    await new Promise(res => setTimeout(res, 1200));

    let responseContent = buildAIResponse(msg);
    try {
      const res = await fetch(`${API}/api/rag/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, language }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.response) responseContent = data.response;
      }
    } catch {}

    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseContent, timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  function renderContent(content: string) {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) return <div key={i} className="text-sm font-semibold tracking-tight tracking-tight mb-2 mt-2">{line.slice(2, -2)}</div>;
      if (line.startsWith('- ')) return <div key={i} className="flex items-start gap-2 text-[13px] text-white/50 mb-1"><span className="text-[#00d69b]">•</span>{line.slice(2)}</div>;
      if (line.startsWith('⚠️')) return <div key={i} className="text-[10px] text-white/20 font-semibold tracking-tight uppercase tracking-widest mt-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl">{line}</div>;
      if (line.includes('`')) {
        const parts = line.split(/(`[^`]+`)/);
        return (
          <div key={i} className="text-[13px] text-white/70 mb-1">
            {parts.map((p, j) => p.startsWith('`') && p.endsWith('`') ? <code key={j} className="font-mono text-[#00d69b] bg-[#00d69b]/10 px-1.5 py-0.5 rounded text-[11px] font-bold">{p.slice(1, -1)}</code> : <span key={j}>{p}</span>)}
          </div>
        );
      }
      if (!line.trim()) return <div key={i} className="mb-2" />;
      return <div key={i} className="text-[13px] text-white/70 mb-1 leading-relaxed">{line}</div>;
    });
  }

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden selection:bg-[#00d69b]/30">
      <div className="noise opacity-[0.02]" />

      <main className="w-full">
        <div className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] border-b border-white/5 px-10 py-6 flex items-center justify-between shrink-0 relative z-20">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-xl">
              <Sparkles className="text-[#00d69b]" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight tracking-tighter">Clinical Intelligence</h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d69b] shadow-[0_0_10px_#00d69b]" />
                <span className="text-[10px] text-white/20 font-semibold tracking-tight uppercase tracking-widest">Neural RAG Engine Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
              <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold tracking-tight transition-all ${language === 'en' ? 'bg-white text-black' : 'text-white/20 hover:text-white/40'}`}>EN</button>
              <button onClick={() => setLanguage('ta')} className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold tracking-tight transition-all ${language === 'ta' ? 'bg-white text-black' : 'text-white/20 hover:text-white/40'}`}>தமிழ்</button>
            </div>
            <motion.button whileHover={{ rotate: -45 }} onClick={() => setMessages([{ id: '0', role: 'assistant', content: 'Conversation reset. Ready for clinical inquiry.', timestamp: new Date() }])} className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all"><RotateCcw size={16} /></motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-12 space-y-10 relative z-10 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div key={msg.id} {...fadeInUp} className={`flex items-end gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'assistant' ? 'bg-white/[0.03] border border-white/5' : 'bg-[#00d69b] text-black'}`}>
                  {msg.role === 'assistant' ? <Bot size={16} className="text-[#00d69b]" /> : <UserIcon size={16} strokeWidth={3} />}
                </div>
                <div className={`max-w-[80%] md:max-w-[70%] px-8 py-6 rounded-[28px] shadow-2xl ${msg.role === 'assistant' ? 'glass rounded-bl-[4px] border-white/10' : 'bg-white/[0.05] border border-white/10 rounded-br-[4px]'}`}>
                  {msg.role === 'assistant' ? renderContent(msg.content) : <p className="text-sm font-bold tracking-tight text-white/90">{msg.content}</p>}
                  <div className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-white/10 mt-4 border-t border-white/5 pt-3">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <TypingIndicator />}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Input Dock */}
        <div className="px-10 py-8 shrink-0 relative z-20">
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2.5 mb-6 justify-center max-w-2xl mx-auto">
              {STARTERS.map((s, i) => (
                <motion.button key={i} whileHover={{ y: -2 }} onClick={() => sendMessage(s)} className="px-5 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] font-bold text-white/30 hover:text-[#00d69b] hover:border-[#00d69b]/30 hover:bg-white/[0.04] transition-all whitespace-nowrap">{s}</motion.button>
              ))}
            </div>
          )}
          <div className="max-w-4xl mx-auto relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-[#00d69b]/20 to-[#7075ff]/20 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
             <div className="relative glass border border-white/10 rounded-[30px] p-2 flex items-center gap-1 focus-within:border-[#00d69b]/40 transition-all bg-black/40 shadow-2xl">
               <input
                 type="text"
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                 placeholder={language === 'ta' ? "கேளுங்கள்..." : "Symptom, NAMASTE code, or treatment protocol enquiry..."}
                 className="flex-1 bg-transparent pl-8 pr-4 py-4 text-[15px] font-bold tracking-tight placeholder:text-white/5 outline-none"
               />
               <motion.button
                 whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                 onClick={() => sendMessage()}
                 disabled={!input.trim() || loading}
                 className="w-14 h-14 rounded-[24px] bg-[#00d69b] text-black flex items-center justify-center shadow-lg disabled:opacity-20 transition-all"
               >
                 <Send size={20} strokeWidth={3} />
               </motion.button>
             </div>
             <div className="flex items-center justify-center gap-2 mt-4 px-2">
               <AlertCircle size={10} className="text-white/10" />
               <span className="text-[9px] font-semibold tracking-tight uppercase tracking-[0.2em] text-white/10">Clinical Intelligence Node · Assistive Guidance Only</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}



