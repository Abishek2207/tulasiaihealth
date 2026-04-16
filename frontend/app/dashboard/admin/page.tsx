'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Activity, Stethoscope, ScanLine, Users, BarChart3, Settings,
  LayoutDashboard, BrainCircuit, LogOut, Shield, Search,
  BookOpen, Loader2, AlertTriangle, CheckCircle2, Clock,
  Eye, Download, RefreshCw, Filter, User, Database,
  Lock, Unlock, Server, Wifi, Hash, ChevronRight, Cpu
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const MOCK_AUDIT_LOGS = [
  { id: 'EVT-001', timestamp: '2025-04-15T09:23:11Z', action: 'READ', resource: 'Patient', resourceId: 'TH-2024-001', user: 'Dr. Abishek', role: 'doctor', ip: '192.168.1.10', status: 'success', hash: 'a3f8c2d1' },
  { id: 'EVT-002', timestamp: '2025-04-15T09:18:44Z', action: 'CREATE', resource: 'Encounter', resourceId: 'ENC-0042', user: 'Dr. Kavitha', role: 'doctor', ip: '192.168.1.15', status: 'success', hash: 'b9e1f4a2' },
  { id: 'EVT-003', timestamp: '2025-04-15T09:12:03Z', action: 'WRITE', resource: 'Condition', resourceId: 'COND-0088', user: 'Dr. Abishek', role: 'doctor', ip: '192.168.1.10', status: 'success', hash: 'c2d4a8f1' },
  { id: 'EVT-004', timestamp: '2025-04-15T08:55:29Z', action: 'READ', resource: 'Patient', resourceId: 'TH-2024-002', user: 'Patient#002', role: 'patient', ip: '203.0.113.5', status: 'success', hash: 'd7b3e9c5' },
  { id: 'EVT-005', timestamp: '2025-04-15T08:44:01Z', action: 'DELETE', resource: 'AuditLog', resourceId: 'EVT-000', user: 'admin', role: 'admin', ip: '10.0.0.1', status: 'denied', hash: 'e1a5f8d3' },
  { id: 'EVT-006', timestamp: '2025-04-15T08:30:18Z', action: 'LOGIN', resource: 'Auth', resourceId: 'SESSION-099', user: 'Dr. Abishek', role: 'doctor', ip: '192.168.1.10', status: 'success', hash: 'f4c9b2e7' },
];

const SYSTEM_STATS = {
  totalPatients: 1284,
  todayVisits: 47,
  activeUsers: 12,
  storageUsed: '3.2 GB',
  uptime: '99.97%',
  apiCalls: '156,238',
  avgResponseTime: '142 ms',
  securityScore: 94,
};

const USERS = [
  { name: 'Dr. Abishek Kumar', role: 'doctor', status: 'active', lastActive: '2 min ago', permissions: ['read', 'write', 'prescribe'] },
  { name: 'Dr. Kavitha Rajaram', role: 'doctor', status: 'active', lastActive: '15 min ago', permissions: ['read', 'write', 'prescribe'] },
  { name: 'Admin User', role: 'admin', status: 'active', lastActive: '30 min ago', permissions: ['manage_users', 'audit_view'] },
];

