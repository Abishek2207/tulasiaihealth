'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Stethoscope, 
  BrainCircuit, 
  ShieldCheck, 
  ChevronRight,
  Database,
  Globe2,
  CheckCircle2,
  Zap,
  Lock,
  Search
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="bg-primary min-h-screen text-white font-sans relative overflow-x-hidden selection:bg-[#00d69b]/30">
      <div className="noise opacity-[0.03]" />
      <div className="bg-grid absolute inset-0 opacity-[0.05] pointer-events-none" />
      
      {/* ── Glow Orbs ── */}
      <div className="glow-orb" style={{ top: '-15%', left: '10%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(0,214,155,0.08) 0%, transparent 70%)' }} />
      <div className="glow-orb" style={{ bottom: '10%', right: '5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(112,117,255,0.05) 0%, transparent 70%)' }} />

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-[100] px-6 md:px-12 py-5 flex items-center justify-between backdrop-blur-md border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#00d69b] to-[#00b383] flex items-center justify-center shadow-lg">
            <Activity className="text-black" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Tulsi<span className="text-[#00d69b]">Health</span>
          </span>
        </motion.div>
        
        <div className="hidden md:flex items-center gap-10 text-[13px] font-medium text-white/50">
          {['Features', 'Standards', 'AI Engine'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors tracking-wide uppercase">{item}</a>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <button 
            onClick={() => router.push('/login')} 
            className="text-[13px] font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest"
          >
            Sign In
          </button>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="btn-primary"
          >
            Launch EMR
          </button>
        </motion.div>
      </nav>

      <main className="relative z-10">
        {/* ── Hero Section ── */}
        <section className="max-w-[1400px] mx-auto px-6 pt-32 pb-24 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.15em] uppercase text-[#00d69b] mb-12"
          >
            <Zap size={12} className="fill-[#00d69b]" />
            FHIR R4 • AYUSH • ICD-11 Native
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-7xl md:text-[9rem] font-black leading-[0.9] tracking-[-0.05em] mb-10 text-balance"
          >
            The New Standard in <br />
            <span className="gradient-text">Clinical Intelligence.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto text-xl md:text-2xl text-white/40 leading-relaxed font-medium mb-16 text-balance tracking-tight"
          >
            A premium operating system designed for the future of Indian healthcare. 
            Bridging centuries of wisdom with ultra-modern data standards.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <button 
              onClick={() => router.push('/dashboard')} 
              className="w-full sm:w-auto px-12 py-5 rounded-[20px] bg-[#00d69b] text-black font-black text-lg hover:scale-[1.03] active:scale-[0.97] transition-all shadow-2xl flex items-center justify-center gap-3"
            >
              Get Started <ChevronRight size={20} strokeWidth={3} />
            </button>
            <button 
              className="w-full sm:w-auto px-12 py-5 rounded-[20px] glass-bright text-white font-black text-lg hover:bg-white/10 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
            >
              Learn More
            </button>
          </motion.div>

          {/* ── Interactive Backdrop Visualization ── */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-32 relative mx-auto max-w-[1100px]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10" />
            <div className="glass aspect-[21/9] rounded-[40px] border-white/10 shadow-[0_0_100px_rgba(0,214,155,0.1)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-grid opacity-10" />
              <div className="text-white/10 font-black text-9xl tracking-tighter select-none">TULSI OS</div>
              {/* This space would normally hold a dashboard mockup */}
            </div>
          </motion.div>
        </section>

        {/* ── Feature Cards section ── */}
        <section id="features" className="max-w-[1300px] mx-auto px-6 py-32">
          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: BrainCircuit, title: 'AI Triage Engine', desc: 'Real-time NLP extraction of AYUSH symptoms with dual-coding translation.', color: 'text-[#00d69b]' },
              { icon: ShieldCheck, title: 'Blockchain Audit', desc: 'Every record is cryptographically signed and chained for absolute integrity.', color: 'text-indigo-400' },
              { icon: Globe2, title: 'FHIR R4 Native', desc: 'Globally interoperable clinical data exchange out of the box.', color: 'text-blue-400' }
            ].map((f, i) => (
              <motion.div 
                key={f.title}
                variants={fadeInUp}
                className="glass p-10 glass-hover"
              >
                <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                  <f.icon className={f.color} size={32} />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{f.title}</h3>
                <p className="text-white/40 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Status Section ── */}
        <section id="standards" className="max-w-[1300px] mx-auto px-6 py-32 mb-20">
          <motion.div 
             initial={{ opacity: 0, y: 40 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
             className="glass p-16 relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
               <Activity size={320} className="text-[#00d69b]" />
             </div>
             
             <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
               <div>
                 <h2 className="text-5xl font-black mb-8 leading-[1.1] tracking-tighter">
                   Uncompromising <br /><span className="text-[#00d69b]">Standards.</span>
                 </h2>
                 <div className="space-y-6">
                   {[
                     "ISO 22600 & HL7 Pass-through",
                     "E2EE For All Clinical Data",
                     "Real-time Identity Verification",
                     "PWA Performance Optimized"
                   ].map(item => (
                     <div key={item} className="flex items-center gap-4 text-lg font-bold text-white/70">
                       <div className="w-6 h-6 rounded-full bg-[#00d69b]/10 flex items-center justify-center">
                         <CheckCircle2 size={16} className="text-[#00d69b]" />
                       </div>
                       {item}
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                 {[
                   { label: 'Latency', value: '18ms' },
                   { label: 'Accuracy', value: '99.9%' },
                   { label: 'Uptime', value: '100%' },
                   { label: 'Security', value: 'AES-256' }
                 ].map(stat => (
                   <div key={stat.label} className="glass p-8 bg-white/[0.02] border-white/5">
                     <div className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-2">{stat.label}</div>
                     <div className="text-3xl font-black text-white">{stat.value}</div>
                   </div>
                 ))}
               </div>
             </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-20 px-6 relative z-10">
        <div className="max-w-[1300px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <Activity className="text-[#00d69b]" size={28} />
            </div>
            <span className="text-3xl font-black tracking-tighter">TulsiHealth</span>
          </div>
          
          <div className="text-white/20 text-sm font-medium">
            © 2024 TulsiHealth Clinical Operating Systems.
          </div>
          
          <div className="flex gap-10 text-white/40 font-bold text-xs uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Network</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
