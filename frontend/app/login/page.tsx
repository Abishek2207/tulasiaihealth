'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Globe2
} from 'lucide-react';

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
    
    // Simulate premium login experience
    setTimeout(() => {
      if (email && password) {
        const demoUser = { id: '1', email, name: email.split('@')[0] || 'Doctor', role: 'doctor', isActive: true };
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('token', 'demo-token-' + Date.now());
        router.push('/dashboard');
      } else {
        setError('Enter your clinical credentials to continue');
        setLoading(false);
      }
    }, 1200);
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const demoUser = { id: 'demo-1', email: 'demo@tulsihealth.in', name: 'Dr. Abishek', role: 'Chief Medical Officer', isActive: true };
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('token', 'demo-token-' + Date.now());
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="bg-mesh min-h-screen text-white font-sans flex items-center justify-center p-6 relative overflow-hidden">
      <div className="noise" />
      <div className="bg-grid absolute inset-0 opacity-20 pointer-events-none" />
      
      {/* ── Glow Orbs ── */}
      <div className="glow-orb" style={{ top: '-10%', left: '-10%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(0,214,155,0.12) 0%, transparent 70%)' }} />
      <div className="glow-orb" style={{ bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(112,117,255,0.08) 0%, transparent 70%)' }} />

      <div className="w-full max-w-[440px] relative z-10 animate-fade-up">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d69b] to-[#00b383] flex items-center justify-center shadow-[0_12px_32px_-4px_rgba(0,214,155,0.4)] mx-auto mb-6 animate-float">
            <Activity className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">
            Tulsi<span className="text-[#00d69b]">Health</span>
          </h1>
          <p className="text-white/40 font-medium text-sm px-6 text-balance">
            India's First Dual-Coding Smart EMR bridging Traditional & Modern Medicine.
          </p>
        </div>

        {/* Login Card */}
        <div className="glass p-10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00d69b]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-1">Clinical Login</h2>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest">Workspace Personnel Only</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-bold animate-fade">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Email Registry</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#00d69b] transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="doctor@tulsihealth.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold outline-none focus:bg-white/10 focus:border-[#00d69b]/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Access Token</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#00d69b] transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-sm font-semibold outline-none focus:bg-white/10 focus:border-[#00d69b]/30 transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-[#00d69b] text-black font-black text-lg shadow-[0_20px_40px_-10px_rgba(0,214,155,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <>Sign In Profile <ArrowRight size={20} /></>}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-[10px] font-black text-white/10 uppercase tracking-widest leading-none">OR</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <button 
            onClick={handleDemoLogin}
            className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all flex items-center justify-center gap-3"
          >
            <Stethoscope size={18} className="text-[#00d69b]" /> 
            Enter with Preview Mode
          </button>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 opacity-30">
          <div className="flex items-center gap-8">
            <ShieldCheck size={20} />
            <Globe2 size={20} />
            <Database size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">
            Secured by TulsiHealth Neural Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple loader icon since lucide-react doesn't export Loader2 directly in some versions
function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      className={className} 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function Database({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      className={className} 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