const ACTION_COLORS: Record<string, string> = {
  READ: 'text-blue-400 bg-blue-400/5 border-blue-400/20',
  CREATE: 'text-[#00d69b] bg-[#00d69b]/5 border-[#00d69b]/20',
  WRITE: 'text-amber-400 bg-amber-400/5 border-amber-400/20',
  DELETE: 'text-red-400 bg-red-400/5 border-red-400/20',
  LOGIN: 'text-[#7075ff] bg-[#7075ff]/5 border-[#7075ff]/20',
};

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const }
};

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'system'>('audit');
  const [auditLogs, setAuditLogs] = useState(MOCK_AUDIT_LOGS);
  const [searchAudit, setSearchAudit] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetch(`${API}/api/audit/logs?limit=50`, {
      headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.logs?.length) setAuditLogs(data.logs); })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const filteredLogs = auditLogs
    .filter(l => actionFilter === 'all' || l.action === actionFilter)
    .filter(l => !searchAudit || l.user.toLowerCase().includes(searchAudit.toLowerCase()) || l.resource.toLowerCase().includes(searchAudit.toLowerCase()));

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden selection:bg-red-500/30">
      <div className="noise opacity-[0.02]" />

      <motion.aside 
        initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" as const }}
        className="w-[280px] min-h-screen border-r border-white/5 backdrop-blur-3xl flex flex-col p-8 sticky top-0"
      >
        <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer group" onClick={() => router.push('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Activity className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Tulsi<span className="text-red-400">Admin</span></span>
        </div>
        <nav className="flex-1 space-y-1.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white'}`}>
                <Icon size={18} className={isActive ? 'text-red-400' : 'group-hover:text-white transition-colors'} />
                <span className="text-[13px] font-bold tracking-tight">{item.label}</span>
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

      <main className="flex-1 p-12 md:p-16 overflow-y-auto scrollbar-hide">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-red-500/5 border border-red-500/20 flex items-center justify-center shadow-xl">
                <Shield className="text-red-400" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter mb-1">Infrastructure Control</h1>
                <p className="text-white/30 text-xs font-black uppercase tracking-[0.2em] leading-relaxed italic">ISO 22600 · Blockchain Ledger Active</p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 px-6 py-3 bg-red-500/5 rounded-2xl border border-red-500/20 backdrop-blur-xl group cursor-help">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-red-100 group-hover:text-red-400 transition-colors">Security Score: {SYSTEM_STATS.securityScore}/100</span>
            </motion.div>
          </motion.div>

          {/* Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Patient Node Count', value: SYSTEM_STATS.totalPatients.toLocaleString(), icon: Users, color: '#00d69b' },
              { label: 'Network Latency', value: SYSTEM_STATS.avgResponseTime, icon: Wifi, color: '#7075ff' },
              { label: 'Compute Load', value: '24%', icon: Cpu, color: '#ffb84d' },
              { label: 'Audit Chain Height', value: '42,901', icon: Hash, color: '#f87171' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  key={i} className="glass p-8 group hover:border-white/20 transition-all cursor-default"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/20 group-hover:text-white transition-colors">
                      <Icon size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-black tracking-tighter mb-1" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation Tabs */}
          <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className="flex p-1.5 bg-white/[0.03] rounded-[24px] border border-white/5 mb-10 w-fit">
            {(['audit', 'users', 'system'] as const).map(tab => (
              <button 
                key={tab} onClick={() => setActiveTab(tab)} 
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-white/20 hover:text-white/40'}`}
              >
                {tab === 'audit' ? 'Event Stream' : tab === 'users' ? 'Access Control' : 'System Integrity'}
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === 'audit' && (
              <motion.div 
                key="audit" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Search & Filter Header */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex items-center gap-4 glass border border-white/5 rounded-2xl px-6 py-4 flex-1">
                    <Search size={18} className="text-white/10" />
                    <input
                      value={searchAudit}
                      onChange={e => setSearchAudit(e.target.value)}
                      placeholder="Filter audit stream..."
                      className="flex-1 bg-transparent text-sm font-bold tracking-tight outline-none placeholder:text-white/5"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['all', 'READ', 'CREATE', 'WRITE', 'DELETE', 'LOGIN'].map(f => (
                      <button key={f} onClick={() => setActionFilter(f)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${actionFilter === f ? 'bg-white text-black border-transparent' : 'text-white/20 border-white/10 hover:border-white/20'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audit Stream */}
                <div className="glass overflow-hidden rounded-[32px] border-white/5">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          {['Sequence', 'Event Node', 'Entity', 'Identity', 'Security Status', 'Hash Commit'].map(h => (
                            <th key={h} className="text-left px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/10">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log, i) => (
                          <motion.tr 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                            key={log.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group/row"
                          >
                            <td className="px-8 py-5">
                              <div className="text-[11px] font-mono text-white/40">{new Date(log.timestamp).toLocaleTimeString()}</div>
                              <div className="text-[8px] text-white/10 font-black uppercase mt-1">{new Date(log.timestamp).toLocaleDateString()}</div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border ${ACTION_COLORS[log.action] || 'text-white/40 bg-white/5 border-white/10'}`}>{log.action}</span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="text-[12px] font-black tracking-tight">{log.resource}</div>
                              <div className="text-[8px] text-white/20 font-mono mt-1 opacity-40">{log.resourceId}</div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black">{log.user[0]}</div>
                                <div>
                                  <div className="text-[12px] font-bold tracking-tight">{log.user}</div>
                                  <div className={`text-[8px] font-black uppercase mt-0.5 ${log.role === 'admin' ? 'text-red-400' : 'text-white/30'}`}>{log.role}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase ${log.status === 'success' ? 'text-[#00d69b]' : 'text-red-400'}`}>
                                <div className={`w-1 h-1 rounded-full ${log.status === 'success' ? 'bg-[#00d69b]' : 'bg-red-400'} shadow-[0_0_8px_currentColor]`} />
                                {log.status}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 border border-white/5 w-fit">
                                <Hash size={10} className="text-white/20" />
                                <span className="text-[9px] text-white/30 font-mono font-bold">{log.hash}</span>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div 
                key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {USERS.map((user, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                    key={i} className="glass p-8 group hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center font-black text-xl text-white/20 group-hover:text-white transition-colors">
                          {user.name[0]}
                        </div>
                        <div>
                          <div className="text-xl font-black tracking-tighter">{user.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                             <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${user.role === 'admin' ? 'text-red-400 border-red-400/20 bg-red-400/5' : 'text-blue-400 border-blue-400/20 bg-blue-400/5'}`}>{user.role}</span>
                             <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">{user.lastActive} active</span>
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase ${user.status === 'active' ? 'text-[#00d69b]' : 'text-white/20'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-[#00d69b]' : 'bg-white/10'}`} />
                        {user.status}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-8">
                      {user.permissions.map(p => (
                        <span key={p} className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[8px] font-black uppercase tracking-widest text-white/30">{p}</span>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 py-3 rounded-xl glass border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Revoke Token</button>
                      <button className="flex-1 py-3 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest shadow-xl shadow-white/5 transition-all">Adjust RBAC</button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div 
                key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="glass p-10 flex flex-col justify-center gap-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Server size={180} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 mb-2">Primary Node Uptime</div>
                    <div className="text-6xl font-black tracking-tighter text-[#00d69b]">{SYSTEM_STATS.uptime}</div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '99.97%' }} transition={{ duration: 1.5 }} className="h-full bg-gradient-to-r from-[#00d69b] to-[#7075ff]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'Latency P95', value: SYSTEM_STATS.avgResponseTime, color: '#7075ff', icon: Wifi },
                    { label: 'Storage Node', value: '6%', color: '#ffb84d', icon: Database },
                    { label: 'API Heatmap', value: 'Optimal', color: '#00d69b', icon: Activity },
                    { label: 'Compliant', value: 'Verified', color: '#f87171', icon: Shield },
                  ].map((s, i) => (
                    <div key={i} className="glass p-6">
                      <s.icon size={16} style={{ color: s.color }} className="mb-4 opacity-50" />
                      <div className="text-xl font-black tracking-tight">{s.value}</div>
                      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Blockchain Chain View */}
                <div className="col-span-full glass p-10 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 flex items-center gap-3">
                      <Hash size={14} className="text-red-400" /> Transparent Blockchain Accountability Chain
                    </h3>
                    <div className="text-[9px] font-black uppercase text-red-400 animate-pulse">Live Ledger Update</div>
                  </div>
                  
                  <div className="flex items-center gap-6 overflow-x-auto pb-6 scrollbar-hide">
                    {MOCK_AUDIT_LOGS.slice(0, 5).map((log, i) => (
                      <div key={i} className="flex items-center gap-6 shrink-0">
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }}
                          className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 min-w-[220px] relative group/block hover:border-red-500/20 transition-all cursor-default"
                        >
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[9px] font-black text-red-400 italic">#{i}</div>
                          <div className="font-mono text-[11px] font-bold text-red-400 group-hover/block:text-white transition-colors mb-3">#{log.hash}</div>
                          <div className="text-[10px] font-bold text-white/60 mb-1">{log.action}</div>
                          <div className="text-[9px] text-white/20 font-black uppercase tracking-widest">{log.user}</div>
                        </motion.div>
                        {i < 4 && <ChevronRight size={20} className="text-white/10 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
