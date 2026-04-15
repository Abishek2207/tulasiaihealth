'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, Stethoscope, ScanLine, Users, BarChart3, Settings,
  LayoutDashboard, BrainCircuit, LogOut, ArrowLeft, QrCode,
  Heart, Calendar, FileText, Shield, Clock, TrendingUp,
  AlertTriangle, CheckCircle2, Pill, User, Phone, Mail,
  MapPin, Droplets, Download, Share2, ChevronRight, Zap,
  BookOpen, Plus, X
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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const MOCK_PATIENT = {
  id: 'TH-2024-001',
  name: 'Priya Subramaniam',
  age: 34,
  gender: 'Female',
  dob: '1990-03-15',
  blood_group: 'B+',
  phone: '+91 98765 43210',
  email: 'priya.s@email.com',
  address: 'No. 42, Gandhi Nagar, Chennai - 600020',
  abha_id: '91-1234-5678-9012',
  conditions: ['Vataja Jwara', 'Prameha (Diabetes Type 2)'],
  allergies: ['Penicillin', 'Sulfa drugs'],
  last_visit: '2024-12-18',
  recovery_score: 78,
  risk_level: 'moderate',
  timeline: [
    { date: '2024-12-18', type: 'visit', title: 'Routine Check-up', codes: ['AYU-D-0001', 'ICD-11: 1D01'], doctor: 'Dr. Abishek', status: 'completed' },
    { date: '2024-11-05', type: 'diagnosis', title: 'Prameha Diagnosis Confirmed', codes: ['AYU-D-0201', 'ICD-11: 5A11'], doctor: 'Dr. Kavitha', status: 'completed' },
    { date: '2024-10-22', type: 'treatment', title: 'Triphala Churna Prescribed', codes: ['AYUSH-MED-TRP'], doctor: 'Dr. Abishek', status: 'completed' },
    { date: '2024-09-14', type: 'visit', title: 'Initial Consultation', codes: ['CONS-001'], doctor: 'Dr. Abishek', status: 'completed' },
  ],
  vitals: { bp: '118/76', pulse: '72 bpm', temp: '98.6°F', spo2: '99%', weight: '62 kg', height: '5\'4"' },
};

