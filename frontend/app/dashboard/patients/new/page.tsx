'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Users, 
  Plus, 
  Activity, 
  Stethoscope, 
  ScanLine,
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  ChevronRight, 
  LogOut,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Droplets
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function NewPatientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'M',
    state: 'KA',
    phone: '',
    email: '',
    address: '',
    blood_group: 'O+',
    ayush_system: 'Ayurveda',
    abha_id: ''
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate real registration with delay
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
         router.push('/dashboard/patients');
      }, 2000);
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
            const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-[#00d69b]/10 text-[#00d69b] border border-[#00d69b]/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={18} className={isActive ? 'text-[#00d69b]' : 'group-hover:text-white'} />
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

      {/* ── Main Content ── */}
      <main className="flex-1 p-8 md:p-12 relative z-10 overflow-y-auto">
        <div className="max-w-[800px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-6 mb-10 animate-fade-up">
            <button 
              onClick={() => router.push('/dashboard/patients')}
              className="p-3 glass hover:bg-white/10 text-white/60 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Register New Patient</h1>
              <p className="text-white/40 font-medium">Create a new unified clinical medical record</p>
            </div>
          </div>

          {success ? (
            <div className="glass p-20 text-center animate-fade-up">
               <div className="w-20 h-20 rounded-full bg-[#00d69b]/10 border border-[#00d69b]/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(0,214,155,0.2)]">
                  <CheckCircle2 className="text-[#00d69b]" size={40} />
               </div>
               <h2 className="text-3xl font-black mb-4">Registration Successful</h2>
               <p className="text-white/40 max-w-xs mx-auto mb-8">
                 Patient has been securely added to the registry. Generating TulsiHealth QR identification...
               </p>
               <div className="flex flex-col items-center gap-4">
                  <span className="text-[10px] font-black tracking-[0.3em] text-[#00d69b] uppercase">Redirecting...</span>
                  <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-[#00d69b] rounded-full animate-[shimmer_2s_linear_infinite]" style={{ width: '100%' }} />
                  </div>
               </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 animate-fade-up delay-100">
               {/* Identity Card */}
               <div className="glass p-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-8 flex items-center gap-2">
                     <User size={14} className="text-[#00d69b]" /> Primary Identity
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/20 uppercase ml-1">Full Name</label>
                        <input 
                           required
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold focus:border-[#00d69b]/40 outline-none transition-all" 
                           placeholder="e.g. Aravind Swamy"
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/20 uppercase ml-1">Date of Birth</label>
                        <input 
                           required
                           type="date"
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold focus:border-[#00d69b]/40 outline-none transition-all [color-scheme:dark]" 
                           value={formData.dob}
                           onChange={e => setFormData({...formData, dob: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/20 uppercase ml-1">Gender</label>
                        <div className="grid grid-cols-3 gap-2">
                           {['M', 'F', 'O'].map(g => (
                              <button
                                 key={g}
                                 type="button"
                                 onClick={() => setFormData({...formData, gender: g})}
                                 className={`py-3 rounded-xl text-xs font-bold border transition-all ${formData.gender === g ? 'bg-[#00d69b]/10 border-[#00d69b]/40 text-[#00d69b]' : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'}`}
                              >
                                 {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/20 uppercase ml-1">Blood Group</label>
                        <select 
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold focus:border-[#00d69b]/40 outline-none transition-all appearance-none"
                           value={formData.blood_group}
                           onChange={e => setFormData({...formData, blood_group: e.target.value})}
                        >
                           {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                           ))}
                        </select>
                     </div>
                  </div>
               </div>

               {/* Clinical Mapping */}
               <div className="glass p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                     <Stethoscope size={100} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-8 flex items-center gap-2">
                     <ShieldCheck size={14} className="text-[#7075ff]" /> Medical Segmentation
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/20 uppercase ml-1">AYUSH Root System</label>
                        <select 
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold focus:border-[#7075ff]/40 outline-none transition-all appearance-none"
                           value={formData.ayush_system}
                           onChange={e => setFormData({...formData, ayush_system: e.target.value})}
                        >
                           {['Ayurveda', 'Siddha', 'Unani', 'Yoga', 'Homeopathy'].map(sys => (
                              <option key={sys} value={sys}>{sys}</option>
                           ))}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/20 uppercase ml-1">ABHA ID (If any)</label>
                        <input 
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold focus:border-[#7075ff]/40 outline-none transition-all" 
                           placeholder="e.g. 12-3456-7890-1234"
                           value={formData.abha_id}
                           onChange={e => setFormData({...formData, abha_id: e.target.value})}
                        />
                     </div>
                  </div>
               </div>

               {/* Contact Information */}
               <div className="glass p-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-8 flex items-center gap-2">
                     <Phone size={14} className="text-blue-400" /> Contact Details
                  </h3>
                  
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-white/20 uppercase ml-1">Phone Number</label>
                           <input 
                              type="tel"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold focus:border-blue-400/40 outline-none transition-all" 
                              placeholder="+91 98XXX XXXXX"
                              value={formData.phone}
                              onChange={e => setFormData({...formData, phone: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-white/20 uppercase ml-1">Email Address</label>
                           <input 
                              type="email"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold focus:border-blue-400/40 outline-none transition-all" 
                              placeholder="patient@example.com"
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/20 uppercase ml-1">Residential Address</label>
                        <textarea 
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold focus:border-blue-400/40 outline-none transition-all min-h-[100px] resize-none" 
                           placeholder="Enter house number, street, area..."
                           value={formData.address}
                           onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4 pt-4">
                  <button 
                     type="button"
                     onClick={() => router.back()}
                     className="px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-bold text-lg hover:bg-white/10 transition-all"
                  >
                     Discard
                  </button>
                  <button 
                     type="submit" 
                     disabled={loading}
                     className="flex-1 py-5 rounded-2xl bg-[#00d69b] text-black font-black text-lg shadow-[0_20px_40px_-10px_rgba(0,214,155,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                     {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24} /> Finalize Registration</>}
                  </button>
               </div>
               
               <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/10 pb-10">
                  By clicking finalize, you agree to secure clinical data processing under the DPDP Act 2023.
               </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
