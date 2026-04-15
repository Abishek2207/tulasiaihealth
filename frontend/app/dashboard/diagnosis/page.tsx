'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, Stethoscope, ScanLine, Users, BarChart3, Settings,
  LayoutDashboard, BrainCircuit, LogOut, Search, X, ChevronRight,
  BookOpen, Loader2, CheckCircle2, ZapOff, Zap, Globe2,
  ArrowRight, Info, Copy, ExternalLink, RefreshCw, Filter,
  FlaskConical, HeartPulse, Leaf
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

function CodeBadge({ code, label, color }: { code: string; label: string; color: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${color}`} onClick={copy}>
      <span className="font-mono font-black text-xs">{code}</span>
      <span className="text-[10px] opacity-60">— {label}</span>
      <span className="ml-auto text-[9px] opacity-0 group-hover:opacity-60 transition-opacity">{copied ? 'Copied!' : 'Copy'}</span>
    </div>
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
    if (!q.trim()) { setResults([]); setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/terminology/search?q=${encodeURIComponent(q)}&lang=${language}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSuggestions((data.results || []).slice(0, 5));
      } else {
        // Fallback to local sample
        const filtered = SAMPLE_RESULTS.filter(r =>
          r.namaste_name?.toLowerCase().includes(q.toLowerCase()) ||
          r.icd11_name?.toLowerCase().includes(q.toLowerCase()) ||
          r.namaste_code?.toLowerCase().includes(q.toLowerCase()) ||
          r.tamil_name?.includes(q)
        );
        setResults(filtered.length ? filtered : SAMPLE_RESULTS);
        setSuggestions((filtered.length ? filtered : SAMPLE_RESULTS).slice(0, 5));
      }
    } catch {
      const filtered = SAMPLE_RESULTS.filter(r =>
        r.namaste_name?.toLowerCase().includes(q.toLowerCase()) ||
        r.icd11_name?.toLowerCase().includes(q.toLowerCase())
      );
      setResults(filtered.length ? filtered : SAMPLE_RESULTS);
      setSuggestions((filtered.length ? filtered : SAMPLE_RESULTS).slice(0, 5));
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    router.push('/login');
  };

  const displayResults = filter === 'namaste'
    ? results.filter(r => r.namaste_code)
    : filter === 'icd11'
    ? results.filter(r => r.icd11_code)
    : results;

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

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#7075ff]/10 border border-[#7075ff]/20 flex items-center justify-center">
                <BookOpen className="text-[#7075ff]" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Diagnosis & Dual Coding</h1>
                <p className="text-white/40 font-medium">NAMASTE AYUSH ↔ WHO ICD-11 ↔ TM2 ConceptMap</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <div className="flex items-center gap-1 p-1 glass rounded-xl">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-[#00d69b] text-black' : 'text-white/40 hover:text-white'}`}>EN</button>
                <button onClick={() => setLanguage('ta')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'ta' ? 'bg-[#00d69b] text-black' : 'text-white/40 hover:text-white'}`}>தமிழ்</button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="glass p-1.5 rounded-2xl border border-white/10 flex items-center gap-3 focus-within:border-[#00d69b]/40 transition-all shadow-[0_0_0_0px_rgba(0,214,155,0)] focus-within:shadow-[0_0_0_4px_rgba(0,214,155,0.08)]">
              {loading ? <Loader2 className="ml-4 text-[#00d69b] animate-spin shrink-0" size={20} /> : <Search className="ml-4 text-white/30 shrink-0" size={20} />}
              <input
                type="text"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={language === 'ta' ? "நோய் பெயர் அல்லது குறியீட்டை தேடுங்கள்..." : "Search by disease name, symptom, or code (e.g. 'Vataja Jwara', 'Fever', 'AYU-D-0001')..."}
                className="flex-1 bg-transparent py-4 text-sm font-medium placeholder:text-white/20 outline-none text-white"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults(SAMPLE_RESULTS); }} className="mr-2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                  <X size={13} />
                </button>
              )}
              <button
                onClick={() => searchCodes(query)}
                className="mr-2 px-5 py-3 rounded-xl bg-[#00d69b] text-black font-black text-sm hover:bg-[#00e5a8] transition-all flex items-center gap-2 shrink-0"
              >
                <Zap size={15} /> Search
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 glass border border-white/10 rounded-2xl overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all text-left border-b border-white/5 last:border-0"
                    onMouseDown={() => { setSelected(s); setQuery(s.namaste_name || ''); setShowSuggestions(false); }}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-sm">{s.namaste_name}</div>
                      <div className="text-xs text-white/30">{s.icd11_name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#00d69b] bg-[#00d69b]/10 px-2 py-0.5 rounded">{s.namaste_code}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{s.icd11_code}</span>
                    </div>
                    <div className="text-[10px] text-white/20">{((s.confidence || 0) * 100).toFixed(0)}% match</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs text-white/30 font-bold uppercase tracking-widest">Filter:</span>
            {(['all', 'namaste', 'icd11'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${filter === f ? 'bg-[#00d69b]/10 text-[#00d69b] border-[#00d69b]/30' : 'text-white/30 border-white/10 hover:text-white hover:border-white/20'}`}
              >
                {f === 'all' ? 'All Systems' : f === 'namaste' ? 'NAMASTE AYUSH' : 'WHO ICD-11'}
              </button>
            ))}
            <div className="ml-auto text-xs text-white/20">{displayResults.length} results</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Results List */}
            <div className="lg:col-span-2 space-y-3">
              {displayResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left p-5 glass rounded-2xl transition-all hover:border-white/15 ${selected === r ? 'border-[#00d69b]/40 bg-[#00d69b]/[0.04]' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-black text-sm">{r.namaste_name}</div>
                      {language === 'ta' && r.tamil_name && <div className="text-xs text-[#00d69b]/60 mt-0.5">{r.tamil_name}</div>}
                      <div className="text-xs text-white/40 mt-0.5">{r.icd11_name}</div>
                    </div>
                    <div className="text-xs font-black text-white/20">{((r.confidence || 0) * 100).toFixed(0)}%</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.namaste_code && <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#00d69b]/10 text-[#00d69b] border border-[#00d69b]/20 rounded">{r.namaste_code}</span>}
                    {r.tm2_code && <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#7075ff]/10 text-[#7075ff] border border-[#7075ff]/20 rounded">{r.tm2_code}</span>}
                    {r.icd11_code && <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded">{r.icd11_code}</span>}
                  </div>
                  {r.category && <div className="text-[10px] text-white/20 mt-2 font-medium">{r.category}</div>}
                </button>
              ))}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-3">
              {selected ? (
                <div className="glass p-8 sticky top-8">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">{selected.category}</div>
                      <h2 className="text-2xl font-black tracking-tight">{selected.namaste_name}</h2>
                      {language === 'ta' && selected.tamil_name && <div className="text-lg font-bold text-[#00d69b]/70 mt-1">{selected.tamil_name}</div>}
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-[#00d69b]/10 border border-[#00d69b]/30 text-[#00d69b] font-black text-sm">
                      {((selected.confidence || 0) * 100).toFixed(0)}% match
                    </div>
                  </div>

                  {/* Three Coding Systems */}
                  <div className="space-y-3 mb-8">
                    <div className="p-5 rounded-2xl bg-[#00d69b]/[0.05] border border-[#00d69b]/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Leaf size={14} className="text-[#00d69b]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00d69b]/60">NAMASTE AYUSH Code</span>
                      </div>
                      <CodeBadge code={selected.namaste_code!} label={selected.namaste_name!} color="bg-[#00d69b]/5 border-[#00d69b]/20 text-[#00d69b]" />
                    </div>

                    <div className="p-5 rounded-2xl bg-[#7075ff]/[0.05] border border-[#7075ff]/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe2 size={14} className="text-[#7075ff]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7075ff]/60">WHO ICD-11 TM2 Code</span>
                      </div>
                      <CodeBadge code={selected.tm2_code!} label={selected.tm2_name || ''} color="bg-[#7075ff]/5 border-[#7075ff]/20 text-[#7075ff]" />
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-400/[0.05] border border-amber-400/20">
                      <div className="flex items-center gap-2 mb-3">
                        <FlaskConical size={14} className="text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60">WHO ICD-11 Biomedicine (MMS)</span>
                      </div>
                      <CodeBadge code={selected.icd11_code!} label={selected.icd11_name!} color="bg-amber-400/5 border-amber-400/20 text-amber-400" />
                    </div>
                  </div>

                  {/* ConceptMap Arrow */}
                  <div className="flex items-center justify-center gap-4 mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-center">
                      <div className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1">NAMASTE</div>
                      <div className="font-mono font-black text-sm text-[#00d69b]">{selected.namaste_code}</div>
                    </div>
                    <ArrowRight size={16} className="text-white/20" />
                    <div className="text-center">
                      <div className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1">TM2</div>
                      <div className="font-mono font-black text-sm text-[#7075ff]">{selected.tm2_code}</div>
                    </div>
                    <ArrowRight size={16} className="text-white/20" />
                    <div className="text-center">
                      <div className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1">ICD-11</div>
                      <div className="font-mono font-black text-sm text-amber-400">{selected.icd11_code}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://icd.who.int/browse11/l-m/en#/http%3A%2F%2Fid.who.int%2Ficd%2Fentity%2F${selected.icd11_code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 p-4 rounded-2xl glass border border-white/10 hover:bg-white/10 transition-all text-sm font-bold"
                    >
                      <ExternalLink size={15} /> WHO ICD-11 Browser
                    </a>
                    <button className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#00d69b] text-black font-black text-sm hover:bg-[#00e5a8] transition-all">
                      <CheckCircle2 size={15} /> Apply to EMR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass h-[500px] flex flex-col items-center justify-center text-center p-12 border-dashed bg-transparent">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <BookOpen size={36} className="text-white/10" />
                  </div>
                  <h4 className="text-lg font-bold mb-3">Select a Diagnosis</h4>
                  <p className="text-white/30 text-sm leading-relaxed max-w-xs">Click any result on the left to see the full dual-coding breakdown with NAMASTE, TM2, and ICD-11 codes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
