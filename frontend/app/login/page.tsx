'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Globe2,
  Database
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" as "easeOut" }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    setTimeout(() => {
      if (email && password) {
        const demoUser = { id: '1', email, name: email.split('@')[0] || 'Doctor', role: 'doctor', isActive: true };
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('token', 'demo-token-' + Date.now());
        router.push('/dashboard');
      } else {
        setError('Verification failed. Invalid clinical credentials.');
        setLoading(false);
      }
    }, 1500);
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const demoUser = { id: 'demo-1', email: 'demo@tulsihealth.in', name: 'Dr. Abishek', role: 'Chief Medical Officer', isActive: true };
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('token', 'demo-token-' + Date.now());
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="bg-primary min-h-screen text-white font-sans flex items-center justify-center p-6 relative overflow-hidden selection:bg-[#00d69b]/30">
      <div className="noise opacity-[0.03]" />
      <div className="bg-grid absolute inset-0 opacity-[0.05] pointer-events-none" />
      
      {/* ── Glow Orbs ── */}
      <div className="glow-orb" style={{ top: '-10%', left: '-10%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(0,214,155,0.1) 0%, transparent 70%)' }} />
      <div className="glow-orb" style={{ bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(112,117,255,0.06) 0%, transparent 70%)' }} />

      <motion.div 
        initial="initial"
        animate="animate"
        variants={stagger}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Logo Section */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <motion.div 
             animate={{ y: [0, -10, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="w-16 h-16 rounded-[24px] bg-gradient-to-b from-[#00d69b] to-[#00b383] flex items-center justify-center shadow-2xl mx-auto mb-8"
          >
            <Activity className="text-black" size={32} />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter mb-3">
            Tulsi<span className="text-[#00d69b]">Health</span>
          </h1>
          <p className="text-white/30 font-bold text-xs uppercase tracking-[0.2em] px-10">
            Intelligent Clinical Operating System
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div variants={fadeInUp} className="glass p-12 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00d69b]/30 to-transparent" />
          
          <div className="mb-10">
            <h2 className="text-2xl font-black mb-1">Authorization</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d69b] animate-pulse" />
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Secure Node 04-IN</p>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 rounded-xl bg-red-400/5 border border-red-400/10 text-red-400 text-xs font-black uppercase tracking-tighter"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 ml-1">Email Registry</label>
              <div className="relative group/input">
                <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${email ? 'text-[#00d69b]' : 'text-white/20'}`} size={18} />
                <input
                  type="email"
                  placeholder="doctor@tulsihealth.ai"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-[20px] pl-14 pr-6 py-4.5 text-sm font-bold outline-none focus:bg-white/10 focus:border-[#00d69b]/40 transition-all placeholder:text-white/10"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 ml-1">Access Token</label>
              <div className="relative group/input">
                <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${password ? 'text-[#00d69b]' : 'text-white/20'}`} size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-[20px] pl-14 pr-14 py-4.5 text-sm font-bold outline-none focus:bg-white/10 focus:border-[#00d69b]/40 transition-all placeholder:text-white/10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button 
              type="submit" 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-5 rounded-[20px] bg-[#00d69b] text-black font-black text-[13px] uppercase tracking-widest shadow-2xl hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Sign In Profile <ArrowRight size={18} strokeWidth={3} /></>}
            </motion.button>
          </form>

          <div className="flex items-center gap-6 my-10">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">Identity Hub</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <motion.button 
            onClick={handleDemoLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 rounded-[20px] bg-white/5 border border-white/5 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-4"
          >
            <Stethoscope size={18} className="text-[#00d69b]" /> 
            Enter with Preview
          </motion.button>
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-16 flex flex-col items-center gap-8 opacity-20">
          <div className="flex items-center gap-12">
            <ShieldCheck size={20} />
            <Globe2 size={20} />
            <Database size={20} />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-center">
            Neural Protected Infrastructure
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}



