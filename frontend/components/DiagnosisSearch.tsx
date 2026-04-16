/**
 * DiagnosisSearch Component for TulsiHealth
 * High-fidelity AI-powered Diagnosis Selection Engine
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  X, 
  Info, 
  BookOpen, 
  Stethoscope,
  Sparkles,
  Command,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface DiagnosisResult {
  id: string;
  name: string;
  code: string;
  system: 'NAMASTE' | 'ICD-11';
  description?: string;
  icdCode?: string;
  confidence?: number;
  category?: string;
}

interface DiagnosisSearchProps {
  onDiagnosisSelect?: (diagnosis: DiagnosisResult) => void;
  placeholder?: string;
}

export default function DiagnosisSearch({
  onDiagnosisSelect,
  placeholder = "Search clinical terms (AYUSH + ICD-11)..."
}: DiagnosisSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiagnosisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<DiagnosisResult[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchDiagnoses = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/terminology/search?q=${encodeURIComponent(query)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setIsOpen(true);
        } else {
          // Development Fallback
          setResults([
            { id: '1', name: 'Jwara (Fever)', code: 'NAM001', system: 'NAMASTE', description: 'Dosha imbalance leading to thermal shift.', icdCode: '9A00.0', confidence: 0.98, category: 'Ayurveda' },
            { id: '2', name: 'Kasa (Cough)', code: 'NAM002', system: 'NAMASTE', description: 'Respiratory reflex modulation.', icdCode: 'CA00.1', confidence: 0.92, category: 'Ayurveda' },
            { id: '3', name: 'Shoola (Acute Pain)', code: 'NAM003', system: 'NAMASTE', description: 'Neural stimulus localization.', icdCode: 'MG30.0', confidence: 0.85, category: 'Ayurveda' },
          ]);
          setIsOpen(true);
        }
      } catch (e) {
        setResults([]);
      } finally {
        setTimeout(() => setIsLoading(false), 400);
      }
    };

    const t = setTimeout(searchDiagnoses, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (d: DiagnosisResult) => {
    if (onDiagnosisSelect) onDiagnosisSelect(d);
    if (!selectedDiagnoses.find(x => x.id === d.id)) {
      setSelectedDiagnoses([...selectedDiagnoses, d]);
    }
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="w-full space-y-6">
      <div ref={searchRef} className="relative">
        {/* Animated Search Bar */}
        <div className={`relative transition-all duration-500 rounded-[28px] overflow-hidden ${
          isOpen ? 'shadow-[0_0_64px_-12px_rgba(0,214,155,0.2)]' : ''
        }`}>
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search size={22} className={`transition-colors italic ${isOpen ? 'text-[#00d69b]' : 'text-white/20'}`} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-16 pr-24 py-6 bg-white/[0.03] border border-white/10 rounded-[28px] focus:outline-none focus:border-[#00d69b]/40 focus:bg-white/[0.05] transition-all text-white text-lg font-medium tracking-tight placeholder-white/10"
          />
          <div className="absolute inset-y-0 right-6 flex items-center gap-4">
             {isLoading && (
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                 <Sparkles size={20} className="text-[#00d69b]" />
               </motion.div>
             )}
             <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/20">
                <Command size={10} /> <span>SEARCH</span>
             </div>
          </div>
        </div>

        {/* Global Result Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="absolute z-50 w-full mt-4 glass border-white/10 rounded-[32px] overflow-hidden shadow-2xl bg-black/60 backdrop-blur-3xl"
            >
              <div className="noise opacity-[0.03] pointer-events-none" />
              <div className="p-4 space-y-2">
                {results.map((result, i) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelect(result)}
                    className="group flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                        result.system === 'NAMASTE' 
                          ? 'bg-[#00d69b]/5 border-[#00d69b]/20 text-[#00d69b]' 
                          : 'bg-[#7075ff]/5 border-[#7075ff]/20 text-[#7075ff]'
                      }`}>
                         <Stethoscope size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-[15px] font-black tracking-tight text-white">{result.name}</p>
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                             result.system === 'NAMASTE' ? 'text-[#00d69b] bg-[#00d69b]/10' : 'text-[#7075ff] bg-[#7075ff]/10'
                          }`}>{result.system}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-white/20 mt-1">
                          <span>{result.code}</span>
                          {result.icdCode && (
                            <div className="flex items-center gap-1.5 opacity-50">
                              <ArrowRight size={10} />
                              <span className="font-black uppercase">ICD-11: {result.icdCode}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                       {result.confidence && (
                         <div className="hidden sm:flex flex-col items-end">
                            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }}
                                 className={`h-full ${result.confidence > 0.9 ? 'bg-[#00d69b]' : 'bg-yellow-500'}`}
                               />
                            </div>
                            <span className="text-[10px] font-black text-white/10 uppercase tracking-widest mt-1">AI MATCH {Math.round(result.confidence * 100)}%</span>
                         </div>
                       )}
                       <ChevronRight size={18} className="text-white/10 group-hover:text-[#00d69b] transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                 <button className="flex items-center justify-center gap-3 w-full py-4 text-[11px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-all">
                    <BookOpen size={14} /> Full Lexicon Access
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Cluster */}
      <AnimatePresence>
        {selectedDiagnoses.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic flex items-center gap-3 pl-4">
               <ShieldCheck size={12} className="text-[#00d69b]" /> Registered Clinical Findings
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedDiagnoses.map((d) => (
                <motion.div 
                  key={d.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="glass p-5 rounded-[28px] border-white/10 flex items-center justify-between group/card hover:border-[#00d69b]/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover/card:bg-[#00d69b]/10 group-hover/card:text-[#00d69b] transition-all">
                        <Zap size={18} />
                     </div>
                     <div>
                       <p className="text-[13px] font-bold text-white tracking-tight">{d.name}</p>
                       <p className="text-[10px] font-medium text-white/20">{d.code} • {d.system}</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDiagnoses(selectedDiagnoses.filter(x => x.id !== d.id))}
                    className="p-2 rounded-xl text-white/10 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



