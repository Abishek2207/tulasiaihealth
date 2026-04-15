'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  FileText, 
  ChevronRight, 
  LogOut,
  Search,
  Plus,
  BrainCircuit,
  BookOpen,
  Shield,
  MessageSquare
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

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      // For demo purposes, set a default user if none exists
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
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-[#00d69b]/10 text-[#00d69b] border border-[#00d69b]/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={18} className={isActive ? 'text-[#00d69b]' : 'group-hover:text-white'} />
                <span className="text-sm font-semibold">{item.label}</span>
                {isActive && <div className="ml-auto w-1 h-4 bg-[#00d69b] rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 relative group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d69b] to-[#7075ff] flex items-center justify-center text-sm font-bold border-2 border-white/10">
              {user.name?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{user.name}</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-white/40">{user.role || 'Doctor'}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-8 md:p-12 relative z-10 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="animate-fade-up">
            <h1 className="text-4xl font-black tracking-tight mb-2">
              Welcome back, <span className="gradient-text">{user.name?.split(' ')[1] || user.name}</span>
            </h1>
            <p className="text-white/40 font-medium flex items-center gap-2">
              <Calendar size={14} /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="flex items-center gap-4 animate-fade-up delay-100">
            <div className={`relative transition-all duration-300 ${searchFocused ? 'w-64 md:w-80' : 'w-48 md:w-64'}`}>
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-[#00d69b]' : 'text-white/30'}`} size={18} />
              <input 
                type="text" 
                placeholder="Search patient records..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:bg-white/10 focus:border-[#00d69b]/50 focus:ring-4 focus:ring-[#00d69b]/10 transition-all outline-none"
              />
            </div>
            <button className="p-3 glass hover:bg-white/10 text-white/60 relative">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-[#00d69b] rounded-full shadow-[0_0_8px_#00d69b]" />
            </button>
            <button 
              onClick={() => router.push('/dashboard/emr')}
              className="btn-primary"
            >
              <Plus size={18} /> New Case
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass p-6 glass-hover animate-fade-up" style={{ animationDelay: `${(i+2)*0.1}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: `${stat.accent}15`, border: `1px solid ${stat.accent}20` }}>
                    <Icon size={22} style={{ color: stat.accent }} />
                  </div>
                  <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-[#00d69b]/10 text-[#00d69b]">{stat.change}</span>
                </div>
                <div className="text-3xl font-black mb-1">{stat.value}</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/30">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Main Grid: Chart & Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          {/* Chart Section */}
          <div className="xl:col-span-2 glass p-8 animate-fade-up delay-400">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold mb-1">Diagnosis Analytics</h3>
                <p className="text-sm text-white/40">Patient volume trends for this week</p>
              </div>
              <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer hover:bg-white/10 transition-colors">
                <option>Weekly View</option>
                <option>Monthly View</option>
              </select>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d69b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00d69b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,20,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(20px)' }}
                    itemStyle={{ color: '#00d69b', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: 'white', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00d69b" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Section */}
          <div className="glass p-8 animate-fade-up delay-500 flex flex-col">
            <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
            <div className="space-y-4 flex-1">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {a.status === 'completed' ? <UserCheck size={18} className="text-[#00d69b]" /> : <Clock size={18} className="text-[#ffb84d]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate">{a.patient}</div>
                      <div className="text-[11px] text-white/40 truncate">{a.action}</div>
                    </div>
                    <div className="text-[10px] font-bold text-white/20">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 mt-6 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors uppercase tracking-widest leading-none">
              View All History
            </button>
          </div>
        </div>

        {/* Quick Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="glass p-8 animate-fade-up delay-600">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ScanLine size={20} className="text-[#7075ff]" /> Patient Onboarding
            </h3>
            <div className="p-6 rounded-2xl bg-[#7075ff]/5 border border-[#7075ff]/20 text-center">
              <div className="w-16 h-16 rounded-full bg-[#7075ff]/10 border border-[#7075ff]/20 flex items-center justify-center mx-auto mb-4">
                <ScanLine className="text-[#7075ff]" size={28} />
              </div>
              <p className="text-sm text-white/60 mb-6">Instantly verify patient identities using advanced QR tokens or ABHA IDs.</p>
              <button onClick={() => router.push('/dashboard/qr-scan')} className="w-full py-4 px-6 rounded-xl bg-[#7075ff] text-white font-bold text-sm shadow-[0_12px_24px_-8px_rgba(112,117,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                Scan QR Now
              </button>
            </div>
          </div>

          <div className="glass p-8 animate-fade-up delay-700">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BrainCircuit size={20} className="text-[#00d69b]" /> Smart Triage
            </h3>
            <div className="space-y-4">
              {[
                "Extract NAMASTE Symptoms",
                "Predict Recovery Risk",
                "Recommend AYUSH Medicines"
              ].map(item => (
                <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#00d69b]/30 transition-colors group cursor-pointer">
                  <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">{item}</span>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-[#00d69b] transition-colors" />
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-8 animate-fade-up delay-800 border-emerald-500/10 bg-emerald-500/[0.02]">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[#00d69b]">
              <Settings size={20} /> System Engine
            </h3>
            <div className="space-y-3">
              {[
                { name: 'ICD-API Sync', status: 'Online', color: '#00d69b' },
                { name: 'FHIR Engine', status: 'Optimal', color: '#00d69b' },
                { name: 'AI NLP Layer', status: 'Active', color: '#00d69b' },
                { name: 'Blockchain Trail', status: 'Secured', color: '#00d69b' },
              ].map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/40">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: s.color }}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Storage Usage</div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#00d69b] rounded-full" style={{ width: '64%' }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
