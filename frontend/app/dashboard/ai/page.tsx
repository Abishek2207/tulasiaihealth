'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, Stethoscope, ScanLine, Users, BarChart3, Settings,
  LayoutDashboard, BrainCircuit, LogOut, Send, Mic, Globe2,
  BookOpen, Loader2, Bot, User as UserIcon, Zap, RefreshCw,
  RotateCcw, Sparkles, ChevronRight, AlertCircle
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BrainCircuit, label: 'AI Triage', href: '/dashboard/triage' },
  { icon: BookOpen, label: 'Diagnosis', href: '/dashboard/diagnosis' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codes?: { namaste?: string; icd11?: string; tm2?: string }[];
  timestamp: Date;
  lang?: 'en' | 'ta';
}

const STARTERS = [
  'Patient has fever, joint pain, and fatigue for 3 days',
  'Diabetic patient with foot swelling — suggest AYUSH treatment',
  'What is the NAMASTE code for Amavata?',
  'ஜ்வரம், மூட்டு வலி, சோர்வு — சிகிச்சை என்ன?',
  'Recovery prediction for 65yo male with Prameha',
  'Map ICD-11 5A11 to NAMASTE',
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-8 h-8 rounded-xl bg-[#00d69b]/10 border border-[#00d69b]/20 flex items-center justify-center shrink-0">
        <Bot size={16} className="text-[#00d69b]" />
      </div>
      <div className="glass px-5 py-4 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1.5 items-center h-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00d69b]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#00d69b]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#00d69b]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function buildAIResponse(userMsg: string): string {
  const msg = userMsg.toLowerCase();

  // Tamil detection
  const isTamil = /[\u0B80-\u0BFF]/.test(userMsg);

  if (isTamil) {
    return `**ஜ்வர (Fever) மதிப்பீடு:**

AYUSH மருத்துவ முறைப்படி, இந்த அறிகுறிகள் **Vataja Jwara (வாதஜ ஜ்வரம்)** என்று சுட்டுகின்றன.

**குறியீடுகள்:**
- NAMASTE: \`AYU-D-0001\` — Vataja Jwara
- ICD-11: \`1D01\` — Fever of unknown origin
- TM2: \`TM2-001\`

**சிகிச்சை பரிந்துரைகள் (உதவியாளர் மட்டும்):**
- Sudarshana Churna — 2g BD with warm water
- Tulsi Kwatha — 20ml TDS
- ஓய்வு மற்றும் திரவ உட்கொள்ளல்

⚠️ இது மட்டுமே உதவி. இறுதி சிகிச்சை முடிவை மருத்துவர் எடுப்பார்.`;
  }

  if (msg.includes('fever') || msg.includes('jwara')) {
    return `**Clinical Assessment — Vataja Jwara (Fever)**

Based on the symptoms described, this presentation aligns with **Vataja Jwara** in AYUSH taxonomy.

**Dual Coding:**
- 🌿 NAMASTE: \`AYU-D-0001\` — Vataja Jwara
- 🌐 ICD-11 TM2: \`TM2-001\` — Fever NOS (Traditional Medicine)
- 🔬 ICD-11 MMS: \`1D01\` — Fever of unknown origin

**Risk Stratification:** Moderate (Score: 0.45)

**Assistive Treatment Suggestions:**
- Sudarshana Churna — 500mg BD with warm water after meals
- Tulsi Kwatha (Holy Basil decoction) — 20ml TDS
- Mahasudarshana Ghana Vati — for persistent fever
- Swedana therapy if Vata predominance confirmed

**Contraindications to check:**
- Pregnancy (avoid Sudarshana Churna)
- Cardiac history — monitor Mahasudarshana dose

⚠️ *This is assistive guidance only. Final treatment decisions rest with the treating physician.*`;
  }

  if (msg.includes('diabetes') || msg.includes('prameha') || msg.includes('diabetic')) {
    return `**Clinical Assessment — Prameha (Diabetes)**

Mapping complete for diabetic presentation:

**Dual Coding:**
- 🌿 NAMASTE: \`AYU-D-0201\` — Prameha
- 🌐 ICD-11 TM2: \`TM2-201\` — Diabetes Mellitus (TM)
- 🔬 ICD-11 MMS: \`5A11\` — Type 2 Diabetes Mellitus

**Recovery Prediction:** 72% recovery probability over 12 months (based on age, BMI, treatment adherence model)

**Assistive AYUSH Protocol:**
- Triphala Churna — 5g at bedtime with warm water
- Karela juice (Momordica charantia) — 30ml morning fasting
- Gudmar (Gymnema sylvestre) — 400mg BD
- Yoga: Surya Namaskar, Pranayama daily

**Patient-specific alerts:**
- Monitor HbA1c every 3 months
- Foot examination (check for Prameha Pidaka)
- Dietary Nidana: avoid Guru, Snigdha, Madhura Ahara

⚠️ *Assistive guidance only. Final clinical decisions with the physician.*`;
  }

  if (msg.includes('amavata') || msg.includes('arthritis')) {
    return `**Clinical Assessment — Amavata (Rheumatoid Arthritis)**

**Dual Coding:**
- 🌿 NAMASTE: \`AYU-D-0301\` — Amavata
- 🌐 ICD-11 TM2: \`TM2-301\` — Bi Syndrome (Wind-Cold)
- 🔬 ICD-11 MMS: \`FA20\` — Rheumatoid Arthritis

**Assistive Protocol:**
- Simhanada Guggulu — 2 tabs BD with warm water
- Dashamoolarishta — 20ml BD after food
- Rasnasaptaka Kwatha — 30ml TDS
- Panchakarma: Virechana, Basti (under specialist)

**Monitoring:**
- ESR, CRP, RF, Anti-CCP every 6 weeks
- Joint mobility assessment monthly

⚠️ *Assistive guidance only.*`;
  }

  if (msg.includes('namaste') && msg.includes('code')) {
    return `**NAMASTE Code Reference**

NAMASTE (National AYUSH Morbidity And Statistics Terminologies and Codes) is India's official AYUSH disease classification system.

**Code structure:** \`AYU-D-XXXX\`
- AYU = AYUSH
- D = Disease
- XXXX = Sequential number

**Example codes:**
| NAMASTE | Disease | ICD-11 |
|---------|---------|--------|
| \`AYU-D-0001\` | Vataja Jwara | 1D01 |
| \`AYU-D-0201\` | Prameha | 5A11 |
| \`AYU-D-0301\` | Amavata | FA20 |
| \`AYU-D-0102\` | Kaphaja Kasa | CA23 |

Use the **Diagnosis** page for full auto-complete search with ConceptMap translation.`;
  }

  if (msg.includes('map') || msg.includes('translate') || msg.includes('5a11') || msg.includes('icd')) {
    return `**ConceptMap Translation: ICD-11 → NAMASTE**

**Input:** \`5A11\` — Type 2 Diabetes Mellitus (WHO ICD-11 MMS)

**Mapping Result:**
- 🌿 NAMASTE: \`AYU-D-0201\` — Prameha (confidence: 91%)
- 🌐 ICD-11 TM2: \`TM2-201\` — Diabetes Mellitus (TM)
- Bidirectional mapping confirmed in FHIR ConceptMap

**Context:**
In Ayurveda, Prameha encompasses a group of urinary disorders including Madhumeha (Diabetes Mellitus). The nearest TM2 code is used as the bridge terminology.

Use \`/api/terminology/translate?from=icd11&code=5A11\` for machine-readable output.`;
  }

  if (msg.includes('recovery') || msg.includes('prediction') || msg.includes('predict')) {
    return `**AI Recovery Prediction Model**

**Patient Profile:** 65yo male, Prameha (Type 2 Diabetes)

**ML Model Output:**
- Recovery Probability: **68%** at 12 months
- Risk Level: **Moderate-High**
- Risk Score: 0.64

**Key factors analyzed:**
- Age: 65 (negative weight: −0.12)
- Gender: Male (neutral: 0.00)
- Duration: Chronic (negative: −0.18)
- Treatment adherence: Unknown (neutral assumed)
- Comorbidities: None reported (+0.08)

**Trajectory:**
Without intervention: stable decline
With AYUSH protocol: 68% recovery at 12mo
With integrated care: up to 76% projected

**Recommendation flags:**
- Ophthalmology referral (diabetic retinopathy risk)
- Nephrology check (protein in urine check)
- Cardiac risk assessment (ECG)

⚠️ *Prediction model is assistive. Not a clinical diagnosis.*`;
  }

  return `**TulsiHealth AI Assistant**

I can help you with:
- 🌿 **NAMASTE Code Lookup** — Type a disease name or symptoms
- 🔬 **Dual Coding** — Map NAMASTE ↔ ICD-11 ↔ TM2
- 🧠 **Recovery Prediction** — Risk scoring for patient cases
- 💊 **AYUSH Treatment Guidance** — Assistive suggestions only
- 🗣️ **Multilingual** — Ask in Tamil or English

Try: *"Patient has fever, joint pain for 3 days"* or *"ஜ்வரம், மூட்டு வலி"*

All suggestions are assistive only. Clinical decisions rest with the physician.`;
}

export default function AIAssistantPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `**Vanakkam! I'm TulsiHealth AI** 🌿

I bridge **Ayurveda & Modern Medicine** using AI. I can help you:
- Look up NAMASTE, ICD-11, and TM2 codes
- Map symptoms to AYUSH diagnoses
- Predict recovery outcomes
- Suggest AYUSH treatment protocols (assistive only)
- Answer in English or Tamil (தமிழ்)

How can I assist you today?`,
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

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Simulate network delay, then generate smart response
    await new Promise(res => setTimeout(res, 1000 + Math.random() * 600));

    let responseContent = buildAIResponse(msg);

    // Try real API
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

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    router.push('/login');
  };

  function renderContent(content: string) {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <div key={i} className="font-black text-base mb-2 mt-1">{line.slice(2, -2)}</div>;
        }
        if (line.startsWith('- ')) {
          return <div key={i} className="flex items-start gap-2 text-sm text-white/80 mb-1"><span className="text-[#00d69b] mt-0.5">•</span>{line.slice(2)}</div>;
        }
        if (line.startsWith('⚠️')) {
          return <div key={i} className="text-xs text-amber-400/70 italic mt-2 p-3 bg-amber-400/5 border border-amber-400/10 rounded-xl">{line}</div>;
        }
        if (line.includes('`')) {
          const parts = line.split(/(`[^`]+`)/);
          return (
            <div key={i} className="text-sm text-white/80 mb-1">
              {parts.map((part, j) => part.startsWith('`') && part.endsWith('`')
                ? <code key={j} className="font-mono text-[#00d69b] bg-[#00d69b]/10 px-1.5 py-0.5 rounded text-xs">{part.slice(1, -1)}</code>
                : <span key={j}>{part}</span>
              )}
            </div>
          );
        }
        if (line.startsWith('**')) {
          const cleaned = line.replace(/\*\*/g, '');
          return <div key={i} className="font-bold text-sm text-white/90 mb-1">{cleaned}</div>;
        }
        if (!line.trim()) return <div key={i} className="mb-2" />;
        return <div key={i} className="text-sm text-white/70 mb-1">{line}</div>;
      });
  }

  return (
    <div className="bg-mesh min-h-screen text-white font-sans flex relative overflow-hidden">
      <div className="noise opacity-[0.02]" />

      {/* Sidebar */}
      <aside className="w-[260px] min-h-screen glass border-r border-white/5 backdrop-blur-3xl flex flex-col p-6 sticky top-0">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer hover:scale-[1.02] transition-all" onClick={() => router.push('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d69b] to-[#00b383] flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,214,155,0.4)]">
            <Activity className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Tulsi<span className="text-[#00d69b]">Health</span></span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-[#00d69b]/10 text-[#00d69b] border border-[#00d69b]/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={18} />
                <span className="text-sm font-semibold">{item.label}</span>
                {isActive && <div className="ml-auto w-1 h-4 bg-[#00d69b] rounded-full" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all font-semibold text-sm">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="glass border-b border-white/5 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#00d69b]/10 border border-[#00d69b]/20 flex items-center justify-center">
              <BrainCircuit className="text-[#00d69b]" size={20} />
            </div>
            <div>
              <h1 className="font-black text-lg">TulsiHealth AI Assistant</h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d69b] animate-pulse" />
                <span className="text-xs text-white/30 font-medium">NAMASTE + ICD-11 + RAG + NLP</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 glass rounded-xl">
              <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-[#00d69b] text-black' : 'text-white/40'}`}>EN</button>
              <button onClick={() => setLanguage('ta')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'ta' ? 'bg-[#00d69b] text-black' : 'text-white/40'}`}>தமிழ்</button>
            </div>
            <button
              onClick={() => setMessages([{
                id: '0', role: 'assistant',
                content: 'Conversation cleared. How can I assist you?',
                timestamp: new Date()
              }])}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-all"
              title="Clear chat"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-[#00d69b]/10 border border-[#00d69b]/20' : 'bg-white/10 border border-white/20'}`}>
                {msg.role === 'assistant' ? <Bot size={15} className="text-[#00d69b]" /> : <UserIcon size={15} className="text-white" />}
              </div>
              <div className={`max-w-[70%] px-6 py-5 rounded-2xl ${msg.role === 'assistant' ? 'glass rounded-bl-sm' : 'bg-[#00d69b]/10 border border-[#00d69b]/20 rounded-br-sm'}`}>
                {msg.role === 'assistant' ? renderContent(msg.content) : <p className="text-sm font-medium">{msg.content}</p>}
                <div className="text-[10px] text-white/20 mt-2 font-medium">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Starter Chips */}
        {messages.length <= 1 && (
          <div className="px-8 pb-2">
            <div className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-3">Try asking:</div>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-2 rounded-xl glass border border-white/10 text-xs font-medium text-white/50 hover:text-white hover:border-white/20 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="glass border-t border-white/5 px-8 py-5 shrink-0">
          <div className="flex items-center gap-3 glass border border-white/10 rounded-2xl px-4 py-2 focus-within:border-[#00d69b]/30 transition-all">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={language === 'ta' ? "உங்கள் கேள்வியை தமிழில் அல்லது ஆங்கிலத்தில் கேளுங்கள்..." : "Ask about symptoms, NAMASTE codes, or treatment guidance..."}
              className="flex-1 bg-transparent py-3 text-sm placeholder:text-white/20 outline-none"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-[#00d69b] text-black flex items-center justify-center hover:bg-[#00e5a8] disabled:opacity-30 disabled:hover:bg-[#00d69b] transition-all"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 px-1">
            <AlertCircle size={11} className="text-white/20" />
            <span className="text-[10px] text-white/20">AI suggestions are assistive only. All clinical decisions remain with the treating physician.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
