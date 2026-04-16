'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ScanLine, 
  UserCheck, 
  ShieldCheck, 
  Activity, 
  AlertTriangle,
  LayoutDashboard, 
  Stethoscope, 
  Users, 
  BarChart3, 
  Settings,
  ChevronRight, 
  LogOut, 
  QrCode, 
  X, 
  Pill, 
  Heart,
  User,
  History,
  Info,
  RefreshCcw
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const MOCK_PATIENTS = [
  {
    id: 'TH-AB83724', name: 'Devaki Sriram', age: 45, blood_group: 'O+',
    ayush_system: 'Ayurveda', constitution: 'Pitta-Vata',
    history: [
      { system: 'NAMASTE', code: 'NAMASTE-015', display: 'Vataja Jwara (Fever)', icd11: '1D01', icd11_display: 'Typhoid fever' },
      { system: 'NAMASTE', code: 'NAMASTE-005', display: 'Madhumeha (Diabetes)', icd11: '5A00', icd11_display: 'Type 2 diabetes mellitus' },
    ],
    alerts: ['Allergic to Penicillin', 'Monitor BP weekly'],
    medicines: ['Amritarishta 15ml BD', 'Nisha Amalaki 2 tabs OD'],
  },
  {
    id: 'TH-CD92841', name: 'Rajan Pillai', age: 62, blood_group: 'B+',
    ayush_system: 'Siddha', constitution: 'Vata-Kapha',
    history: [
      { system: 'NAMASTE', code: 'NAMASTE-008', display: 'Sandhivata (Arthritis)', icd11: 'FA20', icd11_display: 'Osteoarthritis of knee' },
    ],
    alerts: ['High BP — Avoid heavy exercise'],
    medicines: ['Rasnasaptak Kwath 30ml BD'],
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const }
};

