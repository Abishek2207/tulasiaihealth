'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Activity, Stethoscope, ScanLine, Users, BarChart3, Settings,
  LayoutDashboard, BrainCircuit, LogOut, User, Lock, 
  Bell, Palette, Globe, Shield, CreditCard, ChevronRight,
  Camera, Eye, EyeOff, Check, RefreshCw, Key, Monitor,
  Moon, Sun
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Stethoscope, label: 'Smart EMR', href: '/dashboard/emr' },
  { icon: ScanLine, label: 'Scan Patient QR', href: '/dashboard/qr-scan' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const }
};

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'appearance' | 'security'>('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden">
      <div className="noise opacity-[0.02]" />

      <motion.aside 
        initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" as const }}
        className="w-[280px] min-h-screen border-r border-white/5 backdrop-blur-3xl flex flex-col p-8 sticky top-0"
      >
        <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer group" onClick={() => router.push('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#00d69b] to-[#00b383] flex items-center justify-center shadow-lg">
            <Activity className="text-black" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Tulsi<span className="text-[#00d69b]">Health</span></span>
        </div>
        <nav className="flex-1 space-y-1.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-white/5 text-[#00d69b]' : 'text-white/40 hover:text-white'}`}>
                <Icon size={18} className={isActive ? 'text-[#00d69b]' : 'group-hover:text-white transition-colors'} />
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
        <div className="max-w-[1000px] mx-auto">
          {/* Header */}
          <motion.div {...fadeInUp} className="mb-16">
            <h1 className="text-4xl font-black tracking-tighter mb-2">Preferences</h1>
            <p className="text-white/20 text-xs font-black uppercase tracking-[0.2em]">Clinical Environment · Identity · Global Connectivity</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Settings Sidebar */}
            <div className="lg:col-span-1 border-r border-white/5 pr-8">
              <div className="space-y-2 sticky top-0">
                {[
                  { id: 'profile', label: 'My Identity', icon: User },
                  { id: 'api', label: 'Intelligence Keys', icon: Key },
                  { id: 'appearance', label: 'Visual Interface', icon: Palette },
                  { id: 'security', label: 'Guard Systems', icon: Shield },
                ].map(tab => (
                  <button 
                    key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === tab.id ? 'bg-white/5 text-white' : 'text-white/30 hover:text-white/50'}`}
                  >
                    <tab.icon size={16} />
                    <span className="text-[13px] font-bold tracking-tight">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 mb-6">Credential Presentation</h3>
                      <div className="flex items-center gap-8 mb-10">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-[32px] bg-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden">
                            <User size={32} className="text-white/10" />
                          </div>
                          <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[#00d69b] text-black flex items-center justify-center shadow-lg border-4 border-primary group-hover:scale-110 transition-transform">
                            <Camera size={16} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xl font-bold tracking-tight text-white/90">Dr. Abishek Kumar</h4>
                          <p className="text-sm text-[#00d69b] font-medium italic">General Practitioner · ID #789210</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/10 ml-1">Legal Full Name</label>
                          <input type="text" defaultValue="Abishek Kumar" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold tracking-tight focus:border-[#00d69b]/40 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/10 ml-1">Practice Location</label>
                          <input type="text" defaultValue="Chennai, India" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold tracking-tight focus:border-[#00d69b]/40 outline-none transition-all" />
                        </div>
                      </div>
                    </section>

                    <section className="pt-10 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm mb-1">Public Profile Availability</h4>
                          <p className="text-xs text-white/20">Allow pharmacy partners and triage AI to see your credentials.</p>
                        </div>
                        <div className="w-12 h-6 rounded-full bg-[#00d69b] relative p-1 cursor-pointer">
                          <div className="w-4 h-4 rounded-full bg-black ml-auto" />
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === 'api' && (
                  <motion.div key="api" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 mb-6">Bridging Credentials</h3>
                      <div className="space-y-6">
                        <div className="glass p-8 border-white/5 group">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                              <Globe size={16} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest">WHO ICD-11 Platform Key</span>
                          </div>
                          <div className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-2xl p-2 pl-6">
                            <code className="flex-1 font-mono text-xs text-white/40 truncate italic">
                              {showApiKey ? 'WHO_CLIENT_SECRET_X782_PRML_QW09' : '••••••••••••••••••••••••••••••••'}
                            </code>
                            <button onClick={() => setShowApiKey(!showApiKey)} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/40">
                              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button className="px-6 py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest">Rotate</button>
                          </div>
                          <p className="text-[10px] text-white/10 mt-4 font-bold italic leading-relaxed">Integrated for Real-time Dual Coding & TM2 Concept Mapping verification.</p>
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === 'appearance' && (
                  <motion.div key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 mb-6">Interface Dynamics</h3>
                      <div className="grid grid-cols-3 gap-4">
                         {[
                           { id: 'dark', label: 'Eclipse', icon: Moon, color: 'bg-black' },
                           { id: 'light', label: 'Radiance', icon: Sun, color: 'bg-white' },
                           { id: 'system', label: 'Automatic', icon: Monitor, color: 'bg-white/10' },
                         ].map(mode => (
                           <button 
                             key={mode.id} onClick={() => setTheme(mode.id as any)}
                             className={`flex flex-col items-center gap-4 p-8 rounded-[32px] border transition-all ${theme === mode.id ? 'bg-white/[0.03] border-[#00d69b]/40 shadow-xl shadow-[#00d69b]/5' : 'glass border-white/5 hover:border-white/20'}`}
                           >
                              <div className={`w-12 h-12 rounded-2xl ${mode.color} flex items-center justify-center shadow-lg border border-white/10`}>
                                <mode.icon size={20} className={mode.id === 'light' ? 'text-black' : 'text-white'} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                              {theme === mode.id && <Check size={14} className="text-[#00d69b]" />}
                           </button>
                         ))}
                      </div>
                    </section>

                    <section className="pt-10 border-t border-white/5">
                       <div className="flex items-center justify-between p-8 glass rounded-3xl border-white/5">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-[#00d69b]/10 flex items-center justify-center text-[#00d69b]">
                             <RefreshCw size={18} />
                           </div>
                           <div>
                             <h4 className="font-bold text-sm">Reduced Motion</h4>
                             <p className="text-xs text-white/20">Simplify framer-motion interactions for latency reduction.</p>
                           </div>
                         </div>
                         <div className="w-12 h-6 rounded-full bg-white/5 relative p-1 cursor-pointer">
                           <div className="w-4 h-4 rounded-full bg-white/20" />
                         </div>
                       </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <section className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 mb-6">Encryption & Guarding</h3>
                      {[
                        { label: 'Blockchain Audit Signing', desc: 'Secure every EMR entry with a private hash commit.', active: true },
                        { label: 'OIDC Session Renewal', desc: 'Automatic re-authentication for identity providers.', active: false },
                        { label: 'Clinical Biometrics', desc: 'Use Face Recognition for login and prescription signing.', active: true },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-8 glass rounded-3xl border-white/5 hover:border-white/10 transition-all">
                          <div>
                            <h4 className="font-bold text-sm mb-1">{item.label}</h4>
                            <p className="text-xs text-white/30 max-w-xs">{item.desc}</p>
                          </div>
                          <div className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors ${item.active ? 'bg-[#00d69b]' : 'bg-white/5'}`}>
                             <div className={`w-4 h-4 rounded-full bg-black transition-all ${item.active ? 'ml-auto' : 'ml-0'}`} />
                          </div>
                        </div>
                      ))}
                    </section>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
