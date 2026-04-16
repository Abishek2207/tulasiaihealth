'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  LayoutDashboard, 
  Stethoscope, 
  ScanLine, 
  Users, 
  BarChart3,
  Settings, 
  Bell, 
  Activity, 
  TrendingUp, 
  UserCheck, 
  Clock,
  Calendar, 
  LogOut,
  Search,
  Plus,
  BrainCircuit,
  BookOpen,
  Shield,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BrainCircuit, label: 'AI Triage', href: '/dashboard/triage' },
  { icon: BookOpen, label: 'Diagnosis', href: '/dashboard/diagnosis' },
  { icon: MessageSquare, label: 'AI Assistant', href: '/dashboard/ai' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Shield, label: 'Admin', href: '/dashboard/admin' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const STATS = [
  { label: 'Total Patients', value: '1,248', change: '+12%', icon: Users, accent: '#00d69b' },
  { label: "Today's Appointments", value: '24', change: '+8%', icon: Calendar, accent: '#7075ff' },
  { label: 'Dual-Coded Today', value: '86', change: '+34%', icon: Stethoscope, accent: '#ffb84d' },
  { label: 'Avg Recovery Speed', value: '84%', change: '+5%', icon: TrendingUp, accent: '#f87171' },
];

const CHART_DATA = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 30 },
  { name: 'Wed', value: 65 },
  { name: 'Thu', value: 45 },
  { name: 'Fri', value: 90 },
  { name: 'Sat', value: 70 },
  { name: 'Sun', value: 85 },
];

