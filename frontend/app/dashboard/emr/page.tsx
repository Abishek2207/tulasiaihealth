'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const }
};

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
      const q = query.toLowerCase();
      const filtered = MOCK_SUGGESTIONS.filter(s =>
        s.display.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
      );
      
      setTimeout(() => {
        setSuggestions(filtered);
        setDropdownOpen(filtered.length > 0);
        setLoading(false);
      }, 400);
    }, 350);
    return () => clearTimeout(delay);
  }, [query, selected]);

  const handleSelect = (item: any) => {
    setIsAiProcessing(true);
    setSelected(item);
    setQuery(item.display);
    setSuggestions([]);
    setDropdownOpen(false);
    
    setTimeout(() => {
      setIsAiProcessing(false);
      setSaved(false);
    }, 1000);
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
    }, 1200);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden selection:bg-[#00d69b]/30">
      <div className="noise opacity-[0.02]" />
      
      {/* ── Sidebar ── */}
      {/* ── Main Content ── */}
      <main className="w-full">
        <div className="max-w-[1200px] mx-auto">
          {/* Page Header */}
          <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-xl">
                <Stethoscope className="text-[#00d69b]" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight tracking-tighter mb-1">Smart Dual-Coding</h1>
                <p className="text-white/30 text-xs font-semibold tracking-tight uppercase tracking-[0.2em]">NAMASTE AYUSH ↔ WHO ICD-11 · FHIR R4</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <motion.div 
                 animate={{ opacity: [0.5, 1, 0.5] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="px-4 py-2 rounded-full bg-[#00d69b]/10 border border-[#00d69b]/20 text-[#00d69b] text-[10px] font-semibold tracking-tight uppercase tracking-widest flex items-center gap-2"
               >
                 <Sparkles size={12} className="fill-[#00d69b]" />
                 Neural Map Active
               </motion.div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3 space-y-10">
              {/* Search Panel */}
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10 relative">
                <label className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.25em] text-white/20 block mb-8 ml-1">
                  AI-Powered Clinical Registry
                </label>
                
                <div className="relative group">
                  <Search className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${query ? 'text-[#00d69b]' : 'text-white/10'}`} size={22} />
                  <input
                    ref={inputRef}
                    className="w-full pl-16 pr-40 py-6 bg-white/[0.03] border border-white/5 rounded-[28px] text-xl font-bold tracking-tight focus:bg-white/[0.06] focus:border-[#00d69b]/30 focus:shadow-[0_0_50px_rgba(0,214,155,0.05)] transition-all outline-none placeholder:text-white/5"
                    placeholder="Search Symptoms (e.g. Vataja Jwara, Migraine...)"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelected(null); }}
                  />
                  
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
                    <AnimatePresence>
                      {loading && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                          <RefreshCcw className="animate-spin text-[#00d69b]" size={20} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <motion.button whileHover={{ scale: 1.1 }} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/20 hover:text-white transition-all">
                      <Mic size={20} />
                    </motion.button>
                  </div>

                  {/* Dropdown Suggestions */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-full mt-6 w-full glass shadow-2xl rounded-[32px] overflow-hidden z-[200] border-white/10"
                      >
                        <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 text-[9px] font-semibold tracking-tight tracking-[0.3em] text-white/10 uppercase">
                          Intelligent Semantic Matches
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                          {suggestions.map((item, i) => (
                            <motion.div 
                              key={i} 
                              onClick={() => handleSelect(item)}
                              whileHover={{ backgroundColor: 'rgba(0, 214, 155, 0.04)' }}
                              className="flex items-center justify-between px-8 py-6 cursor-pointer border-b border-white/5 group transition-colors"
                            >
                              <div className="flex-1">
                                <div className="text-lg font-semibold tracking-tight text-white group-hover:text-[#00d69b] transition-colors tracking-tight">{item.display}</div>
                                <div className="text-xs font-bold text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-widest mt-1">Cross-reference: {item.icd11_display}</div>
                              </div>
                              <div className="flex gap-3">
                                 <span className="text-[10px] font-semibold tracking-tight px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 text-white/30 uppercase tracking-widest">{item.code}</span>
                                 <span className="text-[10px] font-semibold tracking-tight px-3 py-1.5 bg-[#00d69b]/10 rounded-xl border border-[#00d69b]/20 text-[#00d69b] uppercase tracking-widest">{item.icd11}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Mapping Results */}
              <AnimatePresence mode="wait">
                {selected && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    className={`transition-all duration-500 ${isAiProcessing ? 'opacity-40 blur-sm pointer-events-none' : 'opacity-100'}`}
                  >
                    <div className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] rounded-[40px] overflow-hidden">
                      <div className="px-10 py-6 border-b border-white/5 bg-gradient-to-r from-[#00d69b]/5 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[#00d69b]">
                          <Sparkles size={20} className="fill-[#00d69b]" />
                          <span className="text-[10px] font-semibold tracking-tight tracking-[0.3em] uppercase">Intelligence Bridge Encoded</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-semibold tracking-tight tracking-widest text-[#ffb84d] uppercase border border-[#ffb84d]/20">{selected.system_type}</span>
                          <span className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-semibold tracking-tight tracking-widest text-[#7075ff] uppercase border border-[#7075ff]/20">HL7 FHIR</span>
                        </div>
                      </div>
                      
                      <div className="p-10 md:p-14">
                        <div className="grid md:grid-cols-[1fr,80px,1fr] items-center gap-8 mb-16">
                          {/* Traditional Side */}
                          <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 group hover:border-[#ffb84d]/30 transition-colors">
                            <div className="text-[9px] font-semibold tracking-tight uppercase tracking-[0.4em] text-white/10 mb-6 group-hover:text-[#ffb84d]/40 transition-colors">NAMASTE AYUSH</div>
                            <h4 className="text-3xl font-semibold tracking-tight mb-3 leading-none tracking-tighter">{selected.display}</h4>
                            <div className="flex items-center gap-4 mt-6">
                              <span className="text-[11px] font-semibold tracking-tight px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-white group-hover:text-[#ffb84d] transition-colors">{selected.code}</span>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-white/20">Dosha Affinity</span>
                                <span className="text-xs font-bold text-white/60">{selected.dosha}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-3">
                            <motion.div 
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <ArrowRight size={32} className="text-[#00d69b] opacity-40" />
                            </motion.div>
                            <span className="text-[9px] font-semibold tracking-tight uppercase tracking-[0.4em] text-white/10">MAP</span>
                          </div>

                          {/* Modern Side */}
                          <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 group hover:border-[#00d69b]/30 transition-colors">
                            <div className="text-[9px] font-semibold tracking-tight uppercase tracking-[0.4em] text-white/10 mb-6 group-hover:text-[#00d69b]/40 transition-colors">WHO ICD-11 MMS</div>
                            <h4 className="text-3xl font-semibold tracking-tight mb-3 leading-none tracking-tighter">{selected.icd11_display}</h4>
                            <div className="flex items-center gap-4 mt-6">
                              <span className="text-[11px] font-semibold tracking-tight px-4 py-2 bg-[#00d69b]/10 rounded-xl border border-[#00d69b]/20 text-[#00d69b]">{selected.icd11}</span>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-[#00d69b]/40">Confidence</span>
                                <span className="text-xs font-bold text-[#00d69b]">99.8%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* FHIR Code Preview */}
                        <div className="pt-12 border-t border-white/5">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                                <FileJson size={16} className="text-white/20" />
                              </div>
                              <h5 className="text-[10px] font-semibold tracking-tight tracking-[0.3em] uppercase text-white/20">
                                FHIR R4 Resource Meta-Object
                              </h5>
                            </div>
                            <button className="text-[10px] font-semibold tracking-tight text-[#00d69b]/60 hover:text-[#00d69b] flex items-center gap-2 uppercase tracking-widest transition-colors">
                              <RefreshCcw size={12} /> Regenerate Schema
                            </button>
                          </div>
                          
                          <div className="p-8 rounded-[28px] bg-black/40 border border-white/5 text-[13px] font-mono text-white/30 leading-relaxed overflow-x-auto group/code">
                            <div className="flex items-center gap-2 mb-4 opacity-0 group-hover/code:opacity-100 transition-opacity">
                               <div className="w-2 h-2 rounded-full bg-red-500/40" />
                               <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                               <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                            </div>
                            <pre className="selection:bg-[#00d69b]/20">
{`{
  "resourceType": "Condition",
  "id": "diag-${selected.code.toLowerCase()}",
  "coding": [
    { "system": "tulsi.io/namaste", "code": "${selected.code}" },
    { "system": "id.who.int/icd11", "code": "${selected.icd11}" }
  ],
  "subject": { "reference": "Patient/verified-001" }
}`}
                            </pre>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-12 flex flex-col sm:flex-row gap-6">
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={loading}
                            className={`flex-1 flex items-center justify-center gap-4 py-6 rounded-[24px] font-semibold tracking-tight text-xl transition-all ${saved ? 'bg-[#00d69b] text-black shadow-2xl' : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'}`}
                          >
                            {loading ? <RefreshCcw className="animate-spin" size={24} /> : 
                             saved ? <><CheckCircle2 size={24} strokeWidth={3} /> Successfully Saved</> : 
                             <><Save size={24} /> Commit Condition</>}
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            className="p-6 rounded-[24px] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                          >
                            <QrCode size={28} className="text-white/40" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tool Bar */}
            <div className="space-y-8">
              <motion.div {...fadeInUp} transition={{ delay: 0.3 }} className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10 bg-[#00d69b]/[0.02] border-[#00d69b]/10">
                <h3 className="text-xl font-semibold tracking-tight mb-8 flex items-center gap-3">
                  <BrainCircuit className="text-[#00d69b]" size={24} /> AI Intel
                </h3>
                <div className="p-8 rounded-[32px] bg-[#00d69b]/5 border border-[#00d69b]/10">
                  <p className="text-sm font-bold text-white/40 leading-relaxed mb-8">
                    Smart mapping confirmed against <span className="text-[#00d69b]">NAMASTE Library v1.4</span>. 
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-semibold tracking-tight uppercase tracking-widest text-white/20">
                      <span>Neural Confidence</span>
                      <span className="text-[#00d69b]">99.8%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '99.8%' }} transition={{ duration: 1.5 }} className="h-full bg-[#00d69b] rounded-full shadow-[0_0_10px_#00d69b]" />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10">
                 <h3 className="text-xl font-semibold tracking-tight mb-8 flex items-center gap-3 text-white/40 uppercase tracking-widest text-xs">
                  <ShieldCheck size={20} className="text-[#7075ff]" /> Verification
                </h3>
                <div className="space-y-4">
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                       <Plus size={18} className="text-white/20" />
                     </div>
                     <div>
                        <div className="text-[11px] font-semibold tracking-tight uppercase tracking-widest text-white/30">Action Hash</div>
                        <div className="text-[10px] font-mono text-[#00d69b] truncate max-w-[120px]">0x4f...91e</div>
                     </div>
                   </div>
                   <p className="text-[10px] text-white/20 px-2 leading-relaxed font-bold uppercase tracking-widest">
                     Public Chain Node: Secure
                   </p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10 flex flex-col items-center justify-center border-dashed border-white/20 opacity-40 hover:opacity-100 hover:border-[#00d69b]/30 transition-all cursor-pointer group"
              >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Plus size={32} className="text-white/20 group-hover:text-[#00d69b] transition-colors" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight text-white/20 group-hover:text-white transition-colors uppercase tracking-[0.2em]">Add Comorbidity</span>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



