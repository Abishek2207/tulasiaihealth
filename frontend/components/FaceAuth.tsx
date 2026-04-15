/**
 * FaceAuth Component for TulsiHealth
 * Biometric face authentication system
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert,
  UserCheck,
  Scan,
  Activity
} from 'lucide-react';

interface FaceAuthProps {
  onAuthSuccess?: (faceData: string) => void;
  onAuthFailure?: (error: string) => void;
  onRegistration?: (faceData: string) => void;
  mode?: 'login' | 'register';
  userId?: string;
  showInstructions?: boolean;
}

const scannerVariants = {
  scanning: {
    rotate: [0, 360],
    scale: [0.95, 1.05, 0.95],
    transition: {
      rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
      scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
    }
  },
  detected: {
    scale: 1.1,
    borderColor: 'rgba(0, 214, 155, 0.8)',
    transition: { duration: 0.3 }
  },
  success: {
    scale: 1.2,
    opacity: 0,
    transition: { duration: 0.5 }
  }
};

export default function FaceAuth({
  onAuthSuccess,
  onAuthFailure,
  onRegistration,
  mode = 'login',
  userId,
  showInstructions = true
}: FaceAuthProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'detected' | 'processing' | 'success' | 'error'>('idle');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setStatus('scanning');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      startFaceDetection();
    } catch (err) {
      setError('Camera access denied');
      setStatus('error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startFaceDetection = () => {
    const interval = setInterval(() => {
      if (processingRef.current) return;
      const detected = Math.random() > 0.3; // Simulated logic
      setFaceDetected(detected);
      if (detected && status !== 'processing') setStatus('detected');
      else if (!detected && status !== 'processing') setStatus('scanning');
    }, 1000);
    return () => clearInterval(interval);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !faceDetected) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setPhoto(imageData);
      setIsProcessing(true);
      setStatus('processing');
      processFace(imageData);
    }
  }, [faceDetected]);

  const processFace = async (imgData: string) => {
    if (!userId) return;
    setIsLoading(true);
    processingRef.current = true;
    try {
      // Simulate API call for premium UX feel
      await new Promise(r => setTimeout(r, 2000));
      setStatus('success');
      if (mode === 'register') onRegistration?.(imgData);
      else onAuthSuccess?.(imgData);
      setTimeout(() => stopCamera(), 1500);
    } catch (e) {
      setError('Biometric mismatch');
      setStatus('error');
      onAuthFailure?.('Biometric mismatch');
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      processingRef.current = false;
    }
  };

  return (
    <div className="relative max-w-sm mx-auto overflow-hidden rounded-[40px] glass border-white/5 bg-black/40 backdrop-blur-3xl p-8 shadow-2xl">
      <div className="noise opacity-[0.03] pointer-events-none" />
      
      {/* Header */}
      <div className="text-center mb-10 relative z-10">
         <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-2xl ${status === 'success' ? 'bg-[#00d69b]/20 text-[#00d69b]' : 'bg-white/5 text-white/40'}`}>
               <ShieldCheck size={24} />
            </div>
         </div>
         <h3 className="text-xl font-black tracking-tighter text-white uppercase italic">
           {mode === 'register' ? 'Identity Enrollment' : 'Vault Access'}
         </h3>
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-1">Biometric Clinical Protocol</p>
      </div>

      {/* Camera Viewport */}
      <div className="relative aspect-square mb-10 group">
        <div className="absolute inset-0 rounded-full border border-white/5 bg-white/[0.02]" />
        
        {/* Scanner Ring */}
        <motion.div 
          variants={scannerVariants}
          animate={status === 'success' ? 'success' : (status === 'detected' ? 'detected' : 'scanning')}
          className={`absolute inset-[-10px] rounded-full border-2 transition-colors duration-500 ${
            status === 'success' ? 'border-[#00d69b]' : 
            status === 'error' ? 'border-red-500' : 
            status === 'detected' ? 'border-[#00d69b]/40' : 'border-white/10'
          }`}
        >
           {/* Pulsing Light Dots */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-md opacity-40" />
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-[#7075ff] rounded-full blur-md opacity-20" />
        </motion.div>

        {/* Video Feed */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-black shadow-inner">
           <AnimatePresence mode="wait">
             {!photo ? (
               <motion.video
                 key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 ref={videoRef} autoPlay playsInline muted
                 className="w-full h-full object-cover grayscale brightness-110"
               />
             ) : (
               <motion.img 
                 key="photo" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }}
                 src={photo} className="w-full h-full object-cover" 
               />
             )}
           </AnimatePresence>

           {/* Scan Overlay */}
           {status === 'scanning' && (
             <motion.div 
               animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
               className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d69b] to-transparent shadow-[0_0_15px_#00d69b] z-20 pointer-events-none"
             />
           )}
           
           {/* Face Grid Mask (Simulated) */}
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
        </div>

        {/* Status Indicators */}
        <AnimatePresence>
           {status === 'processing' && (
             <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full flex flex-col items-center justify-center z-30"
             >
                <RefreshCw className="text-[#00d69b] animate-spin mb-3" size={32} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00d69b]">Analyzing Geometry</span>
             </motion.div>
           )}
           {status === 'success' && (
             <motion.div 
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-[#00d69b]/10 backdrop-blur-md rounded-full flex flex-col items-center justify-center z-40 border-4 border-[#00d69b]"
             >
                <div className="w-20 h-20 rounded-full bg-[#00d69b] flex items-center justify-center shadow-2xl shadow-[#00d69b]/40">
                   <UserCheck className="text-black" size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white mt-4">Identity Confirmed</span>
             </motion.div>
           )}
        </AnimatePresence>
      </div>

      {/* Footer / Instructions */}
      <div className="text-center">
         <div className={`text-[11px] font-bold tracking-tight px-6 py-3 rounded-2xl transition-all duration-500 ${
           status === 'detected' ? 'bg-[#00d69b]/10 text-[#00d69b] border border-[#00d69b]/20' : 
           status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-white/40 border border-white/5'
         }`}>
           {status === 'scanning' && "Aligning Biometrics..."}
           {status === 'detected' && "Position Stable · Ready"}
           {status === 'processing' && "Secure Hash Commit..."}
           {status === 'error' && error}
         </div>
         
         <div className="mt-8">
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={capturePhoto}
              disabled={status !== 'detected' || isLoading}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                status === 'detected' ? 'bg-white text-black shadow-xl shadow-white/5' : 'bg-white/5 text-white/10 cursor-not-allowed'
              }`}
            >
              Initialize Capture
            </motion.button>
            
            {(status === 'error' || photo) && (
              <button onClick={() => { setPhoto(null); setStatus('scanning'); setError(null); }} className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                Retry Handshake
              </button>
            )}
         </div>
      </div>
      
      {/* Privacy Badge */}
      <div className="mt-10 flex items-center justify-center gap-4 opacity-10">
         <ShieldCheck size={12} />
         <span className="text-[8px] font-black uppercase tracking-[0.3em]">Neural Encryption Active</span>
         <Activity size={12} />
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
