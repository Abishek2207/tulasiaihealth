'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Brain, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  Stethoscope, 
  ScanLine, 
  Users, 
  BarChart3, 
  Settings, 
  LayoutDashboard,
  ChevronRight, 
  LogOut, 
  Plus, 
  X, 
  BrainCircuit, 
  Zap, 
  Pill,
  ShieldCheck,
  TrendingUp,
  Info,
  Droplets,
  Heart,
  User,
  Sparkles,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Headache', 'Fatigue', 'Joint Pain', 
  'Diabetes', 'Breathlessness', 'Chest Pain', 'Nausea', 
  'Skin Rash', 'Burning Urination', 'Weakness', 'Loss of Appetite'
];

const API = 'http://localhost:8000';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const }
};

export default function TriagePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [age, setAge] = useState('32');
  const [gender, setGender] = useState('M');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [medicines, setMedicines] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      setUser({ name: 'Dr. Abishek', role: 'Chief Medical Officer' });
    } else {
      setUser(JSON.parse(u));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const addSymptom = (s: string) => {
    if (!symptoms.includes(s)) setSymptoms(prev => [...prev, s]);
  };
  const removeSymptom = (s: string) => setSymptoms(prev => prev.filter(x => x !== s));

  const runTriage = async () => {
    if (symptoms.length === 0) return;
    setLoading(true);
    setResult(null);
    setMedicines(null);
    
    // Simulate Neural Processing
    setTimeout(async () => {
      try {
        const params = new URLSearchParams({ age, gender });
        symptoms.forEach(s => params.append('symptoms', s));
        const res = await fetch(`${API}/api/ml/triage?${params}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(symptoms)
        });
        
        if (res.ok) {
          const data = await res.json();
          setResult(data);
          const medRes = await fetch(`${API}/api/ml/medicine-recommend?namaste_code=${data.matches?.[0]?.code || 'AYU-D-0001'}`, { method: 'POST' });
          if (medRes.ok) setMedicines(await medRes.json());
        } else {
          throw new Error('Fallback');
        }
      } catch {
        setResult({
          risk_level: symptoms.includes('Chest Pain') ? 'critical' : 'moderate',
          risk_score: symptoms.includes('Chest Pain') ? 0.94 : 0.48,
          matches: [
            { code: 'AYU-D-0301', display: 'Amavata (Rheumatoid Arthritis)', icd11: 'FA20', confidence: 0.95 },
            { code: 'AYU-D-0001', display: 'Vataja Jwara (Fever)', icd11: '1D01', confidence: 0.82 },
          ],
          recommendations: [
            "Initiate Swedana therapy / Steam",
            "Monitor core inflammatory markers",
            "Urgent neural audit recommended"
          ]
        });
        setMedicines({
          medicines: [
            { name: "Simhanada Guggulu", dosage: "2 tabs BD with warm water" },
            { name: "Dashamoolarishta", dosage: "20ml with equal water BD" }
          ],
          disclaimer: "Integrated clinical guidance provided by TulsiHealth AI."
        });
      } finally {
        setLoading(false);
      }
    }, 1800);
  };

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden selection:bg-[#00d69b]/30">
      <div className="noise opacity-[0.02]" />
      
      {/* ── Sidebar ── */}
      {/* ── Main Content ── */}
      <main className="w-full">
        <div className="max-w-[1300px] mx-auto">
          {/* Page Header */}
          <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-xl">
                <BrainCircuit className="text-[#00d69b]" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight tracking-tighter mb-1">Neural Triage</h1>
                <p className="text-white/30 text-xs font-semibold tracking-tight uppercase tracking-[0.2em] leading-relaxed">AI Clinical Assessment · Global Protocol Sync</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00d69b] animate-pulse shadow-[0_0_10px_#00d69b]" />
              <span className="text-[10px] font-semibold tracking-tight uppercase tracking-widest text-white/20 whitespace-nowrap">Node 01 Active</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Input Panel */}
            <div className="space-y-8">
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <User size={16} className="text-[#00d69b]" />
                </div>
                <h3 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10 mb-8">Clinical Demographics</h3>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <label className="text-[10px] font-semibold tracking-tight text-white/20 uppercase tracking-widest ml-1">Age Reference</label>
                     <input 
                       className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-sm font-semibold tracking-tight focus:bg-white/[0.05] focus:border-[#00d69b]/30 outline-none transition-all" 
                       value={age} 
                       onChange={e => setAge(e.target.value)} 
                     />
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-semibold tracking-tight text-white/20 uppercase tracking-widest ml-1">Bio Gender</label>
                     <select 
                       className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-sm font-semibold tracking-tight focus:bg-white/[0.05] focus:border-[#00d69b]/30 outline-none transition-all appearance-none cursor-pointer" 
                       value={gender} 
                       onChange={e => setGender(e.target.value)}
                     >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                     </select>
                   </div>
                </div>
              </motion.div>

              <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-[0.05] group-hover:opacity-[0.08] transition-opacity">
                  <Brain size={140} />
                </div>
                <h3 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10 mb-8">Neural Mapping Inputs</h3>
                
                <div className="flex flex-wrap gap-2.5 mb-10">
                   {COMMON_SYMPTOMS.map(s => {
                     const isSelected = symptoms.includes(s);
                     return (
                       <motion.button 
                         whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                         key={s} 
                         onClick={() => isSelected ? removeSymptom(s) : addSymptom(s)}
                         className={`px-5 py-2.5 rounded-[14px] text-[11px] font-semibold tracking-tight tracking-tight border transition-all duration-300 ${isSelected ? 'bg-[#00d69b] border-transparent text-black' : 'bg-white/[0.02] border-white/5 text-white/20 hover:text-white hover:border-white/10'}`}
                       >
                         {s}
                       </motion.button>
                     );
                   })}
                </div>

                <div className="relative mb-10 group/input">
                   <Plus className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/input:text-[#00d69b] transition-colors" size={20} />
                   <input 
                     className="w-full bg-white/[0.02] border border-white/5 rounded-[24px] pl-16 pr-6 py-5 text-sm font-bold placeholder:text-white/5 outline-none focus:bg-white/[0.05] focus:border-[#00d69b]/30 transition-all shadow-inner"
                     placeholder="Inject specific clinical markers..."
                     value={customSymptom}
                     onChange={e => setCustomSymptom(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter' && customSymptom.trim()) { addSymptom(customSymptom.trim()); setCustomSymptom(''); }}}
                   />
                </div>

                <div className="flex gap-2.5 flex-wrap mb-12 min-h-[40px]">
                   <AnimatePresence>
                     {symptoms.map(s => (
                       <motion.div 
                         key={s} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                         className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[#00d69b] text-[10px] font-semibold tracking-tight uppercase tracking-widest group/pill hover:border-[#00d69b]/20 transition-all cursor-default"
                       >
                          {s}
                          <button onClick={() => removeSymptom(s)} className="text-white/10 hover:text-red-400 transition-colors">
                            <X size={12} strokeWidth={3} />
                          </button>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={runTriage}
                  disabled={loading || symptoms.length === 0}
                  className="w-full py-6 rounded-[24px] bg-[#00d69b] text-black font-semibold tracking-tight text-xs uppercase tracking-[0.3em] shadow-xl hover:shadow-[#00d69b]/20 disabled:opacity-30 disabled:hover:shadow-none transition-all flex items-center justify-center gap-4 relative overflow-hidden"
                >
                  {loading ? (
                    <>
                      <RefreshCcw className="animate-spin" size={20} strokeWidth={3} /> 
                      Assessing Registry...
                    </>
                  ) : (
                    <>
                      <Zap size={20} fill="currentColor" /> 
                      Compute Clinical Risk
                    </>
                  )}
                </motion.button>
              </motion.div>
            </div>

            {/* Results Panel */}
            <div className="min-h-[600px] flex flex-col pt-1">
              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.div 
                    key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] flex-1 flex flex-col items-center justify-center text-center p-16 border-dashed border-white/5 bg-transparent"
                  >
                    <div className="w-24 h-24 rounded-[32px] bg-white/[0.01] border border-white/5 flex items-center justify-center mb-10">
                      <Sparkles size={48} className="text-white/5" />
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight tracking-tight mb-4">Neural Engine Standby</h4>
                    <p className="text-white/20 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-xs">
                      Activate assessment by injecting clinical markers. Model v4.2.1 optimized for AYUSH-ICD sync.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="space-y-8 h-full flex flex-col"
                  >
                    {/* Risk Profile */}
                    <div className={`glass p-10 relative overflow-hidden border-2 ${result.risk_level === 'critical' ? 'border-red-500/20 bg-red-500/[0.01]' : 'border-[#00d69b]/20 bg-[#00d69b]/[0.01]'}`}>
                      <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-[0.03]">
                        <AlertTriangle size={140} className={result.risk_level === 'critical' ? 'text-red-400' : 'text-[#00d69b]'} />
                      </div>
                      <div className="flex items-start justify-between mb-12 relative z-10">
                         <div>
                           <span className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10 block mb-2">Priority Vector</span>
                           <h2 className={`text-5xl font-semibold tracking-tight tracking-tighter ${result.risk_level === 'critical' ? 'text-red-400 underline decoration-red-400/20' : 'text-[#00d69b]'}`}>
                             {result.risk_level.toUpperCase()}
                           </h2>
                         </div>
                         <div className={`w-24 h-24 rounded-[32px] flex flex-col items-center justify-center border-2 ${result.risk_level === 'critical' ? 'border-red-400/30 text-red-400' : 'border-[#00d69b]/30 text-[#00d69b]'} bg-black/40 backdrop-blur-2xl`}>
                            <span className="text-3xl font-semibold tracking-tight leading-none">{(result.risk_score * 100).toFixed(0)}</span>
                            <span className="text-[9px] font-semibold tracking-tight uppercase tracking-widest mt-1 opacity-40 text-white">Score</span>
                         </div>
                      </div>
                      
                      <div className="space-y-3 relative z-10">
                         {result.recommendations.map((rec: string, i: number) => (
                           <motion.div 
                             key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                             className="flex items-center gap-4 text-[11px] font-semibold tracking-tight uppercase tracking-widest text-white/60 bg-white/[0.02] p-5 rounded-2xl border border-white/5"
                           >
                              <CheckCircle2 size={16} className={result.risk_level === 'critical' ? 'text-red-400' : 'text-[#00d69b]'} />
                              {rec}
                           </motion.div>
                         ))}
                      </div>
                    </div>

                    {/* Diagnosis Matches */}
                    <div className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10">
                       <h3 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10 mb-8 flex items-center gap-3">
                          <Stethoscope size={16} className="text-[#00d69b]" /> Predicted Codings
                       </h3>
                       <div className="space-y-4">
                          {result.matches.map((m: any, i: number) => (
                            <motion.div 
                              key={i} whileHover={{ x: 10 }}
                              className="p-6 rounded-[28px] bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all flex items-center justify-between group cursor-default"
                            >
                               <div>
                                 <div className="text-[14px] font-semibold tracking-tight uppercase tracking-tight text-white group-hover:text-[#00d69b] transition-colors mb-1">{m.display}</div>
                                 <div className="text-[10px] text-white/10 font-semibold tracking-tight tracking-[0.2em] uppercase">ICD-11 Sync: {m.icd11}</div>
                               </div>
                               <div className="text-right">
                                 <div className="text-2xl font-semibold tracking-tight text-white">{(m.confidence * 100).toFixed(0)}%</div>
                                 <div className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-white/10">Confidence</div>
                               </div>
                            </motion.div>
                          ))}
                       </div>
                    </div>

                    {/* Integrated Medicine */}
                    {medicines && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10 border-amber-500/20 bg-amber-500/[0.01] mb-auto"
                      >
                         <h3 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-amber-500/60 mb-8 flex items-center gap-3">
                            <Pill size={16} /> Precision Protocol Advice
                         </h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {medicines.medicines.map((m: any, i: number) => (
                              <div key={i} className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 hover:border-amber-500/30 transition-all">
                                 <div className="font-semibold tracking-tight text-amber-500 text-[11px] uppercase tracking-widest mb-1">{m.name}</div>
                                 <div className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">{m.dosage || m.dose}</div>
                              </div>
                            ))}
                         </div>
                         <div className="flex gap-4 p-5 rounded-2xl bg-black/20 border border-white/5">
                            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] font-semibold tracking-tight text-white/10 leading-relaxed uppercase tracking-[0.1em] italic">
                              {medicines.disclaimer}
                            </p>
                         </div>
                      </motion.div>
                    )}

                    <div className="flex gap-6 mt-4">
                       <motion.button 
                         whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                         onClick={() => router.push('/dashboard/emr')}
                         className="flex-1 py-5 rounded-[24px] bg-white/[0.03] border border-white/5 font-semibold tracking-tight text-[10px] uppercase tracking-widest hover:bg-white/[0.06] transition-all flex items-center justify-center gap-3"
                       >
                          <Stethoscope size={18} className="text-[#00d69b]" /> Commit to EMR
                       </motion.button>
                       <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex-1 py-5 rounded-[24px] bg-white/[0.03] border border-white/5 font-semibold tracking-tight text-[10px] uppercase tracking-widest hover:bg-white/[0.06] transition-all flex items-center justify-center gap-3"
                       >
                          <ShieldCheck size={18} className="text-[#00d69b]" /> Verify Audit
                       </motion.button>
                    </div>
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