const RECOVERY_DATA = [42, 48, 55, 60, 65, 70, 72, 75, 74, 77, 78, 78];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function RecoveryGraph({ score }: { score: number }) {
  const max = 100;
  const points = RECOVERY_DATA.map((v, i) => `${(i / (RECOVERY_DATA.length - 1)) * 100}%,${100 - (v / max) * 100}%`).join(' ');
  
  return (
    <div className="w-full">
      <div className="flex items-end justify-between h-24 gap-1 mb-2">
        {RECOVERY_DATA.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${(v / max) * 100}%`,
                background: v >= 70 ? 'linear-gradient(to top, #00a07a, #00d69b)' : v >= 50 ? 'linear-gradient(to top, #7075ff88, #7075ff)' : 'linear-gradient(to top, #ef444488, #ef4444)',
                opacity: i === RECOVERY_DATA.length - 1 ? 1 : 0.5
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-white/20 font-medium">
        {MONTHS.map(m => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(MOCK_PATIENT);
  const [qrCode, setQrCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'vitals' | 'codes'>('overview');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const id = params?.id as string;
    
    // Try to fetch from API
    setLoading(true);
    fetch(`${API}/api/patients/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setPatient({ ...MOCK_PATIENT, ...data }); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Generate QR
    fetch(`${API}/api/patients/${id}/qr`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.qr_code) setQrCode(data.qr_code); })
      .catch(() => setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TULSIHEALTH-${id}`));
  }, [params?.id]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    router.push('/login');
  };

  const TYPE_COLORS: Record<string, string> = {
    visit: 'bg-[#00d69b]/10 border-[#00d69b]/30 text-[#00d69b]',
    diagnosis: 'bg-red-500/10 border-red-500/30 text-red-400',
    treatment: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  };

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
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-white/50 hover:bg-white/5 hover:text-white">
                <Icon size={18} className="group-hover:text-white" />
                <span className="text-sm font-semibold">{item.label}</span>
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
          {/* Back + Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-all">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="text-xs text-white/30 font-bold uppercase tracking-[0.2em] mb-1">Patient Profile</div>
              <h1 className="text-2xl font-black tracking-tight">{patient.name}</h1>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setShowQR(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all text-sm font-semibold"
              >
                <QrCode size={16} /> View QR
              </button>
              <Link href="/dashboard/diagnosis" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d69b] text-black text-sm font-black hover:bg-[#00e5a8] transition-all">
                <Plus size={16} /> New Diagnosis
              </Link>
            </div>
          </div>

          {/* Patient Card */}
          <div className="glass p-6 mb-6 flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00d69b]/20 to-[#7075ff]/20 border border-white/10 flex items-center justify-center text-4xl font-black text-[#00d69b] shrink-0">
              {patient.name[0]}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Patient ID</div>
                <div className="font-bold text-sm text-[#00d69b] font-mono">{patient.id}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Date of Birth</div>
                <div className="font-bold text-sm">{patient.dob} ({patient.age}y)</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Blood Group</div>
                <div className="font-bold text-sm text-red-400">{patient.blood_group}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">ABHA ID</div>
                <div className="font-bold text-sm font-mono text-amber-400">{patient.abha_id}</div>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Phone size={13} className="text-white/30" />
                <span className="text-sm font-medium">{patient.phone}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Mail size={13} className="text-white/30" />
                <span className="text-sm font-medium">{patient.email}</span>
              </div>
              <div className="flex items-start gap-2 col-span-4">
                <MapPin size={13} className="text-white/30 mt-0.5" />
                <span className="text-sm font-medium text-white/60">{patient.address}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 glass rounded-2xl mb-6 w-fit">
            {(['overview', 'timeline', 'vitals', 'codes'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-[#00d69b] text-black' : 'text-white/40 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recovery Score */}
              <div className="glass p-6 col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#00d69b]" /> Recovery Progress (12 Months)
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${patient.recovery_score >= 70 ? 'bg-[#00d69b]/10 text-[#00d69b] border border-[#00d69b]/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                      {patient.recovery_score}% Recovery
                    </div>
                  </div>
                </div>
                <RecoveryGraph score={patient.recovery_score} />
              </div>

              {/* Risk + Conditions */}
              <div className="space-y-4">
                <div className="glass p-5">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                    <AlertTriangle size={12} className="text-amber-400" /> Active Conditions
                  </h3>
                  <div className="space-y-2">
                    {patient.conditions.map((c: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm font-medium p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass p-5">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                    <Shield size={12} className="text-red-400" /> Allergies
                  </h3>
                  <div className="space-y-2">
                    {patient.allergies.map((a: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm font-medium p-3 bg-red-500/[0.05] rounded-xl border border-red-500/10">
                        <X size={12} className="text-red-400" /> {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {patient.timeline.map((event: any, i: number) => (
                <div key={i} className="glass p-6 flex gap-6 hover:border-white/10 transition-all">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${TYPE_COLORS[event.type]}`}>
                      {event.type === 'visit' ? <Clock size={16} /> : event.type === 'diagnosis' ? <Stethoscope size={16} /> : <Pill size={16} />}
                    </div>
                    {i < patient.timeline.length - 1 && <div className="w-px flex-1 bg-white/5 mt-2" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm">{event.title}</h4>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${TYPE_COLORS[event.type]}`}>{event.type}</span>
                        <span className="text-xs text-white/30">{event.date}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {event.codes.map((code: string, j: number) => (
                        <span key={j} className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-white/50">{code}</span>
                      ))}
                    </div>
                    <div className="text-xs text-white/30">{event.doctor}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vitals Tab */}
          {activeTab === 'vitals' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(patient.vitals).map(([key, val]) => (
                <div key={key} className="glass p-6 hover:border-white/10 transition-all">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">{key.replace('_', ' ')}</div>
                  <div className="text-2xl font-black text-[#00d69b]">{val as string}</div>
                </div>
              ))}
            </div>
          )}

          {/* Dual Codes Tab */}
          {activeTab === 'codes' && (
            <div className="space-y-4">
              <div className="glass p-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Dual-Coding Summary — NAMASTE ↔ ICD-11</h3>
                <div className="space-y-3">
                  {[
                    { namaste: 'AYU-D-0001', namasteLabel: 'Vataja Jwara', icd11: '1D01', icd11Label: 'Fever of unknown origin', tm2: 'TM2-001' },
                    { namaste: 'AYU-D-0201', namasteLabel: 'Prameha', icd11: '5A11', icd11Label: 'Type 2 Diabetes Mellitus', tm2: 'TM2-201' },
                  ].map((row, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-[9px] font-black uppercase text-[#00d69b]/60 tracking-widest mb-1">NAMASTE (AYUSH)</div>
                        <div className="font-bold text-xs font-mono text-[#00d69b]">{row.namaste}</div>
                        <div className="text-xs text-white/50 mt-1">{row.namasteLabel}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase text-[#7075ff]/60 tracking-widest mb-1">ICD-11 TM2</div>
                        <div className="font-bold text-xs font-mono text-[#7075ff]">{row.tm2}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase text-amber-400/60 tracking-widest mb-1">WHO ICD-11</div>
                        <div className="font-bold text-xs font-mono text-amber-400">{row.icd11}</div>
                        <div className="text-xs text-white/50 mt-1">{row.icd11Label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="glass p-8 rounded-3xl max-w-sm w-full border border-white/10 text-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all">
              <X size={16} />
            </button>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Patient QR Code</div>
            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl mb-6">
              <img
                src={qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=168x168&data=TULSIHEALTH-${patient.id}&color=020205&bgcolor=FFFFFF`}
                alt="Patient QR"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="font-black text-lg tracking-tight mb-1">{patient.name}</div>
            <div className="font-mono text-sm text-[#00d69b] mb-6">{patient.id}</div>
            <p className="text-xs text-white/30 leading-relaxed">Scan this QR at any TulsiHealth registered hospital for instant cross-facility access. Valid for authorized users only.</p>
          </div>
        </div>
      )}
    </div>
  );
}
