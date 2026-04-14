'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, 
  Plus, 
  Search, 
  Activity, 
  Stethoscope, 
  ScanLine,
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  ChevronRight, 
  LogOut,
  Phone, 
  MapPin, 
  Droplets, 
  Brain, 
  AlertTriangle, 
  Eye, 
  BrainCircuit,
  Filter,
  MoreVertical,
  Calendar
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const API = 'http://localhost:8000';

export default function PatientsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      setUser({ name: 'Dr. Abishek', role: 'Chief Medical Officer' });
    } else {
      setUser(JSON.parse(u));
    }
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/patients`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setPatients(await res.json());
      } else {
        // Fallback to mock for demo
        setPatients([
          { patient_id: 'TH-P-101', name: 'Aravind Swamy', age: 34, gender: 'Male', phone: '+91 98374 82741', address: 'Chennai, TN', blood_group: 'A+', ayush_system: 'Ayurveda', encounter_count: 5, allergies: ['Penicillin'] },
          { patient_id: 'TH-P-102', name: 'Meeralakshmi R', age: 29, gender: 'Female', phone: '+91 88273 11842', address: 'Bangalore, KA', blood_group: 'B+', ayush_system: 'Siddha', encounter_count: 2, allergies: [] },
          { patient_id: 'TH-P-103', name: 'Dr. Vikram Seth', age: 52, gender: 'Male', phone: '+91 77382 99102', address: 'Mumbai, MH', blood_group: 'O-', ayush_system: 'Unani', encounter_count: 12, allergies: ['Dust'] },
        ]);
      }
    } catch {
      // Offline fallback
      setPatients([
        { patient_id: 'TH-P-101', name: 'Aravind Swamy', age: 34, gender: 'Male', phone: '+91 98374 82741', address: 'Chennai, TN', blood_group: 'A+', ayush_system: 'Ayurveda', encounter_count: 5, allergies: ['Penicillin'] },
        { patient_id: 'TH-P-102', name: 'Meeralakshmi R', age: 29, gender: 'Female', phone: '+91 88273 11842', address: 'Bangalore, KA', blood_group: 'B+', ayush_system: 'Siddha', encounter_count: 2, allergies: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search)
  );

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
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-fade-up">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Patient Registry</h1>
              <p className="text-white/40 font-medium">{patients.length} Clinically Registered Profiles</p>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => loadPatients()} className="p-3 glass hover:bg-white/10 text-white/60">
                 <Filter size={20} />
               </button>
               <button 
                 onClick={() => router.push('/dashboard/patients/new')}
                 className="btn-primary"
               >
                 <Plus size={18} /> Register Patient
               </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-10 animate-fade-up delay-100">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
             <input 
               type="text" 
               placeholder="Search by name, ID, or phone number..."
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-base focus:bg-white/10 focus:border-[#00d69b]/40 focus:ring-4 focus:ring-[#00d69b]/5 transition-all outline-none"
             />
          </div>

          {/* Patient List */}
          <div className="space-y-4 animate-fade-up delay-200">
             {loading ? (
               <div className="flex flex-col items-center justify-center py-20 text-white/20">
                 <Loader2 className="animate-spin mb-4" size={40} />
                 <span className="text-xs font-black tracking-[0.2em] uppercase">Fetching Registry...</span>
               </div>
             ) : filtered.length === 0 ? (
               <div className="glass p-20 text-center">
                 <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <Users className="text-white/20" size={40} />
                 </div>
                 <h3 className="text-xl font-bold mb-2">No Patients Found</h3>
                 <p className="text-white/40 mb-8 max-w-xs mx-auto">We couldn't find any patients matching your search criteria.</p>
                 <button onClick={() => setSearch('')} className="text-[#00d69b] font-bold text-sm hover:underline">Clear Search Filter</button>
               </div>
             ) : (
               filtered.map((p, i) => (
                 <div 
                   key={p.patient_id} 
                   onClick={() => router.push(`/dashboard/patients/${p.patient_id}`)}
                   className="glass p-6 glass-hover flex items-center gap-6 group cursor-pointer border-2 border-transparent hover:border-[#00d69b]/20"
                   style={{ animationDelay: `${i * 0.05}s` }}
                 >
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00d69b]/20 to-[#7075ff]/20 flex items-center justify-center text-xl font-black text-white border border-white/5 group-hover:scale-105 transition-transform">
                     {p.name.charAt(0)}
                   </div>
                   
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-3 mb-1">
                       <h3 className="text-lg font-bold truncate group-hover:text-[#00d69b] transition-colors">{p.name}</h3>
                       <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/5 text-white/30 border border-white/10">{p.patient_id}</span>
                       <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase ${p.ayush_system === 'Ayurveda' ? 'bg-[#ffb84d]/10 text-[#ffb84d]' : 'bg-blue-400/10 text-blue-400'}`}>
                         {p.ayush_system}
                       </div>
                     </div>
                     
                     <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-white/40">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {p.age} Y · {p.gender}</span>
                        <span className="flex items-center gap-1.5"><Droplets size={12} className="text-red-400" /> {p.blood_group}</span>
                        <span className="flex items-center gap-1.5"><Phone size={12} /> {p.phone}</span>
                        <span className="hidden md:flex items-center gap-1.5"><MapPin size={12} /> {p.address}</span>
                     </div>
                   </div>

                   <div className="hidden sm:flex flex-col items-end gap-1">
                     <div className="text-2xl font-black text-white/80 group-hover:text-[#00d69b] transition-colors">{p.encounter_count}</div>
                     <div className="text-[9px] font-black tracking-widest text-white/20 uppercase text-right leading-none">Visits</div>
                   </div>

                   <div className="p-2 rounded-lg group-hover:bg-white/5 transition-colors">
                     <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
