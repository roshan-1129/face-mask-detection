
import React, { useEffect, useRef, useState } from 'react';
import { API_MODEL_NAME } from '../constants';
import { DetectionResult, DetectionStatus } from '../types';
import { Camera, Volume2, VolumeX, AlertTriangle, CheckCircle, Activity, Cpu, Zap, RefreshCw, Video, VideoOff, Power } from 'lucide-react';

interface LiveDetectionProps {
  stream: MediaStream | null;
  detectionStatus: DetectionStatus;
  lastResult: DetectionResult | null;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (val: boolean) => void;
  isCameraEnabled: boolean;
  setIsCameraEnabled: (val: boolean) => void;
  cameraPermission: boolean | null;
  isSimulationMode: boolean;
  forceSimulation: boolean;
  setForceSimulation: (val: boolean) => void;
}

const LiveDetection: React.FC<LiveDetectionProps> = ({
  stream,
  detectionStatus,
  lastResult,
  isAudioEnabled,
  setIsAudioEnabled,
  isCameraEnabled,
  setIsCameraEnabled,
  cameraPermission,
  lastResult: propLastResult
}) => {
  const displayVideoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(16/9); // Default to wide

  // Attach global stream to local video element
  useEffect(() => {
    const videoEl = displayVideoRef.current;
    if (videoEl && stream && isCameraEnabled) {
      videoEl.srcObject = stream;
      videoEl.onloadedmetadata = () => {
        setIsVideoReady(true);
        if (videoEl.videoWidth && videoEl.videoHeight) {
          setAspectRatio(videoEl.videoWidth / videoEl.videoHeight);
        }
        videoEl.play().catch(e => console.error("Playback error:", e));
      };
    } else {
      setIsVideoReady(false);
      if (videoEl) videoEl.srcObject = null;
    }
  }, [stream, isCameraEnabled]);

  // Draw Bounding Boxes on Canvas
  useEffect(() => {
    const video = displayVideoRef.current;
    const canvas = overlayCanvasRef.current;
    
    if (video && canvas && isCameraEnabled && propLastResult?.faces) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // CRITICAL: The canvas must act as an overlay that exactly matches the 
        // video's render coordinates.
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            // Set canvas internal resolution to match video source
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
            
            // Clear previous
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw faces
            propLastResult.faces.forEach(face => {
                const [x, y, w, h] = face.bbox;
                
                // Style based on mask
                const color = face.hasMask ? '#22c55e' : '#ef4444'; // Green or Red
                
                ctx.strokeStyle = color;
                ctx.lineWidth = 5;
                ctx.strokeRect(x, y, w, h);
                
                // Draw Label background
                ctx.fillStyle = color;
                ctx.fillRect(x, y - 30, w, 30);
                
                // Draw Label text
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.fillText(face.hasMask ? `MASK ${(face.score*100).toFixed(0)}%` : `NO MASK`, x + 6, y - 8);
            });
        }
    } else if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [propLastResult, stream, isVideoReady, isCameraEnabled]);

  const getStatusColor = () => {
    if (!isCameraEnabled) return 'border-gray-800';
    switch (detectionStatus) {
      case DetectionStatus.MASK_DETECTED: return 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]';
      case DetectionStatus.NO_MASK: return 'border-red-500 animate-pulse-red';
      case DetectionStatus.SCANNING: return 'border-blue-500/50';
      default: return 'border-gray-700';
    }
  };

  return (
    // Removed h-full and overflow-hidden to allow scrolling
    <div className="p-4 lg:p-8 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Camera className="text-blue-400" /> Live Surveillance
          </h1>
          <div className="flex items-center gap-3 text-sm">
             <p className="text-gray-400 flex items-center gap-2">
               <Cpu size={14} className="text-blue-400" /> {API_MODEL_NAME} • HSV Skin Analysis
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-gray-700">
             <div className={`w-2 h-2 rounded-full ${detectionStatus !== DetectionStatus.IDLE && isCameraEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
             <span className="text-sm text-gray-300 uppercase tracking-wider font-semibold min-w-[80px] text-center">
               {isCameraEnabled ? detectionStatus.replace('_', ' ') : 'CAMERA OFF'}
             </span>
          </div>
          
          <div className="h-8 w-px bg-gray-700 mx-2"></div>

          <button 
            onClick={() => setIsCameraEnabled(!isCameraEnabled)}
            className={`p-3 rounded-xl transition-colors border ${isCameraEnabled ? 'bg-gray-700 text-white hover:bg-gray-600 border-gray-600' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
            title={isCameraEnabled ? "Disable Camera" : "Enable Camera"}
          >
            {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button 
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-3 rounded-xl transition-colors border ${isAudioEnabled ? 'bg-gray-700 text-white hover:bg-gray-600 border-gray-600' : 'bg-red-500/10 text-red-400 border-red-500/50'}`}
            title={isAudioEnabled ? "Mute Audio Alerts (Global)" : "Enable Audio Alerts (Global)"}
          >
            {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </div>

      {/* 
        Layout:
        - Stacked on Mobile
        - 2 Columns on Desktop (Video | Stats)
        - Allowed to scroll vertically
       */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Main Video Column */}
        <div className="flex-1 flex flex-col items-center xl:items-start">
          {/* 
            Video Container
            max-w-2xl to keep it manageable size
          */}
          <div 
            className={`w-full max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl relative border-4 transition-all duration-300 ${getStatusColor()}`}
            style={{ aspectRatio: aspectRatio }}
          >
                
            {!isCameraEnabled ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-gray-600 bg-gray-900">
                  <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                      <VideoOff size={32} />
                  </div>
                  <p className="text-lg font-medium mb-4">Camera is disabled</p>
                  <button 
                      onClick={() => setIsCameraEnabled(true)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                      <Power size={18} /> Turn On
                  </button>
                </div>
            ) : (
                <>
                    {!stream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-gray-500">
                        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>Initializing Camera Stream...</p>
                        </div>
                    )}

                    {!cameraPermission && cameraPermission !== null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-gray-900/90 text-center p-6">
                        <AlertTriangle size={48} className="text-red-500 mb-4" />
                        <p className="text-xl text-white font-semibold">Camera Access Denied</p>
                        <p className="text-gray-400 mt-2">Please enable camera permissions in your browser settings to use this feature.</p>
                    </div>
                    )}
                </>
            )}
            
            {/* The Video Element */}
            <video 
              ref={displayVideoRef}
              autoPlay 
              playsInline
              muted
              className={`w-full h-full object-cover bg-black ${!isCameraEnabled ? 'hidden' : ''}`}
            />
            
            {/* Canvas Overlay for Bounding Boxes */}
            <canvas 
                ref={overlayCanvasRef}
                className={`absolute inset-0 w-full h-full object-contain pointer-events-none z-10 ${!isCameraEnabled ? 'hidden' : ''}`}
            />

            {/* Alert Banner */}
            {isCameraEnabled && detectionStatus === DetectionStatus.NO_MASK && (
              <div className="absolute top-0 left-0 right-0 bg-red-600/90 text-white py-3 px-4 flex items-center justify-center gap-2 animate-slide-down backdrop-blur-sm z-20">
                <AlertTriangle size={24} className="animate-bounce" />
                <span className="font-bold text-lg tracking-wide">WARNING: NO MASK DETECTED</span>
              </div>
            )}
            {isCameraEnabled && detectionStatus === DetectionStatus.MASK_DETECTED && (
              <div className="absolute top-0 left-0 right-0 bg-green-600/90 text-white py-2 px-4 flex items-center justify-center gap-2 backdrop-blur-sm z-20">
                <CheckCircle size={20} />
                <span className="font-bold tracking-wide">ACCESS GRANTED</span>
              </div>
            )}
          </div>
          
          {/* Under Video: Status Banner */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
             <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 text-center">
                <Zap size={20} className={`mx-auto mb-2 ${isCameraEnabled ? 'text-blue-400' : 'text-gray-600'}`} />
                <p className="text-xl font-bold text-white">{isCameraEnabled ? 'Live' : 'OFF'}</p>
                <p className="text-[10px] text-gray-500 uppercase">Feed Status</p>
             </div>
             <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 text-center">
                <RefreshCw size={20} className={`mx-auto mb-2 ${isCameraEnabled ? 'text-green-400' : 'text-gray-600'}`} />
                <p className="text-xl font-bold text-white">{isCameraEnabled ? '~15ms' : '-'}</p>
                <p className="text-[10px] text-gray-500 uppercase">Latency</p>
             </div>
             <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 text-center col-span-2 md:col-span-2 flex flex-col justify-center">
                 <p className="text-xs text-gray-400 mb-1">Detection Confidence</p>
                 <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1">
                     <div 
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(lastResult?.confidence || 0) * 100}%` }}
                     ></div>
                 </div>
                 <p className="text-right text-xs text-blue-400 font-mono">
                    {((lastResult?.confidence || 0) * 100).toFixed(1)}%
                 </p>
             </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="w-full xl:w-96 shrink-0 space-y-6">
          {/* Analysis Card */}
          <div className="glass-panel p-6 rounded-2xl sticky top-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              Live Analysis
            </h3>
            
            {lastResult && isCameraEnabled ? (
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400">Faces Detected</span>
                   <span className="text-white font-mono text-lg">{lastResult.faces?.length || 0}</span>
                 </div>
                 
                 <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {lastResult.faces?.length > 0 ? (
                        lastResult.faces.map((face, idx) => (
                            <div key={idx} className="bg-gray-800/50 p-3 rounded-lg text-sm border border-gray-700/30">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-400">Subject #{idx+1}</span>
                                    <span className={face.hasMask ? "text-green-400" : "text-red-400 font-bold"}>
                                        {face.hasMask ? "Safe" : "VIOLATION"}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                    <div 
                                        className={`h-1.5 rounded-full ${face.score > 0.9 ? 'bg-blue-500' : 'bg-yellow-500'}`} 
                                        style={{width: `${face.score * 100}%`}}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 italic text-center py-4">Waiting for subjects...</p>
                    )}
                 </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                {isCameraEnabled ? (
                   <>
                      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      Initializing TensorFlow...
                   </>
                ) : (
                    <>
                      <VideoOff className="mx-auto mb-2 opacity-50" />
                      System Paused
                    </>
                )}
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
                <h4 className="text-blue-400 text-xs font-bold uppercase mb-2">AI Diagnostics</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                   <strong>Model:</strong> BlazeFace (TF.js)<br/>
                   <strong>Method:</strong> Landmark + HSV Skin Analysis<br/>
                   <strong>Status:</strong> {lastResult ? 'Active Inference' : 'Standby'}
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDetection;
