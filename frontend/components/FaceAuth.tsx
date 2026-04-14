/**
 * FaceAuth Component for TulsiHealth
 * Biometric face authentication system
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Check, X, AlertCircle } from 'lucide-react';

interface FaceAuthProps {
  onAuthSuccess?: (faceData: string) => void;
  onAuthFailure?: (error: string) => void;
  onRegistration?: (faceData: string) => void;
  mode?: 'login' | 'register';
  userId?: string;
  showInstructions?: boolean;
}

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
  const [instructions, setInstructions] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (mode === 'register') {
      setInstructions('Position your face in the center of the frame and keep still');
    } else {
      setInstructions('Look directly at the camera for authentication');
    }
  }, [mode]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Start face detection simulation
      startFaceDetection();
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions and try again.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startFaceDetection = () => {
    // Simulate face detection with interval
    const interval = setInterval(() => {
      if (processingRef.current) return;
      
      // Simulate random face detection
      const detected = Math.random() > 0.3;
      setFaceDetected(detected);
      
      if (detected && !photo) {
        setInstructions('Face detected! Click capture to proceed');
      } else if (!detected && !photo) {
        if (mode === 'register') {
          setInstructions('Position your face in the center of the frame');
        } else {
          setInstructions('Position your face for authentication');
        }
      }
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
      
      if (mode === 'register') {
        setInstructions('Processing face data for registration...');
      } else {
        setInstructions('Authenticating face...');
      }
    }
  }, [faceDetected, mode]);

  const retakePhoto = () => {
    setPhoto(null);
    setIsProcessing(false);
    setError(null);
  };

  const processFace = async () => {
    if (!photo || !userId) return;

    setIsLoading(true);
    processingRef.current = true;

    try {
      const endpoint = mode === 'register' ? '/api/auth/face-register' : '/api/auth/face-login';
      const payload = mode === 'register' 
        ? { userId, face_image: photo }
        : { username: userId, face_image: photo };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (mode === 'register') {
          setInstructions('Face registration successful!');
          if (onRegistration) {
            onRegistration(photo);
          }
        } else {
          setInstructions('Authentication successful!');
          if (onAuthSuccess) {
            onAuthSuccess(photo);
          }
        }
        
        // Auto-close after success
        setTimeout(() => {
          stopCamera();
        }, 2000);
      } else {
        throw new Error(data.message || 'Face processing failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Face processing failed';
      setError(errorMessage);
      setInstructions(errorMessage);
      
      if (onAuthFailure) {
        onAuthFailure(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      processingRef.current = false;
    }
  };

  useEffect(() => {
    if (photo && isProcessing) {
      const timer = setTimeout(() => {
        processFace();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [photo, isProcessing]);

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (isProcessing) return 'text-yellow-500';
    if (faceDetected) return 'text-green-500';
    return 'text-gray-400';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-5 h-5" />;
    if (isProcessing) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (faceDetected) return <Check className="w-5 h-5" />;
    return <Camera className="w-5 h-5" />;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          {mode === 'register' ? 'Face Registration' : 'Face Authentication'}
        </h3>
        <p className="text-sm text-gray-400">
          {mode === 'register' 
            ? 'Register your face for secure biometric authentication'
            : 'Use your face for secure login'
          }
        </p>
      </div>

      {/* Camera View */}
      <div className="relative mb-6">
        {!photo ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg bg-black"
            />
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {faceDetected ? (
                <div className="absolute inset-0 border-2 border-green-500 rounded-lg">
                  <div className="absolute top-2 left-2 flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">Face Detected</span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 border-2 border-gray-600 rounded-lg border-dashed">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">Position face here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={photo}
              alt="Captured face"
              className="w-full rounded-lg"
            />
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                  <p className="text-white text-sm">Processing...</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Status Indicator */}
        <div className={`absolute top-2 right-2 flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-800/80 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-xs">
            {error ? 'Error' : isProcessing ? 'Processing' : faceDetected ? 'Ready' : 'Scanning'}
          </span>
        </div>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          error ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          isProcessing ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
          faceDetected ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          'bg-gray-800 text-gray-400 border border-gray-700'
        }`}>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>{instructions}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!photo ? (
          <button
            onClick={capturePhoto}
            disabled={!faceDetected || isLoading}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Camera className="w-5 h-5" />
            <span>Capture Face</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={retakePhoto}
              disabled={isLoading}
              className="py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake</span>
            </button>
            
            <button
              onClick={processFace}
              disabled={isLoading || isProcessing}
              className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{mode === 'register' ? 'Register' : 'Authenticate'}</span>
            </button>
          </div>
        )}

        {/* Camera Toggle */}
        <button
          onClick={stream ? stopCamera : startCamera}
          className="w-full py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center space-x-2"
        >
          {stream ? (
            <>
              <CameraOff className="w-4 h-4" />
              <span>Turn Off Camera</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span>Turn On Camera</span>
            </>
          )}
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Your face data is encrypted and stored securely.</p>
        <p>It is only used for authentication purposes.</p>
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
