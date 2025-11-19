
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import LiveDetection from './pages/LiveDetection';
import Violations from './pages/Violations';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { User, DetectionStatus, DetectionResult } from './types';
import { MOCK_USER, ALERT_MESSAGE } from './constants';
import { loadModel, detectFacesInVideo } from './services/aiService';
import { logViolation } from './services/mockBackend';

const App: React.FC = () => {
  // Initialize user from localStorage (Persistent) OR sessionStorage (Tab only)
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('sentinel_user') || sessionStorage.getItem('sentinel_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to load user from storage", e);
      return null;
    }
  });

  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Global Surveillance State ---
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>(DetectionStatus.IDLE);
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);
  
  // Configuration
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [forceSimulation, setForceSimulation] = useState(false); 
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Refs for background processing
  const analysisVideoRef = useRef<HTMLVideoElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  const handleLogin = (email: string, password: string, remember: boolean): boolean => {
    // Robust Credential Check
    if (email === MOCK_USER.email && password === 'roshan1129') {
      const loggedInUser = MOCK_USER as unknown as User;
      setUser(loggedInUser);
      
      if (remember) {
        // Persistent: survives browser close
        localStorage.setItem('sentinel_user', JSON.stringify(loggedInUser));
        localStorage.setItem('sentinel_remembered_email', email);
      } else {
        // Temporary: clears on browser close
        sessionStorage.setItem('sentinel_user', JSON.stringify(loggedInUser));
        localStorage.removeItem('sentinel_remembered_email'); // Clear saved email if they opt out
      }
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
    // Clear Session
    localStorage.removeItem('sentinel_user');
    sessionStorage.removeItem('sentinel_user');
    // NOTE: We do NOT clear 'sentinel_remembered_email' here. 
    // This allows the email to be pre-filled when they return to the login screen.

    setActivePage('dashboard');
    // Clean up stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  };

  // 1. Load AI Model on Mount
  useEffect(() => {
    loadModel();
  }, []);

  // 2. Initialize Camera on Login OR when Toggled
  useEffect(() => {
    if (!user) return;

    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Request HD resolution (1280x720) for better Aspect Ratio (16:9) and Quality
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          } 
        });
        
        currentStream = mediaStream;
        setStream(mediaStream);
        setCameraPermission(true);
        
        // Attach to hidden video element for analysis immediately
        if (analysisVideoRef.current) {
          analysisVideoRef.current.srcObject = mediaStream;
          analysisVideoRef.current.play().catch(e => console.error("Bg video play error", e));
        }
      } catch (err) {
        console.error("Camera error:", err);
        setCameraPermission(false);
      }
    };

    const stopCamera = () => {
       if (stream) {
           stream.getTracks().forEach(track => track.stop());
           setStream(null);
       }
       if (analysisVideoRef.current) {
           analysisVideoRef.current.srcObject = null;
       }
       setDetectionStatus(DetectionStatus.IDLE);
       setLastResult(null);
    };

    if (isCameraEnabled) {
        startCamera();
    } else {
        stopCamera();
    }

    return () => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isCameraEnabled]); 

  // 3. Background Analysis Loop
  useEffect(() => {
    if (!user || !stream || !isCameraEnabled) return;

    intervalRef.current = window.setInterval(runDetection, 100);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [user, stream, forceSimulation, isAudioEnabled, isCameraEnabled]);

  const runDetection = async () => {
    if (!analysisVideoRef.current || !analysisCanvasRef.current) return;
    
    const video = analysisVideoRef.current;
    if (video.readyState !== 4) return;

    const canvas = analysisCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }
    
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Run AI
    const result = await detectFacesInVideo(video, canvas);
    setLastResult(result);

    // Handle Status & Alerts
    if (result.faces.length > 0) {
        if (!result.hasMask) {
            setDetectionStatus(DetectionStatus.NO_MASK);
            // Trigger alert periodically
            if (Math.random() > 0.98) { 
                const snapshot = canvas.toDataURL('image/jpeg', 0.8);
                handleViolation(snapshot, result.confidence);
            }
        } else {
            setDetectionStatus(DetectionStatus.MASK_DETECTED);
        }
    } else {
        setDetectionStatus(DetectionStatus.SCANNING);
    }
  };

  const handleViolation = (image: string, confidence: number) => {
    if (isAudioEnabled && !window.speechSynthesis.speaking) {
      const utterance = new SpeechSynthesisUtterance(ALERT_MESSAGE);
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
    logViolation(image, confidence);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'live': 
        return (
          <LiveDetection 
            stream={stream}
            detectionStatus={detectionStatus}
            lastResult={lastResult}
            isAudioEnabled={isAudioEnabled}
            setIsAudioEnabled={setIsAudioEnabled}
            isCameraEnabled={isCameraEnabled}
            setIsCameraEnabled={setIsCameraEnabled}
            cameraPermission={cameraPermission}
            isSimulationMode={isSimulationMode}
            forceSimulation={forceSimulation}
            setForceSimulation={setForceSimulation}
          />
        );
      case 'violations': return <Violations />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
      {/* Hidden Elements for Analysis */}
      <video 
        ref={analysisVideoRef} 
        muted 
        playsInline 
        autoPlay
        className="absolute opacity-0 pointer-events-none w-[640px] h-[480px]" 
      />
      <canvas 
        ref={analysisCanvasRef} 
        className="absolute opacity-0 pointer-events-none" 
      />

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activePage={activePage} 
        onNavigate={(page) => {
          setActivePage(page);
          setIsSidebarOpen(false);
        }} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          user={user} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          detectionStatus={detectionStatus}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-gray-900 to-gray-800">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
