'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
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
  Search,
  ScanLine,
  Fingerprint
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: "easeOut" as const }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1, transition: { staggerChildren: 0.1 } },
  viewport: { once: true, margin: "-100px" }
};

export default function LandingPage() {
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Marquee items
  const STANDARDS = [
    "FHIR R4 COMPLIANT", "ISO 22600 SECURITY", "ABHA HEALTH ID", 
    "WHO ICD-11 NATIVE", "AYUSH NAMASTE", "AES-256 E2EE", "HIPAA ALIGNED"
  ];

  return (
    <div ref={containerRef} className="bg-[#030303] min-h-screen text-white font-sans relative overflow-x-hidden selection:bg-[#00d69b]/30">
      {/* ── Global Interactive Lighting ── */}
      <motion.div 
        className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-screen transition-opacity duration-300"
        animate={{
          background: `radial-gradient(1000px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 214, 155, 0.05), transparent 40%)`
        }}
      />
      <div className="noise opacity-[0.04] pointer-events-none fixed inset-0 z-[1]" />
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-[100] px-6 md:px-12 py-6 flex items-center justify-between mix-blend-difference">
        <motion.div 
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-10 h-10 rounded-[14px] bg-white text-black flex items-center justify-center">
            <Activity size={20} strokeWidth={3} />
          </div>
          <span className="text-xl font-black tracking-tighter">TulsiOS</span>
        </motion.div>
        
        <div className="hidden md:flex items-center gap-12 text-[11px] font-black tracking-widest text-white/50 uppercase">
          {['Platform', 'Standards', 'Neuro-Core'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">{item}</a>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-6">
          <button onClick={() => router.push('/login')} className="text-[11px] font-black text-white/50 hover:text-white transition-colors uppercase tracking-widest">
            Authenticate
          </button>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
            Execute Sequence
          </button>
        </motion.div>
      </nav>

      {/* ── Cinematic Hero ── */}
      <section className="relative min-h-[95vh] flex flex-col justify-center px-6 md:px-12 z-10 pt-20">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-[1400px] mx-auto w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-8 flex flex-col items-start text-left">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.2, ease: "easeOut" as const }}
                className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md mb-12 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
              >
                <div className="w-2 h-2 rounded-full bg-[#00d69b] animate-pulse" />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/60">System v2.0 Operational</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" as const }}
                className="text-[12vw] sm:text-[9vw] lg:text-[7.5rem] font-black leading-[0.85] tracking-[-0.04em] text-white"
              >
                Intelligence <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d69b] to-white/50 italic font-serif tracking-tight pr-4">Synthesized.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" as const }}
                className="max-w-2xl text-xl md:text-2xl text-white/40 leading-[1.6] font-medium mt-12 mb-16 tracking-tight"
              >
                An uncompromising electronic medical record engineered for high-velocity clinical environments. Bridging AYUSH mechanics with global FHIR interoperability.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }}
                className="flex items-center gap-6"
              >
                <button onClick={() => router.push('/dashboard')} className="group relative px-10 py-5 rounded-[24px] bg-[#00d69b] text-black font-black text-sm uppercase tracking-[0.2em] overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <span className="relative flex items-center gap-3">
                    Initialize Core <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </motion.div>
            </div>

            {/* Simulated 3D Element Space */}
            <div className="lg:col-span-4 hidden lg:block relative h-[600px]">
              <motion.div 
                animate={{ 
                  rotateY: [0, 360],
                  rotateX: [10, -10, 10]
                }} 
                transition={{ duration: 20, repeat: Infinity, ease: "linear" as const }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full aspect-square border-[1px] border-white/5 rounded-full flex items-center justify-center"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="w-3/4 h-3/4 border-[1px] border-[#00d69b]/20 rounded-full border-dashed animate-[spin_30s_linear_reverse_infinite]" />
                <div className="absolute w-1/2 h-1/2 bg-gradient-to-br from-[#00d69b]/20 to-transparent rounded-full blur-3xl opacity-50" />
                <div className="absolute bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4" style={{ transform: 'translateZ(50px)' }}>
                  <Activity className="text-[#00d69b]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#00d69b]">Neural Link</span>
                    <span className="text-white text-xs font-bold">Stable Connectivity</span>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </motion.div>
      </section>

      {/* ── Marquee ── */}
      <div className="w-full py-8 border-y border-white/5 bg-white/[0.01] overflow-hidden whitespace-nowrap flex z-10 relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030303] to-transparent z-20" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030303] to-transparent z-20" />
        
        <motion.div 
          animate={{ x: [0, -1920] }} 
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' as const }}
          className="flex items-center gap-16 pr-16"
        >
          {[...STANDARDS, ...STANDARDS, ...STANDARDS].map((std, i) => (
            <div key={i} className="flex items-center gap-4 text-white/30 hover:text-white/80 transition-colors">
              <div className="w-1.5 h-1.5 bg-[#00d69b] rounded-full" />
              <span className="text-[13px] font-black tracking-[0.2em]">{std}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Asymmetrical Bento Grid ── */}
      <section className="max-w-[1400px] mx-auto px-6 py-40 z-10 relative">
        <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView" className="mb-20">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">Extreme Fidelity <br/><span className="text-white/30 font-serif italic tracking-tight">Clinical Infrastructure.</span></h2>
          <p className="text-xl text-white/40 font-medium max-w-xl tracking-tight">Engineered for absolute performance. Every sub-system operates with zero-latency precision.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-[280px]">
          
          {/* Card 1: Large Feature */}
          <motion.div 
            variants={fadeInUp} initial="initial" whileInView="whileInView" 
            className="md:col-span-6 lg:col-span-8 row-span-2 glass bg-white/[0.02] border border-white/5 rounded-[40px] p-12 flex flex-col justify-between group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-12 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl pointer-events-none">
              <div className="w-64 h-64 bg-[#7075ff]/20 rounded-full" />
            </div>
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-8">
                <BrainCircuit className="text-[#7075ff]" size={28} />
              </div>
              <h3 className="text-4xl font-black tracking-tighter mb-4 text-white">Diagnostic RAG Architecture</h3>
              <p className="text-lg text-white/40 font-medium max-w-md">Real-time symptom extraction across AYUSH terminologies, verified against a 500+ document vector neural network.</p>
            </div>
            
            {/* Animated Chat Snippet */}
            <div className="mt-8 relative h-40">
              <div className="absolute bottom-0 right-0 w-full md:w-[80%] glass p-6 rounded-[32px] rounded-br-none border-white/10 bg-black/50 shadow-2xl translate-y-8 group-hover:-translate-y-4 transition-transform duration-700">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#00d69b]/20 flex shrink-0 items-center justify-center text-[#00d69b]"><Bot size={16}/></div>
                  <div>
                    <div className="h-2 w-24 bg-white/10 rounded mb-3" />
                    <div className="h-2 w-full bg-white/5 rounded mb-2" />
                    <div className="h-2 w-3/4 bg-white/5 rounded" />
                    <div className="mt-4 flex gap-2">
                       <span className="px-3 py-1 bg-[#7075ff]/10 text-[#7075ff] rounded-full text-[8px] uppercase tracking-widest font-black">ICD-11 Matched</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Medium Top Right */}
          <motion.div 
            variants={fadeInUp} initial="initial" whileInView="whileInView" 
            className="md:col-span-3 lg:col-span-4 row-span-1 glass bg-white/[0.02] border border-white/5 rounded-[40px] p-8 flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#00d69b]/0 to-[#00d69b]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#00d69b]/10 flex items-center justify-center border border-[#00d69b]/20 text-[#00d69b]">
                <ShieldCheck size={24} />
              </div>
              <span className="text-[10px] font-black text-[#00d69b] uppercase tracking-[0.2em] bg-[#00d69b]/10 px-3 py-1 rounded-full">ISO 22600</span>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Cryptographic Vault</h3>
              <p className="text-sm text-white/40 font-medium">Immutable SHA-256 hash chains for absolute legal auditability and trust.</p>
            </div>
          </motion.div>

          {/* Card 3: Medium Bottom Right */}
          <motion.div 
            variants={fadeInUp} initial="initial" whileInView="whileInView" 
            className="md:col-span-3 lg:col-span-4 row-span-1 glass bg-white/[0.02] border border-white/5 rounded-[40px] p-8 flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="flex justify-between items-start z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-white group-hover:bg-white group-hover:text-black transition-colors duration-500">
                <ScanLine size={24} />
              </div>
            </div>
            {/* Ambient scanning laser */}
            <motion.div 
              animate={{ y: ['-100%', '300%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' as const }}
              className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_red] z-0 opacity-0 group-hover:opacity-50"
            />
            <div className="z-10 bg-black/40 p-4 -m-4 mt-0 rounded-[28px] backdrop-blur-md border border-white/5">
              <h3 className="text-2xl font-black tracking-tight mb-2">Biometric Entry</h3>
              <p className="text-[11px] text-white/40 font-black uppercase tracking-widest">Facial Signature Extracted.</p>
            </div>
          </motion.div>

          {/* Card 4: Long Wide Bottom */}
          <motion.div 
            variants={fadeInUp} initial="initial" whileInView="whileInView" 
            className="md:col-span-6 lg:col-span-12 row-span-1 glass bg-white/[0.02] border border-white/5 rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-12 group overflow-hidden relative"
          >
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
                <Globe2 size={12} /> Global Standard
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-3">FHIR R4 Interoperability</h3>
              <p className="text-white/40 font-medium">Export and import entire clinical bundles using the HL7 international standard. Full seamless integration with external healthcare ecosystems.</p>
            </div>
            <div className="w-full md:w-[400px] h-full bg-black/50 border border-white/5 rounded-[24px] p-6 relative overflow-hidden flex items-center justify-center text-white/10 group-hover:text-white/30 transition-colors">
               <div className="font-mono text-xs text-left w-full pointer-events-none opacity-50 relative z-10">
                 <span className="text-blue-400">"resourceType"</span>: <span className="text-[#00d69b]">"Patient"</span>,<br/>
                 <span className="text-blue-400">"identifier"</span>: {"[ {"} <br/>
                 &nbsp;&nbsp;<span className="text-blue-400">"system"</span>: <span className="text-[#00d69b]">"https://ndhm.gov.in"</span>,<br/>
                 &nbsp;&nbsp;<span className="text-blue-400">"value"</span>: <span className="text-white/80">"ABHA-XXXX"</span><br/>
                 {"} ]"}
               </div>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black pointer-events-none" />
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── Footer / Contact Plate ── */}
      <footer className="border-t border-white/5 bg-[#030303] py-32 px-6 relative z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-gradient-to-b from-[#00d69b]/5 to-transparent blur-3xl rounded-[100%]" />
        
        <div className="max-w-[1400px] mx-auto text-center relative z-10">
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-10">Ready to Sequence?</h2>
          <button onClick={() => router.push('/dashboard')} className="px-14 py-6 rounded-full bg-white text-black font-black text-sm uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            Deploy Clinical OS
          </button>
          
          <div className="mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <Activity className="text-[#00d69b]" size={24} />
              <span className="text-2xl font-black tracking-tighter">TulsiOS</span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
              © 2026 SmartAI Studio. All Protocols Active.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Inline Bot Icon to prevent missing lucide import crash
const Bot = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
)
