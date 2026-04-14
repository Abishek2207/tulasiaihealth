'use client';

import { useRouter } from 'next/navigation';
import { 
  Activity, 
  Stethoscope, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Globe2, 
  Lock,
  ChevronRight,
  Database,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="bg-mesh min-h-screen text-white font-sans relative overflow-x-hidden">
      <div className="noise" />
      <div className="bg-grid absolute inset-0 opacity-20 pointer-events-none" />
      
      {/* ── Glow Orbs ── */}
      <div className="glow-orb" style={{ top: '-10%', left: '15%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,214,155,0.15) 0%, transparent 70%)' }} />
      <div className="glow-orb" style={{ bottom: '5%', right: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(112,117,255,0.1) 0%, transparent 70%)' }} />

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-[100] glass border-b border-white/5 backdrop-blur-3xl px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d69b] to-[#00b383] flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,214,155,0.5)]">
            <Activity className="text-white" size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Tulsi<span className="text-[#00d69b]">Health</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#standards" className="hover:text-white transition-colors">Standards</a>
          <a href="#ai" className="hover:text-white transition-colors">AI Engine</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/login')} 
            className="text-sm font-semibold text-white/80 hover:text-white transition-colors px-4 py-2"
          >
            Sign In
          </button>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="btn-primary"
          >
            Launch EMR
          </button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* ── Hero Section ── */}
        <section className="max-w-[1200px] mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[xs] font-bold tracking-[0.05em] uppercase text-[#00d69b] mb-8 animate-fade-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d69b] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d69b]"></span>
            </span>
            India's First FHIR R4 AYUSH + ICD-11 EMR
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black leading-[1.02] tracking-[-0.04em] mb-8 animate-fade-up delay-100 text-balance">
            The Intelligence <br />
            Behind <span className="gradient-text">Bharat's Care</span>
          </h1>
          
          <p className="max-w-xl mx-auto text-lg md:text-xl text-white/50 leading-relaxed mb-12 animate-fade-up delay-200 text-balance">
            A premium clinical operating system bridging Traditional Medicine (NAMASTE) and Modern Standards (ICD-11). Integrated AI, blockchain audit, and FHIR interoperability.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-up delay-300">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-[#00d69b] text-black font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_-10px_rgba(0,214,155,0.4)] flex items-center justify-center gap-2"
            >
              Get Started Now <ChevronRight size={20} />
            </button>
            <button 
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-lg flex items-center justify-center gap-2"
            >
              See Documentation
            </button>
          </div>

          <div className="mt-20 flex items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all animate-fade duration-1000">
            {/* Mocking major healthcare logos */}
            <div className="flex items-center gap-2 font-bold text-lg"><Activity size={24} /> NATIONAL HEALTH</div>
            <div className="flex items-center gap-2 font-bold text-lg"><ShieldCheck size={24} /> ABHA ECOSYSTEM</div>
            <div className="flex items-center gap-2 font-bold text-lg"><Globe2 size={24} /> WHO ICD-API</div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section id="features" className="max-w-[1240px] mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass p-8 glass-hover">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <BrainCircuit className="text-emerald-400" size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI Clinical Triage</h3>
              <p className="text-white/50 leading-relaxed">
                Advanced NLP models extract symptoms from free-text notes and map them directly to NAMASTE AYUSH codes.
              </p>
            </div>

            <div className="glass p-8 glass-hover lg:translate-y-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <Database className="text-blue-400" size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Dual Coding Mapping</h3>
              <p className="text-white/50 leading-relaxed">
                Seamless real-time translation between Traditional (Ayurveda, Siddha, Unani) and Modern ICD-11 classifications.
              </p>
            </div>

            <div className="glass p-8 glass-hover">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                <Globe2 className="text-indigo-400" size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">FHIR R4 Native</h3>
              <p className="text-white/50 leading-relaxed">
                Every clinical record is stored and transmitted as a compliant FHIR Bundle, ensuring global healthcare interoperability.
              </p>
            </div>
          </div>
        </section>

        {/* ── Status Billboard ── */}
        <section id="standards" className="max-w-[1200px] mx-auto px-6 py-20 mb-20">
          <div className="glass p-12 border-emerald-500/20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldCheck size={260} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2">
                <h2 className="text-4xl font-black mb-6 leading-tight">Securing Patient <br />Data with Integrity</h2>
                <div className="space-y-4">
                  {[
                    "Blockchain-verified Audit Trails",
                    "ISO 22600 & HL7 Pass-through",
                    "E2EE for Clinical Communications",
                    "Real-time Identity Verification"
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3 font-semibold text-white/80">
                      <CheckCircle2 size={18} className="text-[#00d69b]" /> {item}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:w-1/2 grid grid-cols-2 gap-4">
                <div className="glass p-6 text-center">
                  <div className="text-3xl font-black text-[#00d69b] mb-1">99.9%</div>
                  <div className="text-xs uppercase tracking-widest text-white/40">Uptime</div>
                </div>
                <div className="glass p-6 text-center">
                  <div className="text-3xl font-black text-blue-400 mb-1">100k+</div>
                  <div className="text-xs uppercase tracking-widest text-white/40">Codes Mapped</div>
                </div>
                <div className="glass p-6 text-center">
                  <div className="text-3xl font-black text-indigo-400 mb-1">20ms</div>
                  <div className="text-xs uppercase tracking-widest text-white/40">Latency</div>
                </div>
                <div className="glass p-6 text-center">
                  <div className="text-3xl font-black text-amber-400 mb-1">R4</div>
                  <div className="text-xs uppercase tracking-widest text-white/40">FHIR Engine</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 px-6 relative z-10">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 grayscale opacity-70">
            <Activity className="text-[#00d69b]" size={28} />
            <span className="text-2xl font-black">TulsiHealth</span>
          </div>
          
          <div className="text-white/40 text-sm">
            © 2024 TulsiHealth Platforms. All rights reserved.
          </div>
          
          <div className="flex gap-6 text-white/50">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
