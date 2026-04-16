'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, 
  Settings, 
  Bell, 
  Activity, 
  TrendingUp, 
  UserCheck, 
  Clock,
  Calendar, 
  Search,
  Plus,
  BrainCircuit,
  Shield,
  ScanLine,
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

const STATS = [
  { label: 'Total Patients', value: '1,248', change: '+12%', icon: Users, accent: '#00d69b' },
  { label: "Today's Appointments", value: '24', change: '+8%', icon: Calendar, accent: '#00A3FF' },
  { label: 'Dual-Coded Today', value: '86', change: '+34%', icon: Activity, accent: '#ffb84d' },
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

const springUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { ease: "easeOut" as "easeOut" }
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      setUser({ name: 'Dr. Abishek', role: 'Chief Medical Officer' });
    } else {
      setUser(JSON.parse(u));
    }
  }, []);

  if (!user) return null;

  return (
    <div className="p-8 md:p-12 lg:p-16 w-full max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
        <motion.div {...springUp}>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-2 leading-none">
            Welcome back, {user.name?.split(' ')[1] || user.name}
          </h1>
          <p className="text-white/40 text-sm font-medium flex items-center gap-2">
            <Calendar size={14} className="text-[#00D69B]" /> 
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        <motion.div 
          {...springUp} 
          className="flex items-center gap-4"
        >
          <div className={`relative transition-all duration-500 flex ${searchFocused ? 'w-80 md:w-[320px]' : 'w-56 md:w-64'}`}>
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-[#00D69B]' : 'text-white/20'}`} size={16} />
            <input 
              type="text" 
              placeholder="Search patients..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-12 pr-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-[13px] font-medium focus:bg-white/[0.04] focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all outline-none text-white placeholder:text-white/20"
            />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] text-white/40 hover:text-white transition-colors relative shadow-sm"
          >
            <Bell size={18} />
            <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-[#00D69B] rounded-full" />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/dashboard/emr')}
            className="flex items-center gap-2 px-5 py-3.5 bg-white text-black rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer font-semibold text-[13px]"
          >
            <Plus size={16} strokeWidth={2.5} /> New Case
          </motion.button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.label} 
              {...springUp}
              transition={{ delay: i * 0.05, ease: "easeOut" }}
              className="p-8 rounded-3xl bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] hover:bg-white/[0.03] transition-colors group cursor-default"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-[18px] bg-white/[0.03] flex items-center justify-center border border-white/[0.04] group-hover:scale-105 transition-transform duration-300">
                  <Icon size={20} style={{ color: stat.accent }} />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.03] text-white/60 group-hover:bg-[#00D69B]/10 group-hover:text-[#00D69B] transition-colors">{stat.change}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-semibold tracking-tight text-white mb-1">{stat.value}</span>
                <span className="text-[13px] font-medium text-white/40">{stat.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-16">
        {/* Chart Section */}
        <motion.div 
          {...springUp} transition={{ delay: 0.1 }}
          className="xl:col-span-2 p-8 md:p-10 rounded-[32px] bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] flex flex-col"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white mb-1">Diagnosis Volume</h3>
              <p className="text-[13px] font-medium text-white/40">Patient encounters across facilities</p>
            </div>
            <select className="bg-transparent border-none text-[13px] font-medium text-white/60 outline-none cursor-pointer hover:text-white transition-colors">
              <option className="bg-[#0a0a0a]">Weekly View</option>
              <option className="bg-[#0a0a0a]">Monthly View</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A3FF" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#00A3FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(255,255,255,0.02)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 500 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10,10,10,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', backdropFilter: 'blur(20px)', padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#00A3FF', fontSize: '14px', fontWeight: '600' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}
                />
                <Area type="monotone" dataKey="value" stroke="#00A3FF" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Section */}
        <motion.div 
          {...springUp} transition={{ delay: 0.15 }}
          className="p-8 md:p-10 rounded-[32px] bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold tracking-tight text-white mb-1">Intelligence Feed</h3>
          </div>
          <div className="space-y-3 flex-1">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="group p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-colors cursor-default">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0">
                    {a.status === 'completed' ? <UserCheck size={16} className="text-[#00D69B]" /> : <Clock size={16} className="text-[#00A3FF]" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="text-[13px] font-semibold text-white/90 truncate">{a.patient}</div>
                      <div className="text-[11px] font-medium text-white/30 whitespace-nowrap">{a.time}</div>
                    </div>
                    <div className="text-[12px] font-medium text-white/40 truncate line-clamp-1">{a.action}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 mt-6 rounded-xl bg-white/[0.02] text-[13px] font-semibold text-white/60 hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            View Entire Log
          </motion.button>
        </motion.div>
      </div>

      {/* Quick Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div {...springUp} transition={{ delay: 0.2 }} className="p-10 rounded-[32px] bg-white/[0.01] border border-white/[0.03] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-2xl">
            <div className="w-40 h-40 bg-[#00A3FF] rounded-full" />
          </div>
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-3">
            <ScanLine size={18} className="text-[#00A3FF]" /> Identification
          </h3>
          <p className="text-[13px] font-medium text-white/40 mb-8 leading-relaxed max-w-[200px]">Secure verification using local QR tokens or global ABHA biometric IDs.</p>
          <button onClick={() => router.push('/dashboard/qr-scan')} className="px-6 py-3 rounded-xl bg-white/[0.04] text-white hover:bg-[#00A3FF] font-semibold text-[13px] transition-colors relative z-10">
            Open Scanner
          </button>
        </motion.div>

        <motion.div {...springUp} transition={{ delay: 0.25 }} className="p-10 rounded-[32px] bg-white/[0.01] border border-white/[0.03] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-2xl">
            <div className="w-40 h-40 bg-[#00D69B] rounded-full" />
          </div>
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-3">
            <BrainCircuit size={18} className="text-[#00D69B]" /> Neural Core
          </h3>
          <div className="space-y-3 relative z-10 w-full">
            {[
              "Extract Symptoms via NLP",
              "Predict Recovery Risk",
              "Execute AYUSH Protocol"
            ].map(item => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-white/[0.02] last:border-0 group/item cursor-pointer">
                <span className="text-[13px] font-medium text-white/50 group-hover/item:text-white transition-colors">{item}</span>
                <ChevronRight size={14} className="text-white/20 group-hover/item:text-white transition-all group-hover/item:translate-x-1" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...springUp} transition={{ delay: 0.3 }} className="p-10 rounded-[32px] bg-white/[0.01] border border-white/[0.03]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-3 text-white">
            <Shield size={18} className="text-white/40" /> System Integrity
          </h3>
          <div className="space-y-4 mb-10">
            {[
              { name: 'ICD-11 API Sync', status: 'Optimal', color: '#00D69B' },
              { name: 'FHIR Translation', status: 'Active', color: '#00D69B' },
              { name: 'Blockchain Trail', status: 'Secured', color: '#00A3FF' },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-white/40">{s.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[12px] font-semibold text-white/80">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3">
               <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Memory</span>
               <span className="text-[11px] font-semibold text-white">64%</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '64%' }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#00A3FF] to-[#00D69B] rounded-full" 
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}



