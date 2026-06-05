import { useState, useEffect } from 'react';
import { Home, Focus, Clock } from 'lucide-react';
import Dashboard from './Dashboard';
import LiveDetection from './LiveDetection';
import History from './History';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);

  // Timer to hide the splash screen after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); 
    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // SPLASH SCREEN UI
  // ==========================================
  if (showSplash) {
    return (
      <div className="max-w-md mx-auto h-[100dvh] bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] flex flex-col items-center justify-center text-white relative overflow-hidden shadow-2xl">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-black/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          
          {/* LOGO REPLACING THE EMOJI */}
          <div className="bg-white p-3 rounded-3xl mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.25)] w-28 h-28 flex items-center justify-center animate-bounce">
            <img 
              src="/logo.png" 
              alt="PalmDetect Logo" 
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                // If logo.png is missing, fallback to the emoji so it doesn't break
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="text-6xl drop-shadow-xl block">🌴</span>';
              }}
            />
          </div>
          
          {/* App Title */}
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1 drop-shadow-md" style={{ fontFamily: "'DM Serif Display', serif" }}>
            PalmDetect AI
          </h1>
          <p className="text-[11px] font-medium text-green-100 tracking-widest uppercase opacity-80">
            Precision Palm Detection
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN APP UI
  // ==========================================
  return (
    <div className="max-w-md mx-auto relative h-[100dvh] bg-[#F8F9FA] overflow-hidden text-gray-800 flex flex-col shadow-2xl">
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative w-full hide-scrollbar">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'camera' && <LiveDetection />}
        {activeTab === 'history' && <History />}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="w-full bg-white border-t border-gray-100 flex justify-between items-end px-8 pt-3 pb-6 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(27,67,50,0.06)] flex-shrink-0 relative">
        
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-[#2D6A4F] scale-110' : 'text-gray-400 hover:text-gray-500'}`}
        >
          <Home size={24} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>

        {/* Center Live Detection Tab */}
        <button
          onClick={() => setActiveTab('camera')}
          className="relative flex flex-col items-center group active:scale-95 transition-transform"
        >
          <div className={`absolute -top-12 p-3.5 rounded-full shadow-[0_8px_20px_rgba(45,106,79,0.25)] transition-colors duration-300 ${activeTab === 'camera' ? 'bg-[#2D6A4F]' : 'bg-white border-2 border-gray-50'}`}>
            <Focus size={28} className={activeTab === 'camera' ? 'text-white' : 'text-[#2D6A4F]'} strokeWidth={2.5} />
          </div>
          <span className={`text-[10px] font-bold mt-6 transition-colors duration-300 ${activeTab === 'camera' ? 'text-[#2D6A4F]' : 'text-gray-400'}`}>
            Live Scanner
          </span>
        </button>

        {/* History Tab */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'history' ? 'text-[#2D6A4F] scale-110' : 'text-gray-400 hover:text-gray-500'}`}
        >
          <Clock size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">History</span>
        </button>

      </div>
    </div>
  );
}