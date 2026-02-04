
import React, { useRef, useEffect, useState } from 'react';

interface CameraScannerProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      setError(null);
      try {
        // Attempt 1: Prefer rear camera with high resolution
        try {
            const constraints = {
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
            };
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (preferredError) {
            console.warn("Preferred camera settings failed, falling back to default.", preferredError);
            
            // Attempt 2: Fallback to any available video device
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (fallbackError) {
                // If this fails, it's a real permission or hardware issue
                throw fallbackError;
            }
        }
        
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error("Camera Error:", err);
        setError("Unable to access camera. Please check permissions or try a different device.");
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get Base64 string (remove data:image/jpeg;base64, prefix later)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Video Feed */}
      {error ? (
        <div className="text-white text-center p-6 max-w-sm">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-red-400 mb-6 font-medium">{error}</p>
          <button 
            onClick={onClose} 
            className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full transition-colors border border-white/10"
          >
            Close Scanner
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Graphics - HUD */}
          <div className="absolute inset-0 pointer-events-none">
            
            {/* Darker borders for focus */}
            <div className="absolute inset-0 border-[40px] border-black/50 mask-image"></div>
            
            {/* Scanning Laser Animation */}
            <div className="absolute left-0 right-0 h-1 bg-gold-500/80 shadow-[0_0_15px_rgba(212,175,55,0.8)] animate-[scan_2.5s_ease-in-out_infinite] z-10"></div>
            
            {/* Corner Brackets - Positioned to define the viewfinder */}
            <div className="absolute top-20 left-8 w-16 h-16 border-t-4 border-l-4 border-gold-500 rounded-tl-xl"></div>
            <div className="absolute top-20 right-8 w-16 h-16 border-t-4 border-r-4 border-gold-500 rounded-tr-xl"></div>
            <div className="absolute bottom-48 left-8 w-16 h-16 border-b-4 border-l-4 border-gold-500 rounded-bl-xl"></div>
            <div className="absolute bottom-48 right-8 w-16 h-16 border-b-4 border-r-4 border-gold-500 rounded-br-xl"></div>

            {/* Tech UI Elements */}
            <div className="absolute top-24 left-0 right-0 text-center">
                 <div className="inline-block bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-gold-500/30">
                     <span className="text-gold-500 text-xs font-mono font-bold tracking-widest animate-pulse">AI VISION ACTIVE</span>
                 </div>
            </div>

            <div className="absolute bottom-56 left-0 right-0 text-center px-10">
                <p className="text-white/80 text-sm font-medium shadow-black drop-shadow-md">
                    Align Coin, Bar, or Invoice within frame
                </p>
            </div>
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 opacity-10" 
                style={{ 
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                }}>
            </div>
          </div>

          {/* Controls - Raised higher to avoid system gestures */}
          <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-center gap-12 pb-16 z-20 pointer-events-auto">
             
             <button onClick={onClose} className="text-white/70 hover:text-white flex flex-col items-center p-4 active:scale-95 transition-transform">
                 <span className="text-xs font-bold tracking-widest mt-1">CANCEL</span>
             </button>

             {/* Shutter Button */}
             <button 
                onClick={handleCapture}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 active:bg-gold-500/50 transition-all hover:scale-105 shadow-lg shadow-black/50"
             >
                 <div className="w-16 h-16 bg-white rounded-full pointer-events-none"></div>
             </button>
             
             <div className="w-16 p-4"></div> {/* Spacer for balance */}
          </div>
        </div>
      )}

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scan {
            0% { top: 15%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 75%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CameraScanner;
