'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, 
  Activity, 
  Stethoscope, 
  Save, 
  QrCode, 
  ArrowRight,
  LayoutDashboard, 
  ScanLine, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Mic,
  BrainCircuit,
  Database,
  ShieldCheck,
  Plus,
  RefreshCcw,
  FileJson
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const MOCK_SUGGESTIONS = [
  { code: 'NAMASTE-015', display: 'Vataja Jwara (Fever)', system: 'NAMASTE', icd11: '1D01', icd11_display: 'Typhoid fever', dosha: 'Vata', system_type: 'Ayurveda' },
  { code: 'NAMASTE-013', display: 'Kasa (Cough)', system: 'NAMASTE', icd11: 'CA23', icd11_display: 'Acute bronchitis', dosha: 'Kapha', system_type: 'Ayurveda' },
  { code: 'NAMASTE-005', display: 'Madhumeha (Diabetes)', system: 'NAMASTE', icd11: '5A00', icd11_display: 'Type 2 diabetes mellitus', dosha: 'Vata-Kapha', system_type: 'Ayurveda' },
  { code: 'NAMASTE-008', display: 'Sandhivata (Arthritis)', system: 'NAMASTE', icd11: 'FA20', icd11_display: 'Osteoarthritis of knee', dosha: 'Vata', system_type: 'Ayurveda' },
];

