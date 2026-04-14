'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  Loader2, 
  X, 
  Pill, 
  Heart,
  User,
  History,
  Info
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
    }, 1500);
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
              <div className="w-14 h-14 rounded-2xl bg-[#7075ff]/10 border border-[#7075ff]/20 flex items-center justify-center shadow-[0_0_20px_rgba(112,117,255,0.1)]">
                <QrCode className="text-[#7075ff]" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Patient Identification</h1>
                <p className="text-white/40 font-medium">Verified QR Scanning · Blockchain Identity Trail</p>
              </div>
            </div>
          </div>

          {!patient ? (
            <div className="glass p-12 md:p-20 text-center animate-fade-up delay-100">
              {/* Scanner Simulation */}
              <div className="w-64 h-64 mx-auto mb-10 relative group">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#7075ff] rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[#7075ff] rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[#7075ff] rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#7075ff] rounded-br-2xl" />
                
                <div className="absolute inset-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center gap-4 group-hover:bg-white/[0.05] transition-all">
                  {scanning ? (
                    <>
                      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                        <div 
                          className="w-full h-1 bg-gradient-to-r from-transparent via-[#7075ff] to-transparent absolute shadow-[0_0_15px_#7075ff]"
                          style={{ top: `${scanProgress}%`, transition: 'top 0.05s linear' }}
                        />
                      </div>
                      <Loader2 className="animate-spin text-[#7075ff]" size={40} />
                      <span className="text-xs font-black tracking-widest text-[#7075ff] uppercase">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-[#7075ff]/10 flex items-center justify-center text-[#7075ff] animate-pulse">
                        <QrCode size={32} />
                      </div>
                      <span className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">Ready to Scan</span>
                    </>
                  )}
                </div>
              </div>

              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold mb-4">Patient Portal Gateway</h2>
                <p className="text-white/40 font-medium leading-relaxed mb-10">
                  Align the patient's TulsiHealth or ABHA QR code within the frame to retrieve their verified clinical profile and historical dual-coded diagnoses.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={handleScan} 
                    disabled={scanning}
                    className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-[#7075ff] text-white font-bold text-lg shadow-[0_20px_40px_-10px_rgba(112,117,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {scanning ? 'Verifying...' : <><ScanLine size={20} /> Launch Scanner</>}
                  </button>
                  <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    Enter ID Manually
                  </button>
                </div>
              </div>
              
              <div className="mt-16 flex items-center justify-center gap-8 border-t border-white/5 pt-10 opacity-30">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><ShieldCheck size={14} /> ISO 27001 Secure</div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Info size={14} /> HIPAA Compliant</div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-up">
              {/* Verified Badge Section */}
              <div className="glass p-1 focus-ring-glow border-[#00d69b]/30 bg-[#00d69b]/[0.02]">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#00d69b] to-[#7075ff] p-[2px]">
                    <div className="w-full h-full rounded-3xl bg-[#030308] flex items-center justify-center text-5xl font-black text-[#00d69b]">
                      {patient.name.charAt(0)}
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                       <div className="badge badge-green flex items-center gap-2 text-[10px] font-black">
                         <ShieldCheck size={12} /> IDENTITY VERIFIED
                       </div>
                       <span className="text-[10px] font-mono text-white/20">{patient.id}</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight mb-2">{patient.name}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/40 font-bold text-sm">
                       <span className="flex items-center gap-1"><User size={14} /> {patient.age} Years</span>
                       <span className="flex items-center gap-1"><Info size={14} /> {patient.blood_group} Blood Group</span>
                       <span className="flex items-center gap-1 text-[#ffb84d]"><Activity size={14} /> {patient.ayush_system} Root</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setPatient(null)}
                    className="p-3 glass hover:bg-red-500/10 hover:text-red-400 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-400" /> Active Clinical Alerts
                      </h4>
                      <div className="space-y-3">
                         {patient.alerts.map((a: string, i: number) => (
                           <div key={i} className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-100/70 text-sm font-semibold flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                             {a}
                           </div>
                         ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4 flex items-center gap-2">
                        <Pill size={14} className="text-[#ffb84d]" /> Prescribed Medications
                      </h4>
                      <div className="space-y-3">
                         {patient.medicines.map((m: string, i: number) => (
                           <div key={i} className="p-4 rounded-2xl bg-[#ffb84d]/5 border border-[#ffb84d]/10 text-white/60 text-sm font-semibold">
                             {m}
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4 flex items-center gap-2">
                        <History size={14} className="text-[#7075ff]" /> Medical History Timeline
                      </h4>
                      <div className="space-y-4">
                        {patient.history.map((h: any, i: number) => (
                          <div key={i} className="p-5 rounded-2xl glass hover:bg-white/[0.04] transition-all border-white/5 group border-2">
                            <div className="flex justify-between items-start mb-3">
                               <div className="font-bold text-sm tracking-tight">{h.display}</div>
                               <span className="text-[10px] font-black px-2 py-1 bg-[#00d69b]/10 text-[#00d69b] rounded-lg">DUAL-CODED</span>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="flex-1 text-[11px] text-white/30 font-medium leading-relaxed uppercase tracking-wider">{h.icd11_display}</div>
                               <span className="text-[10px] font-bold text-white/20 group-hover:text-[#00d69b] transition-colors">{h.icd11}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => router.push('/dashboard/emr')}
                      className="w-full py-6 rounded-3xl bg-transparent border-2 border-[#00d69b] text-[#00d69b] font-black text-lg hover:bg-[#00d69b] hover:text-black hover:shadow-[0_20px_40px_-10px_rgba(0,214,155,0.4)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest mt-4"
                    >
                      <Stethoscope size={24} /> Start Consultation
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-[10px] font-black tracking-widest text-white/20 uppercase">
                 <ShieldCheck size={14} /> Cryptographic Proof: 0x82f9b1d...83c01
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
