'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Activity, Stethoscope, ScanLine, Users, BarChart3, Settings,
  LayoutDashboard, BrainCircuit, LogOut, TrendingUp, TrendingDown,
  BookOpen, Shield, MessageSquare, ArrowUp, ArrowDown, Calendar,
  Zap, Globe2, Database, Clock, ChevronRight, Sparkles, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, LineChart, Line
} from 'recharts';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const VISIT_DATA = [
  { month: 'Sep', visits: 210, dualCoded: 180 },
  { month: 'Oct', visits: 248, dualCoded: 212 },
  { month: 'Nov', visits: 290, dualCoded: 254 },
  { month: 'Dec', visits: 312, dualCoded: 285 },
  { month: 'Jan', visits: 356, dualCoded: 318 },
  { month: 'Feb', visits: 388, dualCoded: 355 },
  { month: 'Mar', visits: 420, dualCoded: 400 },
  { month: 'Apr', visits: 445, dualCoded: 420 },
];

const CODE_DISTRIBUTION = [
  { name: 'Jwara (Fever)', value: 28, color: '#00d69b' },
  { name: 'Prameha (Diabetes)', value: 22, color: '#7075ff' },
  { name: 'Vata Disorders', value: 18, color: '#ffb84d' },
  { name: 'Kasa (Cough)', value: 14, color: '#f87171' },
  { name: 'Others', value: 18, color: '#5e5e78' },
];

const RECOVERY_TREND = [
  { week: 'W1', score: 58 }, { week: 'W2', score: 63 },
  { week: 'W3', score: 68 }, { week: 'W4', score: 72 },
  { week: 'W5', score: 74 }, { week: 'W6', score: 76 },
  { week: 'W7', score: 78 }, { week: 'W8', score: 80 },
];

const SYSTEM_PERFORMANCE = [
  { subject: 'API Speed', A: 92 }, { subject: 'Accuracy', A: 88 },
  { subject: 'Coverage', A: 76 }, { subject: 'Security', A: 94 },
  { subject: 'Uptime', A: 99 }, { subject: 'Dual-Coded', A: 85 },
];

const TOP_DIAGNOSES = [
  { code: 'AYU-D-0001', name: 'Vataja Jwara', count: 142, trend: 'up' },
  { code: 'AYU-D-0201', name: 'Prameha', count: 98, trend: 'up' },
  { code: 'AYU-D-0301', name: 'Amavata', count: 87, trend: 'down' },
  { code: 'AYU-D-0102', name: 'Kaphaja Kasa', count: 76, trend: 'up' },
  { code: 'AYU-D-0602', name: 'Shwasa', count: 54, trend: 'stable' },
];

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-4 rounded-[20px] text-[10px] font-semibold tracking-tight tracking-widest uppercase border-white/10 shadow-2xl">
      <div className="text-white/20 mb-3 border-b border-white/5 pb-2">{label} Report</div>
      <div className="space-y-2">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
            <div className="flex-1 text-white/60">{p.name}</div>
            <div className="text-white" style={{ color: p.color }}>{p.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const }
};

