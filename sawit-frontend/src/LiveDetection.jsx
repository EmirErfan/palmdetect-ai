import { Settings, RefreshCcw, Download, Image as ImageIcon, X, ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { API_URL } from './config';

export default function LiveDetection() {
  // App States
  const [viewMode, setViewMode] = useState('live'); // 'live' or 'result'
  const [threshold, setThreshold] = useState(40);
  const [detections, setDetections] = useState([]);
  
  // Live Camera States
  const [isScanning, setIsScanning] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [showFlash, setShowFlash] = useState(false);
  
  // Result States
  const [staticImageSrc, setStaticImageSrc] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const resultImgRef = useRef(null);

  // ==========================================
  // 1. CAMERA SYSTEM
  // ==========================================
  useEffect(() => {
    async function startCamera() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: cameraFacing,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
    // We start the camera immediately and keep it running in the background 
    // even when looking at results, so returning is instant!
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraFacing]);

  // ==========================================
  // 2. LIVE SCANNING LOOP
  // ==========================================
  useEffect(() => {
    let interval;
    if (isScanning && viewMode === 'live') {
      interval = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append('file', blob, 'frame.jpg');
            try {
              const response = await fetch(`${API_URL}/predict`, {
                method: 'POST',
                headers: { "Bypass-Tunnel-Reminder": "true" },
                body: formData,
              });
              const data = await response.json();
              setDetections(data.detections || []);
            } catch (error) {
              console.error("AI Error:", error);
            }
          }, 'image/jpeg', 0.4);
        }
      }, 1000);
    } else if (viewMode === 'live') {
      setDetections([]); // Clear boxes when live scan is paused
    }
    return () => clearInterval(interval);
  }, [isScanning, viewMode]);

  // ==========================================
  // 3. ACTION: TAKE PICTURE
  // ==========================================
  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    // Stop live scanning if it was running
    setIsScanning(false);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image URL to show on screen instantly
    const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
    setStaticImageSrc(imageUrl);
    setViewMode('result');
    setIsAnalyzing(true);
    setDetections([]);

    // Send to AI
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'capture.jpg');
      await sendToAI(formData);
    }, 'image/jpeg', 0.8);
  };

  // ==========================================
  // 4. ACTION: UPLOAD FROM GALLERY
  // ==========================================
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsScanning(false);
    const imageUrl = URL.createObjectURL(file);
    setStaticImageSrc(imageUrl);
    setViewMode('result');
    setIsAnalyzing(true);
    setDetections([]);

    const formData = new FormData();
    formData.append('file', file);
    await sendToAI(formData);
  };

  const sendToAI = async (formData) => {
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { "Bypass-Tunnel-Reminder": "true" },
        body: formData,
      });
      const data = await response.json();
      setDetections(data.detections || []);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ==========================================
  // 5. ACTION: SAVE TO GALLERY (Result Mode Only)
  // ==========================================
  const saveToGallery = () => {
    if (!resultImgRef.current) return;
    
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    const img = resultImgRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const validDetections = detections.filter(d => d.confidence >= threshold);
    validDetections.forEach(det => {
      const [x_min, y_min, x_max, y_max] = det.bbox;
      const isHarvest = det.class.toLowerCase().includes('harvest') && !det.class.toLowerCase().includes('not');
      const color = isHarvest ? '#4ADE80' : '#FBBF24';
      const textColor = isHarvest ? '#052e16' : '#451a03';

      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.strokeRect(x_min, y_min, x_max - x_min, y_max - y_min);

      ctx.fillStyle = color;
      const label = `${det.class.toUpperCase()} · ${det.confidence}%`;
      ctx.font = 'bold 32px Arial';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x_min - 3, y_min - 46, textWidth + 20, 46);

      ctx.fillStyle = textColor;
      ctx.fillText(label, x_min + 7, y_min - 12);
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `PalmDetect-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper variables for Stats
  const harvestCount = detections.filter(d => d.confidence >= threshold && d.class.toLowerCase().includes('harvest') && !d.class.toLowerCase().includes('not')).length;
  const notHarvestCount = detections.filter(d => d.confidence >= threshold && d.class.toLowerCase().includes('not')).length;

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{ background: '#0A0F0C' }}>

      {/* Hidden File Input */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* Flash overlay */}
      {showFlash && (
        <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 100, opacity: 0.9, transition: 'opacity 0.2s ease', pointerEvents: 'none' }} />
      )}

      {/* ========================================================================= */}
      {/* SCREEN 1: LIVE CAMERA VIEW                                                */}
      {/* ========================================================================= */}
      <div style={{ position: 'absolute', inset: 0, opacity: viewMode === 'live' ? 1 : 0, pointerEvents: viewMode === 'live' ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
        
        {/* Camera Feed */}
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvasRef} className="hidden" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.40) 100%)', pointerEvents: 'none' }} />

        {/* Live Bounding Boxes */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          {detections.filter(d => d.confidence >= threshold).map((det, index) => {
            if (!videoRef.current) return null;
            const { videoWidth, videoHeight } = videoRef.current;
            if (!videoWidth) return null;
            const [x_min, y_min, x_max, y_max] = det.bbox;
            const left = (x_min / videoWidth) * 100;
            const top = (y_min / videoHeight) * 100;
            const width = ((x_max - x_min) / videoWidth) * 100;
            const height = ((y_max - y_min) / videoHeight) * 100;
            const isHarvest = det.class.toLowerCase().includes('harvest') && !det.class.toLowerCase().includes('not');
            const color = isHarvest ? '#4ADE80' : '#FBBF24';
            return (
              <div key={index} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, border: `1.5px solid ${color}`, borderRadius: '6px', background: isHarvest ? 'rgba(74, 222, 128, 0.08)' : 'rgba(251, 191, 36, 0.08)', boxShadow: `0 0 12px ${color}30` }}>
                <div style={{ position: 'absolute', top: -24, left: -1, background: color, borderRadius: '4px 4px 4px 0', padding: '2px 7px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: isHarvest ? '#052e16' : '#451a03', letterSpacing: '0.3px' }}>{det.class.toUpperCase()} · {det.confidence}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Bar - Live */}
        <div style={{ position: 'absolute', top: 0, width: '100%', zIndex: 20, padding: '48px 16px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div style={{ width: 38, height: 38, background: 'white', borderRadius: '10px', padding: '2px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.display = 'none'; }} />
              </div>
              <div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', fontWeight: 400, color: 'white', lineHeight: 1.1, letterSpacing: '-0.3px' }}>Live Camera</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: isScanning ? '#4ADE80' : '#ef4444', boxShadow: isScanning ? '0 0 8px #4ADE80' : 'none', animation: isScanning ? 'pulse 2s ease infinite' : 'none' }} />
                  <span style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.3px' }}>
                    {isScanning ? 'Auto-Scanning Active' : 'Scanner Paused'}
                  </span>
                </div>
              </div>
            </div>
            <button style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '9px' }}>
              <Settings size={18} color="white" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Bottom Controls - Live */}
        <div style={{ position: 'absolute', bottom: 0, width: '100%', zIndex: 20, padding: '0 0 32px 0', background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}>
          
          {/* Action Row */}
          <div className="flex justify-evenly items-center px-6">
            {/* Gallery Upload Button */}
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => fileInputRef.current.click()} style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={22} color="white" strokeWidth={1.5} />
              </button>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Gallery</span>
            </div>

            {/* Main Shutter (Snap Picture) */}
            <div className="flex flex-col items-center gap-2">
              <button onClick={takePicture} style={{ position: 'relative', width: 76, height: 76, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.20)' }} />
              </button>
              <span style={{ fontSize: '10px', color: 'white', fontWeight: 700 }}>Snap Photo</span>
            </div>

            {/* Flip Camera */}
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => setCameraFacing(f => f === 'environment' ? 'user' : 'environment')} style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCcw size={22} color="white" strokeWidth={1.5} />
              </button>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Flip</span>
            </div>
          </div>

          {/* Auto-Scan Toggle */}
          <div className="flex justify-center mt-6">
            <button onClick={() => setIsScanning(!isScanning)} style={{ background: isScanning ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.1)', border: isScanning ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255,255,255,0.15)', padding: '8px 24px', borderRadius: '30px', color: isScanning ? '#4ADE80' : 'white', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {isScanning ? 'Stop Auto-Scan' : 'Start Auto-Scan'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 2: STATIC RESULT VIEW                                              */}
      {/* ========================================================================= */}
      <div style={{ position: 'absolute', inset: 0, opacity: viewMode === 'result' ? 1 : 0, pointerEvents: viewMode === 'result' ? 'auto' : 'none', transition: 'opacity 0.3s', background: '#0A0F0C', zIndex: 50 }}>
        
        {/* Top Header - Results */}
        <div style={{ position: 'absolute', top: 0, width: '100%', zIndex: 60, padding: '48px 16px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => { setViewMode('live'); setStaticImageSrc(null); setDetections([]); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '12px', fontWeight: 600 }}>
            <ArrowLeft size={16} strokeWidth={2.5} /> Back to Camera
          </button>
          <button onClick={saveToGallery} disabled={isAnalyzing} style={{ background: isAnalyzing ? 'rgba(255,255,255,0.1)' : 'rgba(74, 222, 128, 0.15)', border: isAnalyzing ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(74, 222, 128, 0.3)', padding: '8px 14px', borderRadius: '20px', color: isAnalyzing ? 'rgba(255,255,255,0.5)' : '#4ADE80', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} strokeWidth={2.5} /> Save Result
          </button>
        </div>

        {/* The Static Image */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {staticImageSrc && (
            <img ref={resultImgRef} src={staticImageSrc} alt="Scan Result" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}
          
          {/* Static Bounding Boxes */}
          {!isAnalyzing && detections.filter(d => d.confidence >= threshold).map((det, index) => {
            if (!resultImgRef.current) return null;
            const { naturalWidth, naturalHeight } = resultImgRef.current;
            if (!naturalWidth) return null;
            const [x_min, y_min, x_max, y_max] = det.bbox;
            const left = (x_min / naturalWidth) * 100;
            const top = (y_min / naturalHeight) * 100;
            const width = ((x_max - x_min) / naturalWidth) * 100;
            const height = ((y_max - y_min) / naturalHeight) * 100;
            const isHarvest = det.class.toLowerCase().includes('harvest') && !det.class.toLowerCase().includes('not');
            const color = isHarvest ? '#4ADE80' : '#FBBF24';
            return (
              <div key={index} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, border: `2px solid ${color}`, borderRadius: '6px', background: isHarvest ? 'rgba(74, 222, 128, 0.15)' : 'rgba(251, 191, 36, 0.15)', boxShadow: `0 0 16px ${color}40` }}>
                <div style={{ position: 'absolute', top: -24, left: -2, background: color, borderRadius: '4px 4px 4px 0', padding: '3px 8px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: isHarvest ? '#052e16' : '#451a03', letterSpacing: '0.5px' }}>{det.class.toUpperCase()} · {det.confidence}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading Overlay while Python processes the static image */}
        {isAnalyzing && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 55 }}>
            <Loader2 size={40} color="#4ADE80" className="animate-spin mb-4" />
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 600, letterSpacing: '1px' }}>Analyzing Image...</span>
          </div>
        )}

        {/* Bottom Stats Card - Results */}
        {!isAnalyzing && (
          <div style={{ position: 'absolute', bottom: 0, width: '100%', zIndex: 60, padding: '0 16px 24px', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}>
            <div style={{ background: 'rgba(15, 20, 16, 0.85)', backdropFilter: 'blur(24px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '16px' }}>
              
              <h3 style={{ color: 'white', fontSize: '12px', fontWeight: 600, marginBottom: '12px', letterSpacing: '0.5px' }}>Scan Summary</h3>
              
              <div className="flex gap-2 mb-4">
                <div style={{ flex: 1, background: 'rgba(74, 222, 128, 0.10)', border: '1px solid rgba(74, 222, 128, 0.20)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0 }}><span style={{ fontSize: '16px', margin: 'auto' }}>🌴</span></div>
                  <div>
                    <p style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Harvest</p>
                    <p style={{ fontSize: '22px', fontWeight: 800, color: '#4ADE80', lineHeight: 1 }}>{harvestCount}</p>
                  </div>
                </div>
                <div style={{ flex: 1, background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.18)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(251, 191, 36, 0.12)', display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0 }}><span style={{ fontSize: '16px', margin: 'auto' }}>⏳</span></div>
                  <div>
                    <p style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Not Ready</p>
                    <p style={{ fontSize: '22px', fontWeight: 800, color: '#FBBF24', lineHeight: 1 }}>{notHarvestCount}</p>
                  </div>
                </div>
              </div>

              {/* Confidence Threshold Slider */}
              <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.3px' }}>Adjust AI Strictness</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#4ADE80', background: 'rgba(74, 222, 128, 0.12)', padding: '2px 8px', borderRadius: '20px' }}>{threshold}%</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, width: `${((threshold - 10) / 90) * 100}%`, height: '4px', borderRadius: '2px', background: 'linear-gradient(90deg, #2D6A4F, #4ADE80)', pointerEvents: 'none', zIndex: 1 }} />
                  <input type="range" min="10" max="100" value={threshold} onChange={(e) => setThreshold(e.target.value)} style={{ width: '100%', height: '4px', appearance: 'none', WebkitAppearance: 'none', background: 'rgba(255,255,255,0.10)', borderRadius: '2px', outline: 'none', cursor: 'pointer', position: 'relative', zIndex: 2 }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}