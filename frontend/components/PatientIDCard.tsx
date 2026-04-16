/**
 * PatientIDCard Component for TulsiHealth
 * Displays patient information with ABHA integration
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Shield, 
  QrCode,
  Download,
  Share2,
  AlertCircle,
  Activity,
  ChevronRight,
  Heart,
  RefreshCw
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  abhaId?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  allergies?: string[];
  conditions?: string[];
  lastVisit?: string;
}

interface PatientIDCardProps {
  patient: Patient;
  showQR?: boolean;
  compact?: boolean;
  showActions?: boolean;
}

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const }
};

export default function PatientIDCard({
  patient,
  showQR = true,
  compact = false,
  showActions = true
}: PatientIDCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (showQR && patient.id) {
      generateQRCode();
    }
  }, [patient.id, showQR]);

  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/patient/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.qrCode);
      } else {
        // Fallback or handle error
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  if (compact) {
    return (
      <motion.div 
        whileHover={{ x: 5 }}
        className="glass group flex items-center gap-5 p-4 rounded-2xl border-white/5 hover:border-[#00d69b]/20 transition-all cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl bg-[#00d69b]/10 flex items-center justify-center border border-[#00d69b]/20 shadow-lg shadow-[#00d69b]/5">
          <User className="w-6 h-6 text-[#00d69b]" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white tracking-tight truncate">{patient.name}</h3>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00d69b] bg-[#00d69b]/10 px-1.5 py-0.5 rounded">ID: {patient.id.slice(-6)}</span>
            <span className="text-[10px] text-white/20 font-bold">{calculateAge(patient.dateOfBirth)}Y · {patient.gender?.[0] || 'N/A'}</span>
          </div>
        </div>
        
        {showQR && (
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
             {qrCodeUrl ? <img src={qrCodeUrl} alt="QR" className="w-full h-full" /> : <QrCode className="w-5 h-5 text-black/20" />}
          </div>
        )}
        <ChevronRight size={16} className="text-white/10 group-hover:text-[#00d69b] transition-colors" />
      </motion.div>
    );
  }

  return (
    <motion.div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateY(${mousePosition.x * 10}deg) rotateX(${-mousePosition.y * 10}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
      className="relative w-full max-w-lg"
    >
      {/* Glow Effect */}
      <div 
        className="absolute -inset-1 bg-gradient-to-r from-[#00d69b]/20 to-[#7075ff]/20 rounded-[32px] blur-2xl opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`
        }}
      />
      
      <div className="relative glass rounded-[32px] overflow-hidden border-white/10 shadow-2xl backdrop-blur-3xl bg-black/40">
        <div className="noise opacity-[0.03] pointer-events-none" />
        
        {/* Holographic Sweep */}
        <motion.div 
          animate={{ x: ['100%', '-100%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-12 pointer-events-none"
        />

        {/* Card Header */}
        <div className="bg-gradient-to-r from-[#00d69b] to-[#00b383] px-10 py-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Activity size={160} />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-3xl flex items-center justify-center border border-white/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-black/60 text-[9px] font-black uppercase tracking-[0.2em] block mb-0.5">National EMR Registry</span>
                <span className="text-white font-black text-xl tracking-tighter">TulsiHealth <span className="text-black/40 font-bold">Verified</span></span>
              </div>
            </div>
            {patient.abhaId && (
              <div className="bg-black/20 backdrop-blur-3xl border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">ABHA ACTIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Patient Core */}
        <div className="p-10 relative">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            {/* Avatar Stage */}
            <div className="relative shrink-0">
               <div className="w-32 h-40 rounded-[28px] bg-white/[0.03] border-2 border-white/10 flex items-center justify-center relative overflow-hidden group/avatar">
                 <User size={64} className="text-white/5 group-hover/avatar:scale-110 transition-transform duration-500" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                 <div className="absolute bottom-4 left-0 right-0 text-center text-[9px] font-black uppercase tracking-widest text-[#00d69b]">Digital ID</div>
               </div>
            </div>

            {/* Content Stage */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl font-black tracking-tighter mb-4 text-white leading-none">{patient.name}</h2>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/10 mb-2">Patient Index</div>
                  <div className="font-mono text-[13px] font-black text-[#00d69b] tracking-tight">{patient.id}</div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/10 mb-2">ABHA Address</div>
                  <div className="font-mono text-[13px] font-black text-[#7075ff] tracking-tight lowercase">{patient.abhaId || 'not_linked'}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[11px] font-bold text-white/30">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-[#00d69b]" />
                  <span>{patient.dateOfBirth} <span className="text-white/10 italic">({calculateAge(patient.dateOfBirth)}Y)</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-red-400" />
                  <span className="uppercase text-red-100">{patient.bloodGroup || 'UNK'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={13} />
                  <span className="uppercase">{patient.gender || 'Other'}</span>
                </div>
              </div>
            </div>

            {/* QR Stage */}
            {showQR && (
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-32 h-32 glass border-white/10 rounded-3xl p-3 shadow-2xl relative group/qr">
                   {isLoading ? (
                     <div className="w-full h-full flex items-center justify-center">
                       <RefreshCw className="animate-spin text-[#00d69b]" size={24} />
                     </div>
                   ) : qrCodeUrl ? (
                     <motion.img 
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      src={qrCodeUrl} alt="QR Code" className="w-full h-full mix-blend-screen opacity-80 brightness-125" 
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-white/5">
                       <QrCode size={40} />
                     </div>
                   )}
                   <div className="absolute inset-0 border-2 border-[#00d69b]/20 rounded-3xl pointer-events-none group-hover:border-[#00d69b]/40 transition-colors" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10 mt-3">Scan to Intake</span>
              </div>
            )}
          </div>

          {/* Contact Strip */}
          <div className="mt-12 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <div className="flex items-center gap-4 text-white/30 group/link">
                   <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover/link:text-white transition-colors"><Phone size={14} /></div>
                   <span className="text-xs font-bold">{patient.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-4 text-white/30 group/link">
                   <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover/link:text-white transition-colors"><Mail size={14} /></div>
                   <span className="text-xs font-bold truncate">{patient.email || 'N/A'}</span>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex items-center gap-4 text-white/30 group/link">
                   <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover/link:text-white transition-colors"><MapPin size={14} /></div>
                   <span className="text-[11px] font-bold leading-tight">{patient.address || 'Location Hidden'}</span>
                </div>
             </div>
          </div>

          {/* Action Row */}
          {showActions && (
            <div className="mt-10 flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest shadow-xl shadow-white/5 flex items-center justify-center gap-3"
              >
                <Download size={16} /> Save to Wallet
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-16 h-14 rounded-2xl glass border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all"
              >
                <Share2 size={18} />
              </motion.button>
            </div>
          )}
        </div>

        {/* Card Footer Strip */}
        <div className="px-10 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-white/10 tracking-widest">
                <Heart size={10} className="text-red-500/40" /> AYUSH Prime
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-white/10 tracking-widest">
                <Shield size={10} className="text-[#00d69b]/40" /> ISO 27001
              </div>
           </div>
           <div className="text-[9px] font-mono text-white/5 uppercase font-black">Ref: {patient.lastVisit || 'NEW'}</div>
        </div>
      </div>
    </motion.div>
  );
}
