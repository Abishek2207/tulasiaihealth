'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, Stethoscope, ScanLine, Users, BarChart3, Settings,
  LayoutDashboard, BrainCircuit, LogOut, Shield, Search,
  BookOpen, Loader2, AlertTriangle, CheckCircle2, Clock,
  Eye, Download, RefreshCw, Filter, User, Database,
  Lock, Unlock, Server, Wifi, Hash, ChevronRight
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

const MOCK_AUDIT_LOGS = [
  { id: 'EVT-001', timestamp: '2025-04-15T09:23:11Z', action: 'READ', resource: 'Patient', resourceId: 'TH-2024-001', user: 'Dr. Abishek', role: 'doctor', ip: '192.168.1.10', status: 'success', hash: 'a3f8c2d1' },
  { id: 'EVT-002', timestamp: '2025-04-15T09:18:44Z', action: 'CREATE', resource: 'Encounter', resourceId: 'ENC-0042', user: 'Dr. Kavitha', role: 'doctor', ip: '192.168.1.15', status: 'success', hash: 'b9e1f4a2' },
  { id: 'EVT-003', timestamp: '2025-04-15T09:12:03Z', action: 'WRITE', resource: 'Condition', resourceId: 'COND-0088', user: 'Dr. Abishek', role: 'doctor', ip: '192.168.1.10', status: 'success', hash: 'c2d4a8f1' },
  { id: 'EVT-004', timestamp: '2025-04-15T08:55:29Z', action: 'READ', resource: 'Patient', resourceId: 'TH-2024-002', user: 'Patient#002', role: 'patient', ip: '203.0.113.5', status: 'success', hash: 'd7b3e9c5' },
  { id: 'EVT-005', timestamp: '2025-04-15T08:44:01Z', action: 'DELETE', resource: 'AuditLog', resourceId: 'EVT-000', user: 'admin', role: 'admin', ip: '10.0.0.1', status: 'denied', hash: 'e1a5f8d3' },
  { id: 'EVT-006', timestamp: '2025-04-15T08:30:18Z', action: 'LOGIN', resource: 'Auth', resourceId: 'SESSION-099', user: 'Dr. Abishek', role: 'doctor', ip: '192.168.1.10', status: 'success', hash: 'f4c9b2e7' },
  { id: 'EVT-007', timestamp: '2025-04-15T08:15:55Z', action: 'EXPORT', resource: 'Report', resourceId: 'RPT-0012', user: 'Dr. Kavitha', role: 'doctor', ip: '192.168.1.15', status: 'success', hash: 'g6d1a3c8' },
  { id: 'EVT-008', timestamp: '2025-04-15T07:59:40Z', action: 'LOGIN', resource: 'Auth', resourceId: 'SESSION-098', user: 'Unknown', role: 'unknown', ip: '198.51.100.2', status: 'failed', hash: 'h2f7e4a9' },
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
  { name: 'Priya Subramaniam', role: 'patient', status: 'active', lastActive: '1 hr ago', permissions: ['read_own'] },
  { name: 'Admin User', role: 'admin', status: 'active', lastActive: '30 min ago', permissions: ['read', 'write', 'delete', 'manage_users'] },
  { name: 'Dr. Ramesh Venkat', role: 'doctor', status: 'inactive', lastActive: '2 days ago', permissions: ['read', 'write'] },
];

