'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertTriangle, 
  Filter,
  Calendar,
  RefreshCcw,
  Sparkles
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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

export default function PatientsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
        setPatients([
          { patient_id: 'TH-P-101', name: 'Aravind Swamy', age: 34, gender: 'Male', phone: '+91 98374 82741', address: 'Chennai', blood_group: 'A+', ayush_system: 'Ayurveda', encounter_count: 5, status: 'Active' },
          { patient_id: 'TH-P-102', name: 'Meeralakshmi R', age: 29, gender: 'Female', phone: '+91 88273 11842', address: 'Bangalore', blood_group: 'B+', ayush_system: 'Siddha', encounter_count: 2, status: 'Stable' },
          { patient_id: 'TH-P-103', name: 'Dr. Vikram Seth', age: 52, gender: 'Male', phone: '+91 77382 99102', address: 'Mumbai', blood_group: 'O-', ayush_system: 'Unani', encounter_count: 12, status: 'In-Review' },
          { patient_id: 'TH-P-104', name: 'Kavita Iyer', age: 41, gender: 'Female', phone: '+91 99182 33412', address: 'Hyderabad', blood_group: 'AB+', ayush_system: 'Ayurveda', encounter_count: 8, status: 'Active' },
        ]);
      }
    } catch {
      setPatients([
        { patient_id: 'TH-P-101', name: 'Aravind Swamy', age: 34, gender: 'Male', phone: '+91 98374 82741', address: 'Chennai', blood_group: 'A+', ayush_system: 'Ayurveda', encounter_count: 5, status: 'Active' },
        { patient_id: 'TH-P-102', name: 'Meeralakshmi R', age: 29, gender: 'Female', phone: '+91 88273 11842', address: 'Bangalore', blood_group: 'B+', ayush_system: 'Siddha', encounter_count: 2, status: 'Stable' },
      ]);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden selection:bg-[#00d69b]/30">
      <div className="noise opacity-[0.02]" />
      
      {/* ── Sidebar ── */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-[280px] min-h-screen border-r border-white/5 backdrop-blur-3xl flex flex-col p-8 sticky top-0"
      >
        <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer group" onClick={() => router.push('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#00d69b] to-[#00b383] flex items-center justify-center shadow-lg">
            <Activity className="text-black" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Tulsi<span className="text-[#00d69b]">Health</span></span>
        </div>

        <nav className="flex-1 space-y-1.5 ">
          {NAV_ITEMS.map((item, i) => {
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

      {/* ── Main Content ── */}
      <main className="flex-1 p-12 md:p-16 relative z-10 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-xl">
                <Users className="text-[#00d69b]" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter mb-1">Patient Hub</h1>
                <p className="text-white/30 text-xs font-black uppercase tracking-[0.2em]">{patients.length} Clinical Profiles Verified</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <motion.button 
                 whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                 onClick={() => router.push('/dashboard/patients/new')}
                 className="px-8 py-4 rounded-[18px] bg-[#00d69b] text-black font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-[#00d69b]/20 transition-all flex items-center gap-3"
               >
                 <Plus size={16} strokeWidth={3} /> Register New
               </motion.button>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="relative mb-12 group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#00d69b] transition-colors" size={22} />
             <input 
               type="text" 
               placeholder="Search registry by name, ID, or bio-tokens..."
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full pl-16 pr-6 py-6 bg-white/[0.03] border border-white/5 rounded-[28px] text-lg font-bold tracking-tight focus:bg-white/[0.06] focus:border-[#00d69b]/30 transition-all outline-none placeholder:text-white/5"
             />
             <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/5 text-[9px] font-black uppercase tracking-widest hidden md:block">
               Press / to search
             </div>
          </motion.div>

          {/* Patient List */}
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <motion.div 
                  key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-32 text-white/10"
                >
                  <RefreshCcw className="animate-spin mb-6" size={48} strokeWidth={3} />
                  <span className="text-[10px] font-black tracking-[0.3em] uppercase">Syncing Registry Node</span>
                </motion.div>
              ) : filtered.length === 0 ? (
                <motion.div 
                  key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass p-24 text-center border-dashed border-white/10"
                >
                  <div className="w-24 h-24 rounded-full bg-white/[0.02] flex items-center justify-center mx-auto mb-8 border border-white/5">
                     <Users className="text-white/10" size={40} />
                  </div>
                  <h3 className="text-2xl font-black mb-3 tracking-tight">No Matches Found</h3>
                  <p className="text-white/20 text-xs font-bold uppercase tracking-widest mb-10 max-w-xs mx-auto leading-relaxed">We couldn't find any patients matching your current search parameters.</p>
                  <button onClick={() => setSearch('')} className="text-[#00d69b] font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors">Reset Global Filter</button>
                </motion.div>
              ) : (
                filtered.map((p, i) => (
                  <motion.div 
                    key={p.patient_id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => router.push(`/dashboard/patients/${p.patient_id}`)}
                    className="glass p-8 flex flex-col md:flex-row items-center gap-10 group cursor-pointer hover:border-[#00d69b]/20 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={20} className="text-[#00d69b]" />
                    </div>
                    
                    <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#00d69b]/10 to-transparent p-[1px]">
                      <div className="w-full h-full rounded-[27px] bg-primary flex items-center justify-center text-3xl font-black text-white group-hover:text-[#00d69b] transition-colors">
                        {p.name.charAt(0)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                        <h3 className="text-2xl font-black tracking-tight group-hover:text-[#00d69b] transition-colors">{p.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-3 py-1 bg-white/5 text-white/20 rounded-lg tracking-widest uppercase">{p.patient_id}</span>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-lg tracking-widest uppercase ${p.status === 'Active' ? 'bg-[#00d69b]/10 text-[#00d69b]' : 'bg-white/5 text-white/40'}`}>
                            {p.status || 'Verified'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-[11px] font-black uppercase tracking-[0.1em] text-white/20">
                         <span className="flex items-center gap-2 group-hover:text-white/40 transition-colors"><Calendar size={14} className="text-[#00d69b]" /> {p.age} Y · {p.gender}</span>
                         <span className="flex items-center gap-2 group-hover:text-white/40 transition-colors"><Droplets size={14} className="text-red-400" /> {p.blood_group}</span>
                         <span className="flex items-center gap-2 group-hover:text-white/40 transition-colors"><Phone size={14} className="text-[#7075ff]" /> {p.phone}</span>
                         <span className="hidden lg:flex items-center gap-2 group-hover:text-white/40 transition-colors"><MapPin size={14} /> {p.address}</span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 px-6 md:px-10 border-l border-white/5">
                      <div className="text-4xl font-black text-white/5 group-hover:text-[#00d69b]/20 transition-colors leading-none">{p.encounter_count}</div>
                      <div className="text-[9px] font-black tracking-[0.3em] text-white/10 uppercase text-right leading-none">Global Syncs</div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
