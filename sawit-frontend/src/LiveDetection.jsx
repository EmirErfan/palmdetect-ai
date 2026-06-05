import { Settings, Zap, RefreshCcw, ZapOff, Download, Image as ImageIcon, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { API_URL } from './config';

export default function LiveDetection() {
  const [threshold, setThreshold] = useState(40);
  const [detections, setDetections] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraMode, setCameraMode] = useState('live'); // 'live', 'photo', or 'gallery'
  const [showFlash, setShowFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);

  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Start Camera
  useEffect(() => {
    async function startCamera() {
      if (cameraMode === 'gallery') return;
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
    startCamera();
    return () => {
      if (streamRef.current && cameraMode === 'gallery') {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraFacing, cameraMode]);

  // 2. Process Live/Photo Frame
  const processFrame = async () => {
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
          console.error("AI Server Error:", error);
        }
      }, 'image/jpeg', 0.4);
    }
  };

  // 3. Live Scanner Loop
  useEffect(() => {
    let interval;
    if (isScanning && cameraMode === 'live') {
      interval = setInterval(() => {
        processFrame();
      }, 1000);
    } else if (cameraMode !== 'gallery') {
      setDetections([]);
    }
    return () => clearInterval(interval);
  }, [isScanning, cameraMode]);

  // 4. Take Picture
  const takePicture = async () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
    await processFrame();
  };

  // 5. Handle Image Upload from Gallery
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsScanning(false);
    setCameraMode('gallery');
    setDetections([]);
    
    const imageUrl = URL.createObjectURL(file);
    setUploadedImageSrc(imageUrl);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { "Bypass-Tunnel-Reminder": "true" },
        body: formData,
      });
      const data = await response.json();
      setDetections(data.detections || []);
    } catch (error) {
      console.error("AI Server Error:", error);
    }
  };

  // 6. Save to Gallery Function
  const saveToGallery = () => {
    const isGalleryMode = cameraMode === 'gallery' && imgRef.current;
    const mediaNode = isGalleryMode ? imgRef.current : videoRef.current;
    if (!mediaNode) return;
    
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    const canvas = document.createElement('canvas');
    canvas.width = isGalleryMode ? mediaNode.naturalWidth : mediaNode.videoWidth;
    canvas.height = isGalleryMode ? mediaNode.naturalHeight : mediaNode.videoHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(mediaNode, 0, 0, canvas.width, canvas.height);

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

  const harvestCount = detections.filter(d => d.confidence >= threshold && d.class.toLowerCase().includes('harvest') && !d.class.toLowerCase().includes('not')).length;
  const notHarvestCount = detections.filter(d => d.confidence >= threshold && d.class.toLowerCase().includes('not')).length;

  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{ background: '#0A0F0C' }}>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {showFlash && (
        <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 100, opacity: 0.9, transition: 'opacity 0.2s ease', pointerEvents: 'none' }} />
      )}

      {/* Media Feed */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {cameraMode === 'gallery' && uploadedImageSrc ? (
          <img ref={imgRef} src={uploadedImageSrc} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <canvas ref={canvasRef} className="hidden" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.40) 100%)', pointerEvents: 'none' }} />
      </div>

      {/* Detection Boxes */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        {detections.filter(d => d.confidence >= threshold).map((det, index) => {
          const mediaNode = cameraMode === 'gallery' ? imgRef.current : videoRef.current;
          if (!mediaNode) return null;
          const mediaWidth = cameraMode === 'gallery' ? mediaNode.naturalWidth : mediaNode.videoWidth;
          const mediaHeight = cameraMode === 'gallery' ? mediaNode.naturalHeight : mediaNode.videoHeight;
          if (!mediaWidth || !mediaHeight) return null;

          const [x_min, y_min, x_max, y_max] = det.bbox;
          const left = (x_min / mediaWidth) * 100;
          const top = (y_min / mediaHeight) * 100;
          const width = ((x_max - x_min) / mediaWidth) * 100;
          const height = ((y_max - y_min) / mediaHeight) * 100;
          const isHarvest = det.class.toLowerCase().includes('harvest') && !det.class.toLowerCase().includes('not');
          const color = isHarvest ? '#4ADE80' : '#FBBF24';
          const bgColor = isHarvest ? 'rgba(74, 222, 128, 0.08)' : 'rgba(251, 191, 36, 0.08)';

          return (
            <div key={index} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, border: `1.5px solid ${color}`, borderRadius: '6px', background: bgColor, boxShadow: `0 0 12px ${color}30` }}>
              {[
                { top: -1.5, left: -1.5, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, borderRadius: '3px 0 0 0' },
                { top: -1.5, right: -1.5, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, borderRadius: '0 3px 0 0' },
                { bottom: -1.5, left: -1.5, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`, borderRadius: '0 0 0 3px' },
                { bottom: -1.5, right: -1.5, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`, borderRadius: '0 0 3px 0' },
              ].map((style, ci) => <div key={ci} style={{ position: 'absolute', width: 10, height: 10, ...style }} />)}
              <div style={{ position: 'absolute', top: -24, left: -1, background: color, borderRadius: '4px 4px 4px 0', padding: '2px 7px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: isHarvest ? '#052e16' : '#451a03', letterSpacing: '0.3px' }}>
                  {det.class.toUpperCase()} · {det.confidence}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Bar with NEW LOGO SUPPORT */}
      <div style={{ position: 'absolute', top: 0, width: '100%', zIndex: 20, padding: '48px 16px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }}>
        <div className="flex justify-between items-center">
          
          {/* LOGO AND TITLE AREA */}
          <div className="flex items-center gap-3">
            
            {/* THIS IS YOUR LOGO IMAGE */}
            <div style={{
              width: 38, height: 38, 
              background: 'white', // White background in case your logo is transparent and dark
              borderRadius: '10px',
              padding: '2px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} 
                onError={(e) => {
                  // Fallback if logo.png is missing: hides the broken image icon
                  e.target.style.display = 'none';
                  e.target.parentElement.style.display = 'none';
                }}
              />
            </div>

            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', fontWeight: 400, color: 'white', lineHeight: 1.1, letterSpacing: '-0.3px' }}>
                Live Detection
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: isScanning && cameraMode === 'live' ? '#4ADE80' : 'rgba(255,255,255,0.4)',
                  boxShadow: isScanning && cameraMode === 'live' ? '0 0 8px #4ADE80' : 'none', animation: isScanning && cameraMode === 'live' ? 'pulse 2s ease infinite' : 'none',
                }} />
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.3px' }}>
                  {cameraMode === 'gallery' ? 'Gallery Image' : cameraMode === 'photo' ? 'Photo Mode' : isScanning ? 'Scanning Active' : 'Scanner Paused'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={saveToGallery} style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '9px' }}>
              <Download size={18} color="white" strokeWidth={1.8} />
            </button>
            <button style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '9px' }}>
              <Settings size={18} color="white" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls Panel */}
      <div style={{ position: 'absolute', bottom: 0, width: '100%', zIndex: 20, padding: '0 0 16px 0', background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}>
        <div style={{ margin: '0 12px 12px', background: 'rgba(15, 20, 16, 0.72)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px' }}>
          <div className="flex gap-2 mb-3">
            <div style={{ flex: 1, background: 'rgba(74, 222, 128, 0.10)', border: '1px solid rgba(74, 222, 128, 0.20)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '16px' }}>🌴</span></div>
              <div>
                <p style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Harvest</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#4ADE80', lineHeight: 1 }}>{harvestCount}</p>
              </div>
            </div>
            <div style={{ flex: 1, background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.18)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(251, 191, 36, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '16px' }}>⏳</span></div>
              <div>
                <p style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Not Ready</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#FBBF24', lineHeight: 1 }}>{notHarvestCount}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.3px' }}>Confidence Threshold</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#4ADE80', background: 'rgba(74, 222, 128, 0.12)', padding: '2px 8px', borderRadius: '20px' }}>{threshold}%</span>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, width: `${((threshold - 10) / 90) * 100}%`, height: '4px', borderRadius: '2px', background: 'linear-gradient(90deg, #2D6A4F, #4ADE80)', pointerEvents: 'none', zIndex: 1 }} />
              <input type="range" min="10" max="100" value={threshold} onChange={(e) => setThreshold(e.target.value)} style={{ width: '100%', height: '4px', appearance: 'none', WebkitAppearance: 'none', background: 'rgba(255,255,255,0.10)', borderRadius: '2px', outline: 'none', cursor: 'pointer', position: 'relative', zIndex: 2 }} />
            </div>
          </div>
        </div>

        <div className="flex justify-center" style={{ marginBottom: '12px' }}>
          <div style={{ background: 'rgba(15, 20, 16, 0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '30px', padding: '3px', display: 'flex', gap: '2px' }}>
            {['live', 'photo'].map((mode) => (
              <button key={mode} onClick={() => { setCameraMode(mode); if (mode === 'photo') setIsScanning(false); setUploadedImageSrc(null); setDetections([]); }} style={{ padding: '6px 20px', borderRadius: '26px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', transition: 'all 0.25s ease', background: cameraMode === mode ? 'white' : 'transparent', color: cameraMode === mode ? '#0A0F0C' : 'rgba(255,255,255,0.50)', boxShadow: cameraMode === mode ? '0 2px 10px rgba(0,0,0,0.20)' : 'none', border: 'none', cursor: 'pointer' }}>
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center" style={{ padding: '0 32px' }}>
          <button onClick={() => fileInputRef.current.click()} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ImageIcon size={18} color="white" strokeWidth={2} />
          </button>

          {cameraMode === 'gallery' ? (
             <button onClick={() => { setUploadedImageSrc(null); setCameraMode('live'); setDetections([]); }} style={{ position: 'relative', width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2.5px solid rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
               <X size={28} color="white" strokeWidth={2.5} />
             </button>
          ) : cameraMode === 'live' ? (
            <button onClick={() => setIsScanning(!isScanning)} style={{ position: 'relative', width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2.5px solid rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: isScanning ? '0 0 0 6px rgba(74, 222, 128, 0.15), 0 0 20px rgba(74, 222, 128, 0.20)' : 'none' }}>
              <div style={{ width: 46, height: 46, borderRadius: isScanning ? '8px' : '50%', background: isScanning ? '#ef4444' : 'linear-gradient(135deg, #2D6A4F, #4ADE80)', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: isScanning ? 'scale(0.6)' : 'scale(1)', boxShadow: isScanning ? '0 4px 16px rgba(239, 68, 68, 0.50)' : '0 4px 16px rgba(74, 222, 128, 0.30)' }} />
            </button>
          ) : (
            <button onClick={takePicture} style={{ position: 'relative', width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2.5px solid rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.20)' }} />
            </button>
          )}

          {cameraMode === 'gallery' ? (
            <div style={{ width: 44, height: 44 }} />
          ) : (
            <button onClick={() => setCameraFacing(f => f === 'environment' ? 'user' : 'environment')} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <RefreshCcw size={18} color="rgba(255,255,255,0.75)" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {isScanning && cameraMode === 'live' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', backgroundSize: '48px 48px', backgroundImage: `linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px)` }} />
      )}
    </div>
  );
}