const ACTION_COLORS: Record<string, string> = {
  READ: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  CREATE: 'text-[#00d69b] bg-[#00d69b]/10 border-[#00d69b]/20',
  WRITE: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  DELETE: 'text-red-400 bg-red-400/10 border-red-400/20',
  LOGIN: 'text-[#7075ff] bg-[#7075ff]/10 border-[#7075ff]/20',
  EXPORT: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
};

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'system'>('audit');
  const [auditLogs, setAuditLogs] = useState(MOCK_AUDIT_LOGS);
  const [loading, setLoading] = useState(false);
  const [searchAudit, setSearchAudit] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    // Try fetch real audit logs
    fetch(`${API}/api/audit/logs?limit=50`, {
      headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.logs?.length) setAuditLogs(data.logs); })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    router.push('/login');
  };

  const filteredLogs = auditLogs
    .filter(l => actionFilter === 'all' || l.action === actionFilter)
    .filter(l => !searchAudit || l.user.toLowerCase().includes(searchAudit.toLowerCase()) || l.resource.toLowerCase().includes(searchAudit.toLowerCase()));

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
                <Icon size={18} />
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
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Shield className="text-red-400" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Admin Panel</h1>
                <p className="text-white/40 font-medium">ISO 22600 · RBAC · Blockchain Audit Chain</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-[#00d69b]/20">
              <div className="w-2 h-2 rounded-full bg-[#00d69b] animate-pulse" />
              <span className="text-xs font-black text-[#00d69b]">Security Score: {SYSTEM_STATS.securityScore}/100</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Patients', value: SYSTEM_STATS.totalPatients.toLocaleString(), icon: Users, color: 'text-[#00d69b]' },
              { label: "Today's Visits", value: SYSTEM_STATS.todayVisits.toString(), icon: Stethoscope, color: 'text-[#7075ff]' },
              { label: 'Active Users', value: SYSTEM_STATS.activeUsers.toString(), icon: User, color: 'text-amber-400' },
              { label: 'API Calls', value: SYSTEM_STATS.apiCalls, icon: Server, color: 'text-blue-400' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="glass p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{stat.label}</span>
                    <Icon size={16} className={stat.color} />
                  </div>
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 glass rounded-2xl mb-6 w-fit">
            {(['audit', 'users', 'system'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-[#00d69b] text-black' : 'text-white/40 hover:text-white'}`}>
                {tab === 'audit' ? 'Audit Logs' : tab === 'users' ? 'Access Control' : 'System Health'}
              </button>
            ))}
          </div>

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <div>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 glass border border-white/10 rounded-xl px-4 py-2.5 flex-1 max-w-sm">
                  <Search size={15} className="text-white/30" />
                  <input
                    value={searchAudit}
                    onChange={e => setSearchAudit(e.target.value)}
                    placeholder="Search logs..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/20"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'READ', 'CREATE', 'WRITE', 'DELETE', 'LOGIN'].map(f => (
                    <button key={f} onClick={() => setActionFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all border ${actionFilter === f ? 'bg-[#00d69b]/10 text-[#00d69b] border-[#00d69b]/30' : 'text-white/30 border-white/10 hover:text-white'}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <button className="ml-auto flex items-center gap-2 px-4 py-2 glass rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                  <Download size={14} /> Export
                </button>
              </div>

              {/* Logs Table */}
              <div className="glass overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Time', 'Action', 'Resource', 'User / Role', 'IP', 'Status', 'Block Hash'].map(h => (
                          <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log, i) => (
                        <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all">
                          <td className="px-6 py-4">
                            <div className="text-xs text-white/50 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</div>
                            <div className="text-[10px] text-white/20">{new Date(log.timestamp).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${ACTION_COLORS[log.action] || 'text-white/40 bg-white/5 border-white/10'}`}>{log.action}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold">{log.resource}</div>
                            <div className="text-[10px] text-white/30 font-mono">{log.resourceId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold">{log.user}</div>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${log.role === 'admin' ? 'bg-red-400/10 text-red-400' : log.role === 'doctor' ? 'bg-[#00d69b]/10 text-[#00d69b]' : 'bg-white/5 text-white/30'}`}>{log.role}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-white/30 font-mono">{log.ip}</td>
                          <td className="px-6 py-4">
                            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${log.status === 'success' ? 'text-[#00d69b]' : log.status === 'denied' ? 'text-amber-400' : 'text-red-400'}`}>
                              {log.status === 'success' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                              {log.status}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <Hash size={11} className="text-white/20" />
                              <span className="text-[10px] text-white/20 font-mono">{log.hash}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Access Control Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {USERS.map((user, i) => (
                <div key={i} className="glass p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{user.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : user.role === 'doctor' ? 'bg-[#00d69b]/10 text-[#00d69b] border border-[#00d69b]/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>{user.role}</span>
                        <span className="text-[10px] text-white/20">{user.lastActive}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {user.permissions.map(p => (
                      <span key={p} className="text-[9px] font-mono font-black px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/40 uppercase">{p}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${user.status === 'active' ? 'text-[#00d69b]' : 'text-white/30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-[#00d69b] animate-pulse' : 'bg-white/20'}`} />
                      {user.status}
                    </div>
                    <button className="px-3 py-1.5 rounded-xl glass border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* System Health Tab */}
          {activeTab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'System Uptime', value: SYSTEM_STATS.uptime, icon: Server, color: '#00d69b', desc: 'Last 30 days' },
                { label: 'Avg Response Time', value: SYSTEM_STATS.avgResponseTime, icon: Wifi, color: '#7075ff', desc: 'P95 latency' },
                { label: 'Storage Used', value: SYSTEM_STATS.storageUsed, icon: Database, color: '#ffb84d', desc: 'of 50 GB plan' },
                { label: 'Security Score', value: `${SYSTEM_STATS.securityScore}/100`, icon: Shield, color: '#00d69b', desc: 'ISO 22600 compliant' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="glass p-8 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                      <Icon size={24} style={{ color: stat.color }} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{stat.label}</div>
                      <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-xs text-white/30 mt-1">{stat.desc}</div>
                    </div>
                  </div>
                );
              })}

              {/* Blockchain Chain */}
              <div className="glass p-6 col-span-full">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-2">
                  <Hash size={13} className="text-[#7075ff]" /> Blockchain Audit Chain — Last 4 Blocks
                </h3>
                <div className="flex items-center gap-4 overflow-x-auto pb-2">
                  {MOCK_AUDIT_LOGS.slice(0, 4).map((log, i) => (
                    <div key={i} className="flex items-center gap-3 shrink-0">
                      <div className="p-4 rounded-2xl bg-[#7075ff]/5 border border-[#7075ff]/20 min-w-[160px]">
                        <div className="text-[9px] text-[#7075ff]/60 font-black uppercase tracking-widest mb-1">Block #{i + 1}</div>
                        <div className="font-mono text-xs font-bold text-[#7075ff]">#{log.hash}</div>
                        <div className="text-[10px] text-white/30 mt-1">{log.action} · {log.resource}</div>
                        <div className="text-[9px] text-white/20 mt-0.5">{log.user}</div>
                      </div>
                      {i < 3 && <ChevronRight size={16} className="text-white/10 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
