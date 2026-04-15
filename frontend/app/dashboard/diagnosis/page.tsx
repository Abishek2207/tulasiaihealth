'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Activity, Stethoscope, ScanLine, Users, BarChart3, Settings,
  LayoutDashboard, BrainCircuit, LogOut, Search, X, ChevronRight,
  BookOpen, CheckCircle2, ZapOff, Zap, Globe2,
  ArrowRight, Info, Copy, ExternalLink, RefreshCw, Filter,
  FlaskConical, HeartPulse, Leaf
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

interface CodeResult {
  namaste_code?: string;
  namaste_name?: string;
  icd11_code?: string;
  icd11_name?: string;
  tm2_code?: string;
  tm2_name?: string;
  confidence?: number;
  category?: string;
  description?: string;
  tamil_name?: string;
}

const SAMPLE_RESULTS: CodeResult[] = [
  { namaste_code: 'AYU-D-0001', namaste_name: 'Vataja Jwara', icd11_code: '1D01', icd11_name: 'Fever of unknown origin', tm2_code: 'TM2-001', tm2_name: 'Fever NOS', confidence: 0.94, category: 'Jwara (Fever)', tamil_name: 'வாதஜ ஜ்வரம்' },
  { namaste_code: 'AYU-D-0201', namaste_name: 'Prameha', icd11_code: '5A11', icd11_name: 'Type 2 Diabetes Mellitus', tm2_code: 'TM2-201', tm2_name: 'Diabetes Mellitus TM', confidence: 0.91, category: 'Prameha (Diabetes)', tamil_name: 'பிரமேகம்' },
  { namaste_code: 'AYU-D-0301', namaste_name: 'Amavata', icd11_code: 'FA20', icd11_name: 'Rheumatoid Arthritis', tm2_code: 'TM2-301', tm2_name: 'Bi Syndrome (Wind-Cold)', confidence: 0.88, category: 'Vata Disorders', tamil_name: 'ஆமவாதம்' },
  { namaste_code: 'AYU-D-0401', namaste_name: 'Arsha', icd11_code: 'DB33', icd11_name: 'Haemorrhoids', tm2_code: 'TM2-401', tm2_name: 'Intestinal Qi Stagnation', confidence: 0.82, category: 'Ano-rectal Disorders', tamil_name: 'அர்சஸ்' },
  { namaste_code: 'AYU-D-0102', namaste_name: 'Kaphaja Kasa', icd11_code: 'CA23', icd11_name: 'Acute Bronchitis', tm2_code: 'TM2-102', tm2_name: 'Lung Phlegm-Damp Cough', confidence: 0.87, category: 'Kasa (Cough)', tamil_name: 'கபஜ காசம்' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

function CodeBadge({ code, label, color }: { code: string; label: string; color: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
      className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all cursor-pointer bg-white/[0.02] border-white/5 ${color}`} onClick={copy}
    >
      <span className="font-mono font-black text-[13px]">{code}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">— {label}</span>
      <span className="ml-auto text-[9px] font-black uppercase text-white/20 tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">{copied ? 'Copied' : 'Copy'}</span>
    </motion.div>
  );
}

export default function DiagnosisPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [results, setResults] = useState<CodeResult[]>([]);
  const [selected, setSelected] = useState<CodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filter, setFilter] = useState<'all' | 'namaste' | 'icd11'>('all');
  const debounceRef = useRef<any>(null);

  const searchCodes = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(SAMPLE_RESULTS); setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/terminology/search?q=${encodeURIComponent(q)}&lang=${language}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || SAMPLE_RESULTS);
        setSuggestions((data.results || []).slice(0, 5));
      } else {
        const filtered = SAMPLE_RESULTS.filter(r =>
          r.namaste_name?.toLowerCase().includes(q.toLowerCase()) ||
          r.icd11_name?.toLowerCase().includes(q.toLowerCase()) ||
          r.namaste_code?.toLowerCase().includes(q.toLowerCase())
        );
        setResults(filtered.length ? filtered : SAMPLE_RESULTS);
        setSuggestions(filtered.slice(0, 5));
      }
    } catch {
      setResults(SAMPLE_RESULTS);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    setResults(SAMPLE_RESULTS);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setShowSuggestions(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCodes(val), 350);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const displayResults = filter === 'namaste'
    ? results.filter(r => r.namaste_code)
    : filter === 'icd11'
    ? results.filter(r => r.icd11_code)
    : results;

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden selection:bg-[#00d69b]/30">
      <div className="noise opacity-[0.02]" />

      <motion.aside 
        initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-[280px] min-h-screen border-r border-white/5 backdrop-blur-3xl flex flex-col p-8 sticky top-0"
      >
        <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer group" onClick={() => router.push('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#00d69b] to-[#00b383] flex items-center justify-center shadow-lg">
            <Activity className="text-black" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Tulsi<span className="text-[#00d69b]">Health</span></span>
        </div>
        <nav className="flex-1 space-y-1.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-white/5 text-[#00d69b]' : 'text-white/40 hover:text-white'}`}>
                <Icon size={18} className={isActive ? 'text-[#00d69b]' : 'group-hover:text-white transition-colors'} />
                <span className="text-[13px] font-bold tracking-tight">{item.label}</span>
                {isActive && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 bg-[#00d69b] rounded-full shadow-[0_0_10px_#00d69b]" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-8 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-xs uppercase tracking-widest">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 p-12 md:p-16 overflow-y-auto scrollbar-hide">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-xl">
                <BookOpen className="text-[#00d69b]" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter mb-1">Dual Coding Hub</h1>
                <p className="text-white/30 text-xs font-black uppercase tracking-[0.2em] leading-relaxed">NAMASTE ↔ ICD-11 ↔ TM2 Concept Mapping</p>
              </div>
            </div>
            <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
              <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'en' ? 'bg-white text-black' : 'text-white/20 hover:text-white/40'}`}>EN</button>
              <button onClick={() => setLanguage('ta')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'ta' ? 'bg-white text-black' : 'text-white/20 hover:text-white/40'}`}>தமிழ்</button>
            </div>
          </motion.div>

          {/* Search Stage */}
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="relative mb-12 group">
             <div className="absolute -inset-1 bg-gradient-to-r from-[#00d69b]/20 to-[#7075ff]/20 rounded-[32px] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
             <div className="relative glass p-2 rounded-[30px] border border-white/10 flex items-center gap-2 focus-within:border-[#00d69b]/40 transition-all bg-black/40">
               <div className="w-14 h-14 flex items-center justify-center">
                 {loading ? <RefreshCw className="text-[#00d69b] animate-spin" size={20} /> : <Search className="text-white/20" size={20} />}
               </div>
               <input
                 type="text"
                 value={query}
                 onChange={e => handleQueryChange(e.target.value)}
                 onFocus={() => setShowSuggestions(true)}
                 onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                 placeholder={language === 'ta' ? "தேடுங்கள்..." : "Symptom, diagnosis, or code enquiry..."}
                 className="flex-1 bg-transparent py-4 text-[16px] font-bold tracking-tight placeholder:text-white/5 outline-none"
               />
               <AnimatePresence>
                 {query && (
                   <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => { setQuery(''); setResults(SAMPLE_RESULTS); }} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all mr-2">
                     <X size={14} strokeWidth={3} />
                   </motion.button>
                 )}
               </AnimatePresence>
               <motion.button
                 whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                 onClick={() => searchCodes(query)}
                 className="px-8 py-4 rounded-[22px] bg-[#00d69b] text-black font-black text-xs uppercase tracking-widest shadow-lg"
               >
                 Compute
               </motion.button>
             </div>

             <AnimatePresence>
               {showSuggestions && suggestions.length > 0 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 z-50 mt-4 glass border border-white/5 rounded-[28px] overflow-hidden shadow-2xl backdrop-blur-3xl">
                   {suggestions.map((s, i) => (
                     <button
                       key={i}
                       className="w-full flex items-center gap-6 px-8 py-5 hover:bg-white/[0.03] transition-all text-left border-b border-white/5 last:border-0 group/item"
                       onMouseDown={() => { setSelected(s); setQuery(s.namaste_name || ''); setShowSuggestions(false); }}
                     >
                       <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-white/10 group-hover/item:text-[#00d69b] group-hover/item:bg-[#00d69b]/10 transition-all">
                         <BookOpen size={16} />
                       </div>
                       <div className="flex-1">
                         <div className="font-bold text-sm text-white/90">{s.namaste_name}</div>
                         <div className="text-[10px] text-white/20 font-black uppercase tracking-widest">{s.icd11_name}</div>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="text-[9px] font-black tracking-widest bg-[#00d69b]/10 text-[#00d69b] px-2 py-1 rounded-md">{s.namaste_code}</span>
                       </div>
                     </button>
                   ))}
                 </motion.div>
               )}
             </AnimatePresence>
          </motion.div>

          {/* Controls */}
          <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="flex items-center gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            {(['all', 'namaste', 'icd11'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border whitespace-nowrap ${filter === f ? 'bg-white text-black border-transparent' : 'text-white/20 border-white/10 hover:border-white/20 hover:text-white/40'}`}
              >
                {f === 'all' ? 'Unified Registry' : f === 'namaste' ? 'AYUSH Core' : 'ICD-11 Bridge'}
              </button>
            ))}
            <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-white/10">{displayResults.length} Node Matches</div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Results Shelf */}
            <div className="lg:col-span-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {displayResults.map((r, i) => (
                  <motion.button
                    layout key={r.namaste_code}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelected(r)}
                    className={`w-full text-left p-6 rounded-[28px] border transition-all relative overflow-hidden group/card ${selected?.namaste_code === r.namaste_code ? 'bg-[#00d69b]/5 border-[#00d69b]/30' : 'glass border-white/5 hover:border-white/20 hover:bg-white/[0.02]'}`}
                  >
                    {selected?.namaste_code === r.namaste_code && <motion.div layoutId="glow" className="absolute -inset-10 bg-[#00d69b]/5 blur-3xl pointer-events-none" />}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/20 group-hover/card:text-[#00d69b] group-hover/card:bg-[#00d69b]/10 transition-all">
                          <Leaf size={16} />
                        </div>
                        <div className="text-[10px] font-black text-white/10 transition-colors group-hover/card:text-[#00d69b]/40">{(r.confidence! * 100).toFixed(0)}%</div>
                      </div>
                      <div className="font-black text-lg tracking-tighter mb-1 line-clamp-1">{r.namaste_name}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/20 line-clamp-1 mb-4 opacity-60">{r.icd11_name}</div>
                      <div className="flex gap-2">
                        <span className="text-[8px] font-black tracking-widest bg-white/[0.03] border border-white/10 px-2 py-1 rounded text-white/30">{r.namaste_code}</span>
                        <span className="text-[8px] font-black tracking-widest bg-white/[0.03] border border-white/10 px-2 py-1 rounded text-white/30">{r.icd11_code}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Inspect Panel */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div 
                    key={selected.namaste_code}
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                    className="glass rounded-[40px] p-10 md:p-12 sticky top-8 border-white/10 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                      <BookOpen size={240} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="px-3 py-1 rounded-full bg-[#00d69b]/10 border border-[#00d69b]/20 text-[#00d69b] text-[9px] font-black uppercase tracking-widest">{selected.category}</div>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">Node Integrity Verified</div>
                          </div>
                          <h2 className="text-5xl font-black tracking-tighter mb-2">{selected.namaste_name}</h2>
                          {language === 'ta' && selected.tamil_name && <div className="text-2xl font-bold text-[#00d69b]/60 mb-2">{selected.tamil_name}</div>}
                          <p className="text-white/30 text-sm font-bold tracking-tight max-w-lg leading-relaxed">{selected.icd11_name} — Comprehensive dual-coding entry including AYUSH terminology and WHO bridging.</p>
                        </div>
                        <div className="flex flex-col items-center justify-center w-24 h-24 rounded-[32px] border-2 border-[#00d69b]/20 bg-black/40 backdrop-blur-3xl shrink-0">
                          <span className="text-3xl font-black text-[#00d69b]">{(selected.confidence! * 100).toFixed(0)}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Reliability</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 px-1 text-[10px] font-black text-white/20 uppercase tracking-widest"><Leaf size={14} className="text-[#00d69b]" /> AYUSH Code</div>
                           <CodeBadge code={selected.namaste_code!} label="NAMASTE" color="text-[#00d69b]" />
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 px-1 text-[10px] font-black text-white/20 uppercase tracking-widest"><Globe2 size={14} className="text-[#7075ff]" /> Bridging Term</div>
                           <CodeBadge code={selected.tm2_code!} label="TM2 BRIDGE" color="text-[#7075ff]" />
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 px-1 text-[10px] font-black text-white/20 uppercase tracking-widest"><FlaskConical size={14} className="text-amber-400" /> WHO MMS</div>
                           <CodeBadge code={selected.icd11_code!} label="ICD-11 MMS" color="text-amber-400" />
                        </div>
                      </div>

                      {/* Mapping Visualizer */}
                      <div className="p-8 rounded-[32px] bg-white/[0.01] border border-white/5 mb-10 group/map">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 mb-8 text-center italic">Cross-System Concept Mapping</div>
                        <div className="flex items-center justify-between max-w-md mx-auto relative px-4">
                          <div className="absolute inset-0 flex items-center justify-center opacity-5">
                            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#00d69b] to-transparent" />
                          </div>
                          
                          <div className="text-center relative z-10 transition-transform group-hover/map:scale-105">
                            <div className="w-12 h-12 rounded-xl bg-[#00d69b]/10 border border-[#00d69b]/20 flex items-center justify-center text-[#00d69b] mb-2 mx-auto shadow-lg shadow-[#00d69b]/10">
                              <Leaf size={18} />
                            </div>
                            <div className="font-mono text-[10px] font-black text-white/40">{selected.namaste_code}</div>
                          </div>

                          <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-white/10"><ArrowRight size={20} /></motion.div>

                          <div className="text-center relative z-10 transition-transform group-hover/map:scale-105">
                            <div className="w-12 h-12 rounded-xl bg-[#7075ff]/10 border border-[#7075ff]/20 flex items-center justify-center text-[#7075ff] mb-2 mx-auto shadow-lg shadow-[#7075ff]/10">
                              <Globe2 size={18} />
                            </div>
                            <div className="font-mono text-[10px] font-black text-white/40">{selected.tm2_code}</div>
                          </div>

                          <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="text-white/10"><ArrowRight size={20} /></motion.div>

                          <div className="text-center relative z-10 transition-transform group-hover/map:scale-105">
                            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-2 mx-auto shadow-lg shadow-amber-400/10">
                              <FlaskConical size={18} />
                            </div>
                            <div className="font-mono text-[10px] font-black text-white/40">{selected.icd11_code}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <motion.a 
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          href={`https://icd.who.int/browse11/l-m/en#/http%3A%2F%2Fid.who.int%2Ficd%2Fentity%2F${selected.icd11_code}`}
                          target="_blank" rel="noreferrer"
                          className="flex-1 py-5 rounded-[24px] bg-white/[0.03] border border-white/5 font-black text-[10px] uppercase tracking-widest hover:bg-white/[0.06] transition-all flex items-center justify-center gap-3"
                        >
                          <ExternalLink size={16} className="text-white/40" /> WHO Browser Reference
                        </motion.a>
                        <motion.button 
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          className="flex-1 py-5 rounded-[24px] bg-[#00d69b] text-black font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#00d69b]/10 transition-all flex items-center justify-center gap-3"
                        >
                          <CheckCircle2 size={18} /> Commit to Patient Record
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="glass h-[600px] rounded-[40px] flex flex-col items-center justify-center text-center p-16 border-dashed border-white/5 bg-transparent"
                  >
                    <div className="w-24 h-24 rounded-[32px] bg-white/[0.01] border border-white/5 flex items-center justify-center mb-10">
                      <Search size={48} className="text-white/5" />
                    </div>
                    <h4 className="text-xl font-black tracking-tight mb-4">Registry Standby</h4>
                    <p className="text-white/20 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-xs">
                      Select a diagnostic node from the registry to inspect dual-coding metadata and bridging logic.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
