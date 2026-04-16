/**
 * IndiaMap Component for TulsiHealth
 * High-fidelity India Healthcare Intelligence Map
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Activity, 
  Users, 
  Hospital, 
  TrendingUp, 
  Info,
  ChevronRight,
  Sparkles,
  Globe
} from 'lucide-react';

interface StateData {
  code: string;
  name: string;
  patients: number;
  facilities: number;
  doctors: number;
  growth: number;
  ayushFacilities: number;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'NE' | 'UT';
}

interface IndiaMapProps {
  onStateSelect?: (state: StateData) => void;
  showStats?: boolean;
}

const indiaStates: StateData[] = [
  { code: 'DL', name: 'Delhi', patients: 56700, facilities: 1420, doctors: 5200, growth: 11.9, ayushFacilities: 180, region: 'North' },
  { code: 'UP', name: 'Uttar Pradesh', patients: 145600, facilities: 3450, doctors: 8900, growth: 15.2, ayushFacilities: 860, region: 'Central' },
  { code: 'MH', name: 'Maharashtra', patients: 124500, facilities: 3120, doctors: 8900, growth: 14.6, ayushFacilities: 720, region: 'West' },
  { code: 'KA', name: 'Karnataka', patients: 89400, facilities: 2340, doctors: 6800, growth: 15.3, ayushFacilities: 580, region: 'South' },
  { code: 'TN', name: 'Tamil Nadu', patients: 98700, facilities: 2680, doctors: 7800, growth: 13.1, ayushFacilities: 640, region: 'South' },
  { code: 'KL', name: 'Kerala', patients: 72300, facilities: 1980, doctors: 6200, growth: 11.7, ayushFacilities: 680, region: 'South' },
  { code: 'GJ', name: 'Gujarat', patients: 67800, facilities: 1890, doctors: 5200, growth: 13.4, ayushFacilities: 420, region: 'West' },
  { code: 'WB', name: 'West Bengal', patients: 82300, facilities: 2120, doctors: 6400, growth: 12.4, ayushFacilities: 520, region: 'East' },
  { code: 'RJ', name: 'Rajasthan', patients: 62300, facilities: 1680, doctors: 4200, growth: 13.7, ayushFacilities: 380, region: 'North' },
  { code: 'MP', name: 'Madhya Pradesh', patients: 56700, facilities: 1340, doctors: 3200, growth: 12.9, ayushFacilities: 290, region: 'Central' },
  { code: 'TS', name: 'Telangana', patients: 51200, facilities: 1180, doctors: 3100, growth: 12.2, ayushFacilities: 280, region: 'South' },
  { code: 'AP', name: 'Andhra Pradesh', patients: 45230, facilities: 1240, doctors: 3400, growth: 12.5, ayushFacilities: 340, region: 'South' },
  { code: 'PB', name: 'Punjab', patients: 38900, facilities: 1120, doctors: 3400, growth: 10.8, ayushFacilities: 220, region: 'North' },
  { code: 'AS', name: 'Assam', patients: 28900, facilities: 890, doctors: 2100, growth: 10.2, ayushFacilities: 220, region: 'NE' },
  { code: 'BR', name: 'Bihar', patients: 78450, facilities: 1560, doctors: 3800, growth: 14.7, ayushFacilities: 480, region: 'East' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.3 }
  }
};

const item = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, damping: 15, stiffness: 200 } }
};

export default function IndiaMap({
  onStateSelect,
  showStats = true
}: IndiaMapProps) {
  const [selectedState, setSelectedState] = useState<StateData | null>(indiaStates[0]);
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);

  const formatNumber = (num: number) => {
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const totals = {
    patients: indiaStates.reduce((s, a) => s + a.patients, 0),
    facilities: indiaStates.reduce((s, a) => s + a.facilities, 0),
    ayush: indiaStates.reduce((s, a) => s + a.ayushFacilities, 0),
  };

  return (
    <div className="relative group/map">
      {/* Background Decor */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#00d69b]/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Stats Hub */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
           {[
             { label: 'Cloud Patient Index', value: formatNumber(totals.patients), icon: Users, color: 'text-[#00d69b]' },
             { label: 'Verified AYUSH Nodes', value: formatNumber(totals.ayush), icon: Hospital, color: 'text-[#7075ff]' },
             { label: 'Clinical Growth', value: '14.2%', icon: TrendingUp, color: 'text-emerald-400' },
           ].map((stat, i) => (
             <div key={i} className="glass p-6 border-white/5 rounded-3xl group/stat hover:border-white/10 transition-all">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} group-hover/stat:scale-110 transition-transform`}>
                      <stat.icon size={20} />
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-white tracking-tighter">{stat.value}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 border-t border-white/5 pt-12 relative z-10">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-8">
           <div className="space-y-2">
             <h3 className="text-xl font-black tracking-tighter text-white uppercase italic">Neural <span className="text-[#00d69b]">Map</span></h3>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10 italic leading-relaxed">Geospatial Intelligence Engine for TulsiHealth EMR.</p>
           </div>
           
           <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
             {indiaStates.map((state) => (
               <button 
                 key={state.code}
                 onClick={() => setSelectedState(state)}
                 onMouseEnter={() => setHoveredState(state)}
                 onMouseLeave={() => setHoveredState(null)}
                 className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                   selectedState?.code === state.code ? 'bg-[#00d69b]/10 text-white' : 'hover:bg-white/5 text-white/30'
                 }`}
               >
                 <div className="flex items-center gap-3 text-[11px] font-bold tracking-tight">
                    <span className="w-5 text-left text-[9px] font-black opacity-40">{state.code}</span>
                    <span className="truncate max-w-[120px]">{state.name}</span>
                 </div>
                 {selectedState?.code === state.code && <div className="w-1.5 h-1.5 rounded-full bg-[#00d69b]" />}
               </button>
             ))}
           </div>
        </div>

        {/* Interactive Neural Grid */}
        <div className="lg:col-span-3">
          <motion.div 
            variants={container} initial="hidden" animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
             {indiaStates.map((state) => (
               <motion.div 
                 key={state.code} variants={item}
                 onClick={() => setSelectedState(state)}
                 onMouseEnter={() => setHoveredState(state)}
                 onMouseLeave={() => setHoveredState(null)}
                 className={`relative h-28 rounded-3xl border cursor-pointer group/cell transition-all overflow-hidden ${
                   selectedState?.code === state.code 
                    ? 'border-[#00d69b]/40 bg-[#00d69b]/5 shadow-lg shadow-[#00d69b]/5 scale-105 z-10' 
                    : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                 }`}
               >
                 {/* Density Pulse */}
                 <AnimatePresence>
                   {state.patients > 80000 && (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                       className="absolute inset-0 bg-[#00d69b]/5 pointer-events-none"
                     >
                       <motion.div 
                         animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                         transition={{ duration: 4, repeat: Infinity, ease: 'linear' as const }}
                         className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00d69b] blur-[2px]"
                       />
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <span className={`text-[9px] font-black tracking-widest uppercase transition-colors ${
                      selectedState?.code === state.code ? 'text-[#00d69b]' : 'text-white/20'
                    }`}>{state.code}</span>
                    <div className="space-y-0.5">
                       <p className="text-[13px] font-black tracking-tighter text-white/90 truncate">{state.name}</p>
                       <p className={`text-[10px] font-bold ${selectedState?.code === state.code ? 'text-[#00d69b]/60' : 'text-white/10'}`}>
                         {formatNumber(state.patients)} idx
                       </p>
                    </div>
                 </div>
               </motion.div>
             ))}
          </motion.div>

          <AnimatePresence mode="wait">
             {selectedState && (
               <motion.div 
                 key={selectedState.code}
                 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                 className="mt-12 p-10 glass border-white/10 rounded-[40px] relative overflow-hidden flex flex-col md:flex-row items-center gap-12"
               >
                  <div className="absolute top-0 right-1/2 p-12 opacity-[0.03] pointer-events-none translate-x-1/2">
                    <Globe size={300} />
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-center">
                     <div className="w-40 h-40 rounded-full border border-[#00d69b]/20 bg-[#00d69b]/5 flex flex-col items-center justify-center p-8 text-center relative">
                        <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-[#00d69b] animate-spin duration-[4s]" />
                        <span className="text-4xl font-black text-white tracking-tighter leading-none mb-1">{selectedState.growth}%</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#00d69b]">Avg Growth</span>
                     </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-10 text-center md:text-left">
                     {[
                       { label: 'Patient Cluster', value: formatNumber(selectedState.patients), icon: Users },
                       { label: 'Verified Doctors', value: formatNumber(selectedState.doctors), icon: Activity },
                       { label: 'AYUSH Prime Centers', value: selectedState.ayushFacilities, icon: Hospital },
                     ].map((box, i) => (
                       <div key={i} className="space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 flex items-center justify-center md:justify-start gap-2">
                            <box.icon size={10} className="text-[#00d69b]" /> {box.label}
                          </p>
                          <p className="text-2xl font-black text-white tracking-tighter">{box.value}</p>
                       </div>
                     ))}
                  </div>

                  <div className="shrink-0 border-l border-white/5 pl-12 hidden md:block">
                     <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-[#7075ff]/10 text-[#7075ff] flex items-center justify-center"><ChevronRight size={14}/></div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#7075ff]">Top Protocol</span>
                        </div>
                        <p className="text-[11px] font-medium text-white/40 max-w-[120px] leading-relaxed">NAMASTE AYUSH Integration Active here.</p>
                     </div>
                  </div>
               </motion.div>
             )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-center gap-8 py-6 border-t border-white/5 opacity-20">
         {[
           { color: 'bg-white/10', label: 'Incubation' },
           { color: 'bg-blue-400', label: 'Emergent' },
           { color: 'bg-[#00d69b]', label: 'Scale-Ready' },
           { color: 'bg-[#7075ff]', label: 'Legacy Peak' },
         ].map((lx, i) => (
           <div key={i} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${lx.color}`} />
              <span className="text-[9px] font-black uppercase tracking-widest">{lx.label}</span>
           </div>
         ))}
      </div>
    </div>
  );
}