export default function AnalyticsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | '6m' | '1y'>('6m');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const KPI_CARDS = [
    { label: 'Total Visits', value: '2,669', change: '+18%', positive: true, icon: Calendar },
    { label: 'Dual-Coded', value: '2,424', change: '+34%', positive: true, icon: Database },
    { label: 'Recovery Score', value: '80%', change: '+12pt', positive: true, icon: TrendingUp },
    { label: 'Response Time', value: '142 ms', change: '-28ms', positive: true, icon: Zap },
    { label: 'Active Patients', value: '1,284', change: '+9%', positive: true, icon: Users },
    { label: 'AI Sessions', value: '847', change: '+41%', positive: true, icon: BrainCircuit },
  ];

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden selection:bg-[#7075ff]/30">
      <div className="noise opacity-[0.02]" />

      {/* Sidebar */}
      {/* Main */}
      <main className="w-full">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-xl">
                <BarChart3 className="text-[#7075ff]" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight tracking-tighter mb-1">Intelligence</h1>
                <p className="text-white/30 text-xs font-semibold tracking-tight uppercase tracking-[0.2em]">Clinical Performance · Global Standards Sync</p>
              </div>
            </div>
            <div className="flex gap-1.5 p-1.5 bg-white/[0.02] border border-white/5 rounded-[20px]">
              {(['7d', '30d', '6m', '1y'] as const).map(r => (
                <button 
                  key={r} 
                  onClick={() => setActiveRange(r)} 
                  className={`px-5 py-2.5 rounded-[14px] text-[10px] font-semibold tracking-tight transition-all uppercase tracking-widest ${activeRange === r ? 'bg-white text-black shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </motion.div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {KPI_CARDS.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div 
                  key={i} {...fadeInUp} transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-8 group hover:border-white/10 transition-all cursor-default relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles size={12} className="text-[#00d69b]" />
                  </div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                      <Icon size={18} className="text-white/20 group-hover:text-white transition-colors" />
                    </div>
                    <div className={`text-[10px] font-semibold tracking-tight uppercase tracking-widest ${kpi.positive ? 'text-[#00d69b]' : 'text-red-400'}`}>
                      {kpi.change}
                    </div>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight tracking-tighter text-white mb-2">{kpi.value}</div>
                  <div className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.25em] text-white/20 whitespace-nowrap">
                    {kpi.label}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <motion.div {...fadeInUp} transition={{ delay: 0.3 }} className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10 col-span-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-20">
                <Globe2 className="text-[#7075ff]" size={120} />
              </div>
              <div className="flex items-center justify-between mb-12 relative z-10">
                <div>
                  <h3 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10 mb-2">Patient Traffic & Encoding</h3>
                  <div className="text-xl font-semibold tracking-tight tracking-tight">Consultation Throughput</div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2 text-[9px] font-semibold tracking-tight uppercase tracking-widest text-white/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00d69b] shadow-[0_0_8px_#00d69b]" /> Visits
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-semibold tracking-tight uppercase tracking-widest text-white/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#7075ff] shadow-[0_0_8px_#7075ff]" /> Dual-Coded
                  </div>
                </div>
              </div>
              <div className="h-[300px] w-full mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={VISIT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d69b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#00d69b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gCoded" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7075ff" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#7075ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.02)" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: 900 }} 
                      axisLine={false} tickLine={false} dy={15} 
                    />
                    <YAxis 
                      tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: 900 }} 
                      axisLine={false} tickLine={false} 
                    />
                    <Tooltip content={<CUSTOM_TOOLTIP />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
                    <Area 
                      type="monotone" dataKey="visits" stroke="#00d69b" strokeWidth={4} 
                      fill="url(#gVisits)" name="Visits" 
                      activeDot={{ r: 6, fill: '#00d69b', stroke: '#000', strokeWidth: 2 }}
                    />
                    <Area 
                      type="monotone" dataKey="dualCoded" stroke="#7075ff" strokeWidth={4} 
                      fill="url(#gCoded)" name="Dual-Coded" 
                      activeDot={{ r: 6, fill: '#7075ff', stroke: '#000', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10 flex flex-col">
              <h3 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10 mb-8">Clinical Taxonomy Distribution</h3>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={CODE_DISTRIBUTION} cx="50%" cy="50%" innerRadius={70} outerRadius={95} 
                      paddingAngle={4} dataKey="value" stroke="none"
                    >
                      {CODE_DISTRIBUTION.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val}%`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4 mt-8">
                {CODE_DISTRIBUTION.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 10px ${item.color}40` }} />
                      <span className="text-[11px] font-semibold tracking-tight uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">{item.name}</span>
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight" style={{ color: item.color }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div {...fadeInUp} transition={{ delay: 0.5 }} className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10">Neural Response Integrity</h3>
                <div className="px-3 py-1 rounded-full bg-[#00d69b]/10 text-[#00d69b] text-[9px] font-semibold tracking-tight uppercase tracking-widest">Real-time Benchmark</div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                   <RadarChart data={SYSTEM_PERFORMANCE} cx="50%" cy="50%" outerRadius="80%">
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900 }} />
                    <Radar 
                      name="Score" dataKey="A" stroke="#00d69b" fill="#00d69b" 
                      fillOpacity={0.1} strokeWidth={3} 
                      dot={{ r: 4, fill: '#00d69b' }}
                    />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ delay: 0.6 }} className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px] p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.3em] text-white/10">High-Vibe Diagnoses</h3>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-tight text-[#00d69b]">
                  <ArrowUp size={16} /> Volume Peak
                </div>
              </div>
              <div className="space-y-4">
                {TOP_DIAGNOSES.map((d, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ x: 10 }}
                    className="flex items-center gap-6 p-6 rounded-[28px] bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all group"
                  >
                    <div className="text-2xl font-semibold tracking-tight text-white/5 group-hover:text-[#00d69b] transition-colors">{i + 1}</div>
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold uppercase tracking-tight mb-1">{d.name}</div>
                      <div className="text-[10px] text-white/10 font-semibold tracking-tight tracking-[0.2em]">{d.code}</div>
                    </div>
                    <div className="w-40 px-4 hidden md:block">
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(d.count / 150) * 100}%` }}
                          transition={{ duration: 2, ease: "easeOut" as const }}
                          className="h-full rounded-full bg-gradient-to-r from-[#00d69b] to-[#7075ff]"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold tracking-tight text-white">{d.count}</div>
                      <div className={`flex items-center justify-end gap-1 text-[9px] font-semibold tracking-tight uppercase tracking-widest ${d.trend === 'up' ? 'text-[#00d69b]' : d.trend === 'down' ? 'text-red-400' : 'text-white/20'}`}>
                        {d.trend}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}