const ACTIVITY = [
  { patient: 'Rajan Kumar', action: 'Dual-coded: Vataja Jwara → 1D01', time: '2 min ago', status: 'completed' },
  { patient: 'Priya Sharma', action: 'QR Scan verified identity', time: '18 min ago', status: 'completed' },
  { patient: 'Amit Patel', action: 'FHIR Bundle uploaded', time: '35 min ago', status: 'pending' },
  { patient: 'Sunita Devi', action: 'Appointment scheduled', time: '1 hr ago', status: 'upcoming' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const }
};

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      const defaultUser = { name: 'Dr. Abishek', role: 'Chief Medical Officer' };
      setUser(defaultUser);
      localStorage.setItem('user', JSON.stringify(defaultUser));
    } else {
      setUser(JSON.parse(u));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden">
      <div className="noise opacity-[0.02]" />
      
      {/* ── Sidebar ── */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" as const }}
        className="w-[280px] min-h-screen border-r border-white/5 backdrop-blur-3xl flex flex-col p-8 sticky top-0"
      >
        <div 
          className="flex items-center gap-3 mb-12 px-2 cursor-pointer group" 
          onClick={() => router.push('/')}
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#00d69b] to-[#00b383] flex items-center justify-center shadow-lg"
          >
            <Activity className="text-black" size={20} />
          </motion.div>
          <span className="text-xl font-bold tracking-tight">Tulsi<span className="text-[#00d69b]">Health</span></span>
        </div>

        <nav className="flex-1 space-y-1.5 ">
          {NAV_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-white/5 text-[#00d69b]' : 'text-white/40 hover:text-white'}`}
              >
                <Icon size={18} className={isActive ? 'text-[#00d69b]' : 'group-hover:text-white transition-colors'} />
                <span className="text-[13px] font-bold tracking-tight">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 bg-[#00d69b] rounded-full shadow-[0_0_10px_#00d69b]" 
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5">
          <div className="bg-white/5 rounded-3xl p-4 flex items-center gap-4 group">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#00d69b] to-[#7075ff] flex items-center justify-center text-xs font-black border-2 border-white/10 text-black">
              {user.name?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-black truncate">{user.name}</div>
              <div className="text-[9px] uppercase font-black tracking-widest text-[#00d69b] opacity-80">{user.role || 'Doctor'}</div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, x: 2 }}
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-12 md:p-16 relative z-10 overflow-y-auto selection:bg-[#00d69b]/30">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
          <motion.div {...fadeInUp}>
            <h1 className="text-5xl font-black tracking-tighter mb-3 leading-none">
              Welcome back, <span className="gradient-text">{user.name?.split(' ')[1] || user.name}</span>
            </h1>
            <p className="text-white/30 text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
              <Calendar size={14} className="text-[#00d69b]" /> 
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </motion.div>

          <motion.div 
            {...fadeInUp} transition={{ delay: 0.1 }}
            className="flex items-center gap-6"
          >
            <div className={`relative transition-all duration-500 ease-[0.16, 1, 0.3, 1] ${searchFocused ? 'w-80 md:w-[400px]' : 'w-56 md:w-72'}`}>
              <Search className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-[#00d69b]' : 'text-white/20'}`} size={18} />
              <input 
                type="text" 
                placeholder="Search patient intelligence..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-[20px] text-[13px] font-medium focus:bg-white/10 focus:border-[#00d69b]/30 transition-all outline-none"
              />
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              className="p-4 glass rounded-[20px] hover:bg-white/10 text-white/40 transition-colors relative"
            >
              <Bell size={20} />
              <span className="absolute top-4 right-4 w-2 h-2 bg-[#00d69b] rounded-full shadow-[0_0_10px_#00d69b]" />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard/emr')}
              className="btn-primary"
            >
              <Plus size={18} strokeWidth={3} /> <span className="uppercase tracking-widest text-[11px] font-black">New Case</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={stat.label} 
                {...fadeInUp}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="glass p-8 glass-hover group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all bg-white/5 border border-white/5 group-hover:scale-110">
                    <Icon size={24} style={{ color: stat.accent }} />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-[#00d69b]/10 text-[#00d69b] tracking-wider uppercase">{stat.change}</span>
                </div>
                <div className="text-4xl font-black mb-1 tracking-tighter">{stat.value}</div>
                <div className="text-[11px] font-black uppercase tracking-[0.15em] text-white/20">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-16">
          {/* Chart Section */}
          <motion.div 
            {...fadeInUp} transition={{ delay: 0.4 }}
            className="xl:col-span-2 glass p-10"
          >
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black mb-1 tracking-tight">Diagnosis Intelligence</h3>
                <p className="text-[13px] font-bold text-white/30 uppercase tracking-widest">Active patient volume trends</p>
              </div>
              <select className="bg-white/5 border border-white/5 rounded-xl px-5 py-2.5 text-[11px] font-black outline-none cursor-pointer hover:bg-white/10 transition-colors uppercase tracking-widest">
                <option>Weekly View</option>
                <option>Monthly View</option>
              </select>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d69b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00d69b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 800 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', backdropFilter: 'blur(40px)', padding: '15px' }}
                    itemStyle={{ color: '#00d69b', fontSize: '13px', fontWeight: '900' }}
                    labelStyle={{ color: 'white', marginBottom: '6px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', opacity: 0.5 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00d69b" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Activity Section */}
          <motion.div 
            {...fadeInUp} transition={{ delay: 0.5 }}
            className="glass p-10 flex flex-col"
          >
            <h3 className="text-2xl font-black mb-8 tracking-tight">Intelligence Feed</h3>
            <div className="space-y-5 flex-1">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="group p-5 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[#00d69b]/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {a.status === 'completed' ? <UserCheck size={20} className="text-[#00d69b]" /> : <Clock size={20} className="text-[#ffb84d]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-black truncate">{a.patient}</div>
                      <div className="text-[11px] font-medium text-white/30 truncate group-hover:text-white/50 transition-colors">{a.action}</div>
                    </div>
                    <div className="text-[10px] font-black text-white/20 whitespace-nowrap">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-5 mt-8 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black hover:bg-white/10 transition-colors uppercase tracking-[0.2em]"
            >
              Full Audit Trail
            </motion.button>
          </motion.div>
        </div>

        {/* Quick Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <motion.div {...fadeInUp} transition={{ delay: 0.6 }} className="glass p-10 bg-[#7075ff]/[0.02] border-[#7075ff]/10">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <ScanLine size={24} className="text-[#7075ff]" /> Identification
            </h3>
            <div className="p-8 rounded-[32px] bg-[#7075ff]/5 border border-[#7075ff]/10 text-center">
              <div className="w-18 h-18 rounded-full bg-[#7075ff]/10 border border-[#7075ff]/20 flex items-center justify-center mx-auto mb-6">
                <ScanLine className="text-[#7075ff]" size={32} />
              </div>
              <p className="text-sm font-medium text-white/40 mb-8 leading-relaxed">Secure verification using QR tokens or ABHA biometric IDs.</p>
              <button onClick={() => router.push('/dashboard/qr-scan')} className="w-full py-5 rounded-[20px] bg-[#7075ff] text-white font-black text-sm shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all uppercase tracking-widest">
                Scan Patient QR
              </button>
            </div>
          </motion.div>

          <motion.div {...fadeInUp} transition={{ delay: 0.7 }} className="glass p-10 bg-[#00d69b]/[0.02] border-[#00d69b]/10">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <BrainCircuit size={24} className="text-[#00d69b]" /> Smart Triage
            </h3>
            <div className="space-y-4">
              {[
                "Extract NAMASTE Symptoms",
                "Predict Recovery Risk",
                "Recommend AYUSH Treatment"
              ].map(item => (
                <div key={item} className="flex items-center justify-between p-4 px-6 rounded-[20px] bg-white/5 border border-white/0 hover:border-[#00d69b]/20 transition-all group cursor-pointer">
                  <span className="text-[13px] font-bold text-white/40 group-hover:text-white transition-colors">{item}</span>
                  <ChevronRight size={18} className="text-white/20 group-hover:text-[#00d69b] transition-all group-hover:translate-x-1" />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeInUp} transition={{ delay: 0.8 }} className="glass p-10">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-white/40 uppercase tracking-widest text-xs">
              <Shield size={20} className="text-emerald-400" /> System Integrity
            </h3>
            <div className="space-y-5">
              {[
                { name: 'ICD-API SYNC', status: 'ONLINE', color: '#00d69b' },
                { name: 'FHIR CORE R4', status: 'OPTIMAL', color: '#00d69b' },
                { name: 'NLP LAYER', status: 'ACTIVE', color: '#00d69b' },
                { name: 'BLOCKCHAIN TRAIL', status: 'SECURED', color: '#00d69b' },
              ].map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/20 tracking-widest">{s.name}</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                    <span className="text-[10px] font-black tracking-tight" style={{ color: s.color }}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-white/5">
              <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Memory Allocation</div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '64%' }}
                  transition={{ duration: 1.5, delay: 1, ease: "circOut" as const }}
                  className="h-full bg-gradient-to-r from-[#00d69b] to-[#7075ff] rounded-full" 
                />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
