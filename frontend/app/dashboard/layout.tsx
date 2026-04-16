'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  LayoutDashboard, 
  Stethoscope, 
  ScanLine, 
  Users, 
  BarChart3,
  Settings, 
  Activity, 
  Shield,
  MessageSquare,
  LogOut,
  BrainCircuit,
  BookOpen
} from 'lucide-react';

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      const defaultUser = { name: 'Dr. Abishek', role: 'Chief Medical Officer' };
      setUser(defaultUser);
      localStorage.setItem('user', JSON.stringify(defaultUser));
    } else {
      setUser(JSON.parse(u));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-sans flex relative overflow-hidden selection:bg-[#00A3FF]/30">
      <div className="noise opacity-[0.03] pointer-events-none fixed inset-0 z-0" />
      
      {/* ── Apple-Glass Sidebar ── */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 40 }}
        className="w-[280px] min-h-screen border-r border-white/5 bg-white/[0.01] backdrop-blur-3xl flex flex-col p-8 sticky top-0 z-50 shrink-0"
      >
        <div 
          className="flex items-center gap-4 mb-16 px-2 cursor-pointer group" 
          onClick={() => router.push('/')}
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00A3FF] to-[#00D69B] flex items-center justify-center shadow-[0_4px_24px_rgba(0,214,155,0.25)]"
          >
            <Activity className="text-white" size={20} strokeWidth={2.5} />
          </motion.div>
          <span className="text-[22px] font-semibold tracking-tight text-white/90">
            Tulsi<span className="text-[#00D69B] font-bold">OS</span>
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.03]'}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#00D69B]' : 'transition-colors'} />
                <span className={`text-[14px] tracking-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute right-3 w-1.5 h-1.5 bg-[#00D69B] rounded-full shadow-[0_0_12px_#00D69B]" 
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 mb-4 flex items-center gap-4 cursor-default">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00A3FF]/20 to-[#00D69B]/20 flex items-center justify-center border border-white/10">
               <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">{user.name}</span>
              <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest">{user.role}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-white/40 hover:bg-white/[0.03] hover:text-white transition-all font-semibold text-[13px]">
            <LogOut size={18} /> Sign Out Session
          </button>
        </div>
      </motion.aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto scrollbar-hide z-10 relative">
        {children}
      </div>
    </div>
  );
}



