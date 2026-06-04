import { Settings, Zap, RefreshCcw, Camera, Scan, ZapOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LiveDetection() {
  const [threshold, setThreshold] = useState(40);
  const [detections, setDetections] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraMode, setCameraMode] = useState('live');
  const [showFlash, setShowFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // 1. Start Camera
  useEffect(() => {
    async function startCamera() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing }
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraFacing]);

  // 2. Process Frame
  const processFrame = async (saveToDatabase = false) => {
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
         
          const response = await fetch(`https://post-silver-nobody-self.trycloudflare.com`, {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          setDetections(data.detections || []);
        } catch (error) {
          console.error("AI Server Error:", error);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // 3. Live Scanner Loop
  useEffect(() => {
    let interval;
    if (isScanning && cameraMode === 'live') {
      interval = setInterval(() => {
        processFrame(false);
      }, 1000);
    } else {
      setDetections([]);
    }
    return () => clearInterval(interval);
  }, [isScanning, cameraMode]);

  // 4. Take Picture
  const takePicture = async () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
    await processFrame(true);
  };

  const harvestCount = detections.filter(d =>
    d.confidence >= threshold &&
    d.class.toLowerCase().includes('harvest') &&
    !d.class.toLowerCase().includes('not')
  ).length;

  const notHarvestCount = detections.filter(d =>
    d.confidence >= threshold &&
    d.class.toLowerCase().includes('not')
  ).length;

  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{ background: '#0A0F0C' }}>

      {/* Flash overlay */}
      {showFlash && (
        <div style={{
          position: 'absolute', inset: 0, background: 'white',
          zIndex: 100, opacity: 0.9,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none',
        }} />
      )}

      {/* Camera Feed */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas ref={canvasRef} className="hidden" />
        {/* Dark gradient vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.40) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Detection Boxes Overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        {detections.filter(d => d.confidence >= threshold).map((det, index) => {
          if (!videoRef.current) return null;
          const { videoWidth, videoHeight } = videoRef.current;
          const [x_min, y_min, x_max, y_max] = det.bbox;
          const left = (x_min / videoWidth) * 100;
          const top = (y_min / videoHeight) * 100;
          const width = ((x_max - x_min) / videoWidth) * 100;
          const height = ((y_max - y_min) / videoHeight) * 100;
          const isHarvest = det.class.toLowerCase().includes('harvest') && !det.class.toLowerCase().includes('not');
          const color = isHarvest ? '#4ADE80' : '#FBBF24';
          const bgColor = isHarvest ? 'rgba(74, 222, 128, 0.08)' : 'rgba(251, 191, 36, 0.08)';

          return (
            <div
              key={index}
              className="detection-box"
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
                border: `1.5px solid ${color}`,
                borderRadius: '6px',
                background: bgColor,
                boxShadow: `0 0 12px ${color}30`,
              }}
            >
              {/* Corner accents */}
              {[
                { top: -1.5, left: -1.5, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, borderRadius: '3px 0 0 0' },
                { top: -1.5, right: -1.5, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, borderRadius: '0 3px 0 0' },
                { bottom: -1.5, left: -1.5, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`, borderRadius: '0 0 0 3px' },
                { bottom: -1.5, right: -1.5, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`, borderRadius: '0 0 3px 0' },
              ].map((style, ci) => (
                <div key={ci} style={{ position: 'absolute', width: 10, height: 10, ...style }} />
              ))}
              {/* Label */}
              <div style={{
                position: 'absolute',
                top: -24,
                left: -1,
                background: color,
                borderRadius: '4px 4px 4px 0',
                padding: '2px 7px',
                whiteSpace: 'nowrap',
              }}>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: isHarvest ? '#052e16' : '#451a03',
                  letterSpacing: '0.3px',
                }}>
                  {det.class.toUpperCase()} · {det.confidence}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Bar */}
      <div style={{
        position: 'absolute', top: 0, width: '100%', zIndex: 20,
        padding: '48px 16px 16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
      }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '20px',
              fontWeight: 400,
              color: 'white',
              lineHeight: 1.1,
              letterSpacing: '-0.3px',
            }}>
              Live Detection
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isScanning && cameraMode === 'live' ? '#4ADE80' : 'rgba(255,255,255,0.4)',
                boxShadow: isScanning && cameraMode === 'live' ? '0 0 8px #4ADE80' : 'none',
                animation: isScanning && cameraMode === 'live' ? 'pulse 2s ease infinite' : 'none',
              }} />
              <span style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.3px' }}>
                {cameraMode === 'photo' ? 'Photo Mode' : isScanning ? 'Scanning Active' : 'Scanner Paused'}
              </span>
            </div>
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            padding: '9px',
          }}>
            <Settings size={18} color="white" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Bottom Controls Panel */}
      <div style={{
        position: 'absolute', bottom: 0, width: '100%', zIndex: 20,
        padding: '0 0 16px 0',
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
      }}>

        {/* Stats + Controls Glass Card */}
        <div style={{
          margin: '0 12px 12px',
          background: 'rgba(15, 20, 16, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 16px',
        }}>

          {/* Live count badges */}
          <div className="flex gap-2 mb-3">
            <div style={{
              flex: 1,
              background: 'rgba(74, 222, 128, 0.10)',
              border: '1px solid rgba(74, 222, 128, 0.20)',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '10px',
                background: 'rgba(74, 222, 128, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '16px' }}>🌴</span>
              </div>
              <div>
                <p style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>
                  Harvest
                </p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#4ADE80', lineHeight: 1 }}>{harvestCount}</p>
              </div>
            </div>

            <div style={{
              flex: 1,
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.18)',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '10px',
                background: 'rgba(251, 191, 36, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '16px' }}>⏳</span>
              </div>
              <div>
                <p style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>
                  Not Ready
                </p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#FBBF24', lineHeight: 1 }}>{notHarvestCount}</p>
              </div>
            </div>
          </div>

          {/* Confidence Threshold Slider */}
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.3px' }}>
                Confidence Threshold
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 800,
                color: '#4ADE80',
                background: 'rgba(74, 222, 128, 0.12)',
                padding: '2px 8px', borderRadius: '20px',
              }}>
                {threshold}%
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                left: 0, width: `${((threshold - 10) / 90) * 100}%`,
                height: '4px', borderRadius: '2px',
                background: 'linear-gradient(90deg, #2D6A4F, #4ADE80)',
                pointerEvents: 'none', zIndex: 1,
              }} />
              <input
                type="range"
                min="10"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                style={{
                  width: '100%',
                  height: '4px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 2,
                }}
              />
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex justify-center" style={{ marginBottom: '12px' }}>
          <div style={{
            background: 'rgba(15, 20, 16, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '30px',
            padding: '3px',
            display: 'flex', gap: '2px',
          }}>
            {['live', 'photo'].map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setCameraMode(mode);
                  if (mode === 'photo') setIsScanning(false);
                  setDetections([]);
                }}
                style={{
                  padding: '6px 20px',
                  borderRadius: '26px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  transition: 'all 0.25s ease',
                  background: cameraMode === mode ? 'white' : 'transparent',
                  color: cameraMode === mode ? '#0A0F0C' : 'rgba(255,255,255,0.50)',
                  boxShadow: cameraMode === mode ? '0 2px 10px rgba(0,0,0,0.20)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Shutter Row */}
        <div className="flex justify-between items-center" style={{ padding: '0 32px' }}>

          {/* Torch */}
          <button
            onClick={() => setTorchOn(!torchOn)}
            style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: torchOn ? 'rgba(233, 196, 106, 0.20)' : 'rgba(255,255,255,0.10)',
              border: torchOn ? '1px solid rgba(233, 196, 106, 0.40)' : '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {torchOn ? (
              <Zap size={20} fill="rgba(233,196,106,0.9)" color="rgba(233,196,106,0.9)" strokeWidth={1.5} />
            ) : (
              <ZapOff size={20} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
            )}
          </button>

          {/* Main Shutter */}
          {cameraMode === 'live' ? (
            <button
              onClick={() => setIsScanning(!isScanning)}
              style={{
                position: 'relative',
                width: 68, height: 68,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: '2.5px solid rgba(255,255,255,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isScanning ? '0 0 0 6px rgba(74, 222, 128, 0.15), 0 0 20px rgba(74, 222, 128, 0.20)' : 'none',
              }}
            >
              <div style={{
                width: 46,
                height: 46,
                borderRadius: isScanning ? '8px' : '50%',
                background: isScanning
                  ? '#ef4444'
                  : 'linear-gradient(135deg, #2D6A4F, #4ADE80)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isScanning ? 'scale(0.6)' : 'scale(1)',
                boxShadow: isScanning
                  ? '0 4px 16px rgba(239, 68, 68, 0.50)'
                  : '0 4px 16px rgba(74, 222, 128, 0.30)',
              }} />
            </button>
          ) : (
            <button
              onClick={takePicture}
              style={{
                position: 'relative',
                width: 68, height: 68,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: '2.5px solid rgba(255,255,255,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.20)',
              }} />
            </button>
          )}

          {/* Flip Camera */}
          <button
            onClick={() => setCameraFacing(f => f === 'environment' ? 'user' : 'environment')}
            style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RefreshCcw size={18} color="rgba(255,255,255,0.75)" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Scanning grid overlay when active */}
      {isScanning && cameraMode === 'live' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }} />
      )}
    </div>
  );
}