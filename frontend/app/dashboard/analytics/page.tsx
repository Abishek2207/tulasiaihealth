'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, Stethoscope, ScanLine, Users, BarChart3, Settings,
  LayoutDashboard, BrainCircuit, LogOut, TrendingUp, TrendingDown,
  BookOpen, Shield, MessageSquare, ArrowUp, ArrowDown, Calendar,
  Zap, Globe2, Database, Clock
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
  { icon: BrainCircuit, label: 'AI Triage', href: '/dashboard/triage' },
  { icon: BookOpen, label: 'Diagnosis', href: '/dashboard/diagnosis' },
  { icon: MessageSquare, label: 'AI Assistant', href: '/dashboard/ai' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Shield, label: 'Admin', href: '/dashboard/admin' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

// ── Chart Data ────────────────────────────────────────────────────────────────

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
  { subject: 'Uptime', A: 99 }, { subject: 'Dual-Code %', A: 85 },
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
    <div className="glass p-3 rounded-xl text-xs font-bold border border-white/10">
      <div className="text-white/50 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | '6m' | '1y'>('6m');

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    router.push('/login');
  };

  const KPI_CARDS = [
    { label: 'Total Visits', value: '2,669', change: '+18%', positive: true, icon: Calendar },
    { label: 'Dual-Coded Records', value: '2,424', change: '+34%', positive: true, icon: Database },
    { label: 'Avg Recovery Score', value: '80%', change: '+12pt', positive: true, icon: TrendingUp },
    { label: 'Avg Response Time', value: '142 ms', change: '-28ms', positive: true, icon: Zap },
    { label: 'Active Patients', value: '1,284', change: '+9%', positive: true, icon: Users },
    { label: 'AI Triage Sessions', value: '847', change: '+41%', positive: true, icon: BrainCircuit },
  ];

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
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-[#00d69b]/10 text-[#00d69b] border border-[#00d69b]/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={18} />
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

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1300px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#7075ff]/10 border border-[#7075ff]/20 flex items-center justify-center">
                <BarChart3 className="text-[#7075ff]" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Platform Analytics</h1>
                <p className="text-white/40 font-medium">Real-time clinical intelligence · AYUSH + ICD-11</p>
              </div>
            </div>
            <div className="flex gap-1 p-1 glass rounded-xl">
              {(['7d', '30d', '6m', '1y'] as const).map(r => (
                <button key={r} onClick={() => setActiveRange(r)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all uppercase ${activeRange === r ? 'bg-[#00d69b] text-black' : 'text-white/40 hover:text-white'}`}>{r}</button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {KPI_CARDS.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className="glass p-5 hover:border-white/10 transition-all glass-hover">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{kpi.label}</span>
                    <Icon size={15} className="text-white/20" />
                  </div>
                  <div className="text-2xl font-black text-white mb-2">{kpi.value}</div>
                  <div className={`flex items-center gap-1 text-[11px] font-black ${kpi.positive ? 'text-[#00d69b]' : 'text-red-400'}`}>
                    {kpi.positive ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                    {kpi.change} vs last period
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Visits Chart */}
            <div className="glass p-6 col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Monthly Visits vs Dual-Coded Records</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-[#00d69b]" />Visits</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-[#7075ff]" />Dual-Coded</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={VISIT_DATA}>
                  <defs>
                    <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d69b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00d69b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCoded" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7075ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7075ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Area type="monotone" dataKey="visits" stroke="#00d69b" strokeWidth={2} fill="url(#gVisits)" name="Visits" />
                  <Area type="monotone" dataKey="dualCoded" stroke="#7075ff" strokeWidth={2} fill="url(#gCoded)" name="Dual-Coded" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Diagnosis Distribution Pie */}
            <div className="glass p-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Diagnosis Distribution</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={CODE_DISTRIBUTION} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {CODE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={index} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {CODE_DISTRIBUTION.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-white/50">{item.name}</span>
                    </div>
                    <span style={{ color: item.color }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Recovery Trend */}
            <div className="glass p-6 col-span-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Recovery Score Trend (8 Weeks)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={RECOVERY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Line type="monotone" dataKey="score" stroke="#00d69b" strokeWidth={2.5} dot={{ fill: '#00d69b', r: 4 }} name="Score %" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* System Performance Radar */}
            <div className="glass p-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-4">System Performance</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={SYSTEM_PERFORMANCE}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} />
                  <Radar name="Score" dataKey="A" stroke="#00d69b" fill="#00d69b" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Diagnoses Table */}
          <div className="glass p-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Top NAMASTE Diagnoses — This Month</h3>
            <div className="space-y-3">
              {TOP_DIAGNOSES.map((d, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                  <div className="text-lg font-black text-white/10 w-6 text-right">{i + 1}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{d.name}</div>
                    <div className="text-[10px] text-white/30 font-mono">{d.code}</div>
                  </div>
                  <div className="w-32">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00d69b] to-[#7075ff]"
                        style={{ width: `${(d.count / 150) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right font-black text-[#00d69b]">{d.count}</div>
                  <div className={`flex items-center gap-1 text-[10px] font-black w-16 justify-end ${d.trend === 'up' ? 'text-[#00d69b]' : d.trend === 'down' ? 'text-red-400' : 'text-white/30'}`}>
                    {d.trend === 'up' ? <ArrowUp size={10} /> : d.trend === 'down' ? <ArrowDown size={10} /> : null}
                    {d.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