export default function EMRPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      setUser({ name: 'Dr. Abishek', role: 'Chief Medical Officer' });
    } else {
      setUser(JSON.parse(u));
    }
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim().length < 2) { 
        setSuggestions([]); 
        setDropdownOpen(false); 
        return; 
      }
      if (selected && selected.display === query) return;
      
      setLoading(true);
      // Simulate real-world search with AI scoring
      const q = query.toLowerCase();
      const filtered = MOCK_SUGGESTIONS.filter(s =>
        s.display.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
      );
      
      // Artificial delay for premium feel
      setTimeout(() => {
        setSuggestions(filtered);
        setDropdownOpen(filtered.length > 0);
        setLoading(false);
      }, 300);
    }, 350);
    return () => clearTimeout(delay);
  }, [query, selected]);

  const handleSelect = (item: any) => {
    setIsAiProcessing(true);
    setSelected(item);
    setQuery(item.display);
    setSuggestions([]);
    setDropdownOpen(false);
    
    // Simulate AI dual-coding engine translation
    setTimeout(() => {
      setIsAiProcessing(false);
      setSaved(false);
    }, 800);
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      // In real scenario, post to /api/fhir/condition
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="bg-mesh min-h-screen text-white font-sans flex relative overflow-hidden">
      <div className="noise opacity-[0.02]" />
      
      {/* ── Sidebar ── */}
      <aside className="w-[280px] min-h-screen glass border-r border-white/5 backdrop-blur-3xl flex flex-col p-6 sticky top-0">
        <div className="flex items-center gap-3 mb-10 px-2 transition-all hover:scale-[1.02] cursor-pointer" onClick={() => router.push('/')}>
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
                <Icon size={18} className={isActive ? 'text-[#00d69b]' : 'group-hover:text-white'} />
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

      {/* ── Main Content ── */}
      <main className="flex-1 p-8 md:p-12 relative z-10 overflow-y-auto">
        <div className="max-w-[1000px] mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-10 animate-fade-up">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00d69b]/10 border border-[#00d69b]/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,214,155,0.1)]">
                <Stethoscope className="text-[#00d69b]" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Smart Dual-Coding EMR</h1>
                <p className="text-white/40 font-medium">AYUSH NAMASTE ↔ WHO ICD-11 · Native FHIR R4</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="badge badge-green flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#00d69b] animate-pulse" />
                 AI ENGINE ACTIVE
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Search & Input Panel */}
              <div className="glass p-8 relative animate-fade-up delay-100">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-6">
                  Perform Clinical Search
                </label>
                
                <div className="relative group">
                  <Search className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${query ? 'text-white' : 'text-white/20'}`} size={20} />
                  <input
                    ref={inputRef}
                    className="w-full pl-14 pr-32 py-5 bg-white/5 border-2 border-white/5 rounded-2xl text-lg font-semibold focus:bg-white/10 focus:border-[#00d69b]/40 transition-all outline-none"
                    placeholder="Enter Symptom (e.g. Fever, Amavata, Kasa...)"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelected(null); }}
                  />
                  
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {loading && <Loader2 className="animate-spin text-[#00d69b]" size={20} />}
                    <button className="p-2 rounded-xl hover:bg-white/10 text-white/30 transition-colors">
                      <Mic size={20} />
                    </button>
                  </div>

                  {/* Dropdown Suggestions */}
                  {dropdownOpen && (
                    <div className="absolute top-full mt-4 w-full glass border border-white/10 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden z-[200] animate-fade-up">
                      <div className="p-3 bg-white/5 border-b border-white/5 text-[9px] font-black tracking-widest text-white/30 uppercase">
                        AI Suggested Mappings
                      </div>
                      {suggestions.map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleSelect(item)}
                          className="flex items-center justify-between p-5 hover:bg-[#00d69b]/5 cursor-pointer border-b border-white/5 last:border-0 group transition-all"
                        >
                          <div>
                            <div className="font-bold text-white group-hover:text-[#00d69b] transition-colors">{item.display}</div>
                            <div className="text-xs text-white/30 truncate max-w-[300px]">ICD-11: {item.icd11_display}</div>
                          </div>
                          <div className="flex gap-2">
                             <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-white/60">{item.code}</span>
                             <span className="text-[10px] font-bold px-2 py-1 bg-[#00d69b]/10 rounded-lg border border-[#00d69b]/20 text-[#00d69b]">{item.icd11}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-2 opacity-50">
                   <span className="text-xs font-bold text-white/40">Quick Search:</span>
                   {['Fever', 'Diabetes', 'Joint Pain', 'Migraine'].map(k => (
                     <button key={k} onClick={() => setQuery(k)} className="text-[10px] font-bold border border-white/10 rounded-lg px-3 py-1 hover:bg-white/10 transition-colors uppercase">{k}</button>
                   ))}
                </div>
              </div>

              {/* Diagnosis Details Card */}
              {selected && (
                <div className={`glass overflow-hidden transition-all duration-500 animate-fade-up ${isAiProcessing ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
                  <div className="p-8 border-b border-white/5 bg-gradient-to-r from-[#00d69b]/5 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[#00d69b]">
                      <Sparkles size={18} />
                      <span className="text-sm font-black tracking-widest uppercase">Dual-Coding Engine Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="badge badge-gold font-bold">{selected.system_type}</div>
                      <div className="badge badge-blue font-bold">FHIR R4</div>
                    </div>
                  </div>
                  
                  <div className="p-8 lg:p-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                      {/* Traditional Card */}
                      <div className="flex-1 w-full p-6 rounded-3xl bg-white/[0.03] border border-white/5 relative">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#ffb84d] mb-4">NAMASTE (AYUSH)</div>
                        <h4 className="text-2xl font-bold mb-2">{selected.display}</h4>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-lg bg-[#ffb84d]/10 border border-[#ffb84d]/20 text-[#ffb84d] font-mono text-xs">{selected.code}</span>
                          <span className="text-xs text-white/30 font-medium">Dosha: {selected.dosha}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <ArrowRight size={28} className="text-[#00d69b]" />
                        <span className="text-[9px] font-black tracking-widest">MAP</span>
                      </div>

                      {/* Modern Card */}
                      <div className="flex-1 w-full p-6 rounded-3xl bg-[#00d69b]/[0.02] border border-[#00d69b]/10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#00d69b] mb-4">WHO ICD-11 MMS</div>
                        <h4 className="text-2xl font-bold mb-2">{selected.icd11_display}</h4>
                        <span className="px-3 py-1 rounded-lg bg-[#00d69b]/10 border border-[#00d69b]/20 text-[#00d69b] font-mono text-xs">{selected.icd11}</span>
                      </div>
                    </div>

                    <div className="mt-10 pt-10 border-t border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <h5 className="text-sm font-black tracking-widest uppercase text-white/30 flex items-center gap-2">
                          <FileJson size={14} /> FHIR Condition Resource Preview
                        </h5>
                        <button className="text-[10px] font-bold text-[#00d69b] hover:underline flex items-center gap-1">
                          <RefreshCcw size={10} /> Regenerate
                        </button>
                      </div>
                      
                      <div className="p-6 rounded-2xl bg-[#030308] border border-white/5 text-[12px] font-mono text-white/40 leading-relaxed overflow-x-auto">
                        <pre>
{`{
  "resourceType": "Condition",
  "id": "tulsi-diag-${selected.code.toLowerCase()}",
  "clinicalStatus": { "coding": [{ "code": "active" }] },
  "code": {
    "coding": [
      { "system": "http://tulsihealth.in/namaste", "code": "${selected.code}" },
      { "system": "http://id.who.int/icd11", "code": "${selected.icd11}" }
    ]
  },
  "subject": { "reference": "Patient/demo-123" }
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                      <button 
                        onClick={handleSave}
                        disabled={loading}
                        className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all ${saved ? 'bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-[#00d69b] text-black shadow-[0_12px_32px_-8px_rgba(0,214,155,0.4)] hover:scale-[1.02] active:scale-[0.98]'}`}
                      >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : 
                         saved ? <><CheckCircle2 size={24} /> Successfully Coded!</> : 
                         <><Save size={24} /> Save Dual-Coding</>}
                      </button>
                      <button className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <QrCode size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Tools */}
            <div className="space-y-6 animate-fade-up delay-200">
              <div className="glass p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <BrainCircuit className="text-[#00d69b]" size={20} /> AI Clinical Insights
                </h3>
                <div className="p-6 rounded-2xl bg-[#00d69b]/5 border border-[#00d69b]/20">
                  <p className="text-sm text-white/60 leading-relaxed mb-6 font-medium">
                    Our AI has cross-referenced <span className="text-white font-bold">48,000+</span> historical mappings to ensure 99.8% accuracy.
                  </p>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <Database size={18} className="text-[#7075ff]" />
                    <div>
                      <div className="text-xs font-bold">NAMASTE Core v1.2</div>
                      <div className="text-[10px] text-white/30 uppercase font-black tracking-tighter">Sync: 12m ago</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass p-8">
                 <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-blue-400" size={20} /> Blockchain Hash
                </h3>
                <div className="space-y-3">
                   <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 overflow-hidden">
                     <span className="text-[10px] font-mono text-white/30 truncate flex-1">
                       0x7f83b2...a92f81d
                     </span>
                     <span className="text-[9px] font-black text-[#00d69b] uppercase">Verified</span>
                   </div>
                   <p className="text-[11px] text-white/30 px-2 leading-relaxed italic">
                     "Each diagnosis is cryptographically hashed for patient security."
                   </p>
                </div>
              </div>

              <div className="glass p-8 group cursor-pointer border-dashed border-white/20 hover:border-[#00d69b]/40 transition-colors">
                 <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <Plus size={24} className="text-white/40 transition-colors group-hover:text-[#00d69b]" />
                    </div>
                    <span className="text-xs font-bold text-white/40 group-hover:text-white transition-colors uppercase tracking-[0.1em]">Add Comorbidity</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