export default function QRScanPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [scanning, setScanning] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [scanProgress, setScanProgress] = useState(0);

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

  const handleScan = () => {
    setScanning(true);
    setScanProgress(0);
    setPatient(null);
    const tick = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) { clearInterval(tick); return 100; }
        return p + 4;
      });
    }, 50);
    
    setTimeout(() => {
      setScanning(false);
      setPatient(MOCK_PATIENTS[Math.floor(Math.random() * MOCK_PATIENTS.length)]);
    }, 1800);
  };

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden selection:bg-[#7075ff]/30">
      <div className="noise opacity-[0.02]" />
      
      {/* ── Sidebar ── */}
      {/* ── Main Content ── */}
      <main className="w-full">
        <div className="max-w-[1200px] mx-auto">
          {/* Page Header */}
          <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-xl">
                <QrCode className="text-[#7075ff]" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight tracking-tighter mb-1">Identification</h1>
                <p className="text-white/30 text-xs font-semibold tracking-tight uppercase tracking-[0.2em]">Verified QR Portal · Blockchain Identity Trail</p>
              </div>
            </div>
          </motion.div>

          {!patient ? (
            <motion.div 
              {...fadeInUp} transition={{ delay: 0.1 }}
              className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-16 md:p-24 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#7075ff]/30 to-transparent" />
              
              {/* Scanner Interface */}
              <div className="w-72 h-72 mx-auto mb-12 relative group">
                <div className="absolute -inset-4 border border-[#7075ff]/20 rounded-[40px] pointer-events-none group-hover:border-[#7075ff]/40 transition-colors" />
                
                {/* Visual Scanner Frame */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-[5px] border-l-[5px] border-[#7075ff] rounded-tl-3xl group-hover:scale-110 transition-transform" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-[5px] border-r-[5px] border-[#7075ff] rounded-tr-3xl group-hover:scale-110 transition-transform" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[5px] border-l-[5px] border-[#7075ff] rounded-bl-3xl group-hover:scale-110 transition-transform" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[5px] border-r-[5px] border-[#7075ff] rounded-br-3xl group-hover:scale-110 transition-transform" />
                
                <div className="absolute inset-6 rounded-[32px] bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center gap-6 group-hover:bg-white/[0.04] transition-all overflow-hidden">
                  <AnimatePresence mode="wait">
                    {scanning ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-6"
                      >
                        <motion.div 
                          className="w-full h-[6px] bg-gradient-to-r from-transparent via-[#7075ff] to-transparent absolute shadow-[0_0_25px_#7075ff]"
                          style={{ top: `${scanProgress}%` }}
                        />
                        <RefreshCcw className="animate-spin text-[#7075ff]" size={48} strokeWidth={3} />
                        <span className="text-[10px] font-semibold tracking-tight tracking-[0.3em] text-[#7075ff] uppercase">Decoding Hub</span>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-6"
                      >
                        <div className="w-20 h-20 rounded-full bg-[#7075ff]/10 flex items-center justify-center text-[#7075ff]">
                          <QrCode size={40} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-semibold tracking-tight tracking-[0.3em] text-white/20 uppercase">Lens Ready</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="max-w-lg mx-auto">
                <h2 className="text-3xl font-semibold tracking-tight mb-6 tracking-tight leading-tight">Secure Portal Authorization</h2>
                <p className="text-white/30 text-sm font-bold leading-relaxed mb-12 uppercase tracking-widest px-10">
                  Retrieve verified clinical history and identity using the patient's encrypted TulsiHealth node or ABHA token.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleScan} 
                    disabled={scanning}
                    className="w-full sm:w-auto px-12 py-6 rounded-[24px] bg-[#7075ff] text-white font-semibold tracking-tight text-lg shadow-2xl hover:bg-[#6065ff] disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                  >
                    {scanning ? 'Authorizing...' : <><ScanLine size={24} strokeWidth={3} /> Launch Portal</>}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    className="w-full sm:w-auto px-12 py-6 rounded-[24px] bg-white/5 border border-white/5 text-white/20 font-semibold tracking-tight text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Manual Registry
                  </motion.button>
                </div>
              </div>
              
              <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-12 border-t border-white/5 pt-12 opacity-20">
                <div className="flex items-center gap-3 text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em]"><ShieldCheck size={16} /> ISO 27001 SECURE</div>
                <div className="flex items-center gap-3 text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em]"><Info size={16} /> HIPAA COMPLIANT</div>
                <div className="flex items-center gap-3 text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em]"><Activity size={16} /> REAL-TIME SYNC</div>
              </div>
            </motion.div>
          ) : (
            <motion.div {...fadeInUp} className="space-y-10">
              {/* Patient Core Card */}
              <div className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] rounded-[40px] overflow-hidden">
                <div className="p-10 md:p-14 border-b border-white/5 flex flex-col md:flex-row items-center gap-12 bg-gradient-to-br from-[#00d69b]/5 to-transparent">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-40 h-40 rounded-[48px] bg-gradient-to-tr from-[#00d69b] to-[#7075ff] p-[3px]"
                  >
                    <div className="w-full h-full rounded-[45px] bg-primary flex items-center justify-center text-6xl font-semibold tracking-tight text-[#00d69b]">
                      {patient.name.charAt(0)}
                    </div>
                  </motion.div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                       <motion.div 
                         initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                         className="px-4 py-1.5 rounded-full bg-[#00d69b]/10 border border-[#00d69b]/20 text-[#00d69b] text-[10px] font-semibold tracking-tight uppercase tracking-widest flex items-center gap-2"
                       >
                         <ShieldCheck size={14} strokeWidth={3} /> Identity Verified
                       </motion.div>
                       <span className="text-[10px] font-semibold tracking-tight text-white/10 uppercase tracking-[0.3em]">{patient.id}</span>
                    </div>
                    <h2 className="text-5xl font-semibold tracking-tight tracking-tighter mb-4">{patient.name}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-white/30 text-[11px] font-semibold tracking-tight uppercase tracking-widest">
                       <span className="flex items-center gap-2"><User size={16} className="text-[#00d69b]" /> {patient.age} Yrs</span>
                       <span className="flex items-center gap-2"><Heart size={16} className="text-red-400" /> {patient.blood_group}</span>
                       <span className="flex items-center gap-2 text-[#ffb84d]"><Activity size={16} /> {patient.ayush_system} Engine</span>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    onClick={() => setPatient(null)}
                    className="p-5 rounded-full bg-white/5 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all border border-white/5"
                  >
                    <X size={28} />
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 p-10 md:p-14">
                  <div className="space-y-10">
                    <div>
                      <h4 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10 mb-6 flex items-center gap-3">
                        <AlertTriangle size={18} className="text-red-400" /> Active Registry Alerts
                      </h4>
                      <div className="space-y-4">
                         {patient.alerts.map((a: string, i: number) => (
                           <motion.div 
                             key={i} 
                             initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                             className="p-5 rounded-3xl bg-red-400/5 border border-red-400/10 text-red-200/60 text-sm font-bold flex items-center gap-4 group hover:bg-red-400/10 transition-colors"
                           >
                             <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_12px_#f87171] group-hover:scale-125 transition-transform" />
                             {a}
                           </motion.div>
                         ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10 mb-6 flex items-center gap-3">
                        <Pill size={18} className="text-[#ffb84d]" /> Current Prescription
                      </h4>
                      <div className="space-y-4">
                         {patient.medicines.map((m: string, i: number) => (
                           <motion.div 
                             key={i} 
                             initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + 0.1 * i }}
                             className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 text-white/50 text-[13px] font-bold hover:bg-white/[0.06] transition-colors"
                           >
                             {m}
                           </motion.div>
                         ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div>
                      <h4 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10 mb-6 flex items-center gap-3">
                        <History size={18} className="text-[#7075ff]" /> Medical Intelligence Timeline
                      </h4>
                      <div className="space-y-5">
                        {patient.history.map((h: any, i: number) => (
                          <motion.div 
                             key={i} 
                             initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + 0.1 * i }}
                             className="p-6 rounded-[32px] glass hover:bg-white/[0.06] transition-all border-white/5 group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                               <ChevronRight size={16} className="text-[#00d69b]" />
                            </div>
                            <div className="flex justify-between items-start mb-4">
                               <div className="font-semibold tracking-tight text-lg tracking-tight group-hover:text-[#00d69b] transition-colors">{h.display}</div>
                               <span className="text-[9px] font-semibold tracking-tight px-2.5 py-1 bg-[#00d69b]/10 text-[#00d69b] rounded-lg tracking-widest uppercase">Dual-Coded</span>
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="flex-1 text-[11px] text-white/20 font-semibold tracking-tight uppercase tracking-[0.2em]">{h.icd11_display}</div>
                               <span className="text-[11px] font-semibold tracking-tight text-white/10 group-hover:text-white transition-colors">{h.icd11}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/dashboard/emr')}
                      className="w-full py-7 rounded-[32px] bg-gradient-to-r from-[#00d69b] to-[#00b383] text-black font-semibold tracking-tight text-xl shadow-2xl hover:shadow-[#00d69b]/20 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em]"
                    >
                      <Stethoscope size={28} strokeWidth={3} /> Consultation
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-6 opacity-20 py-8">
                 <div className="flex items-center gap-10">
                    <ShieldCheck size={20} />
                    <History size={20} />
                    <Database size={20} />
                 </div>
                 <p className="text-[9px] font-semibold tracking-tight tracking-[0.4em] uppercase text-center">
                    Proof of Integrity: 0x82f9b1d...83c01
                 </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function Database({ className, size }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}



