
import React, { useState, useEffect, useCallback } from 'react';

interface UIOverlayProps {
  stats: {
    x: number;
    y: number;
    radius: number;
    merges: number;
    fps: number;
  };
}

const UIOverlay: React.FC<UIOverlayProps> = ({ stats }) => {
  const menuItems = [
    'Prediksi Bola',
    'Prediksi Togel',
    'Syair',
    'Validasi Rekening',
    'Cara Main Togel',
    'Cara Main Bola',
    'Shio Referensi',
    'Setting'
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const nextSlide = useCallback(() => {
    if (selectedItem) return;
    setActiveIndex((prev) => (prev + 1) % menuItems.length);
  }, [menuItems.length, selectedItem]);

  const prevSlide = useCallback(() => {
    if (selectedItem) return;
    setActiveIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
  }, [menuItems.length, selectedItem]);

  useEffect(() => {
    if (isPaused || selectedItem) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused, selectedItem]);

  const handleNavClick = (item: string, index: number) => {
    setActiveIndex(index);
    setSelectedItem(item);
    setIsNavOpen(false);
  };

  // Content Data Generators
  const renderContent = () => {
    switch (selectedItem) {
      case 'Prediksi Bola':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-primary uppercase tracking-widest border-b border-white/10 pb-4">Match Analysis • LIVE</h2>
            <div className="grid gap-4">
              {[
                { match: 'Real Madrid vs Man City', pick: 'Over 2.5', conf: 85 },
                { match: 'Liverpool vs Arsenal', pick: 'Home Win', conf: 72 },
                { match: 'Bayern vs PSG', pick: 'BTTS', conf: 91 }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/5">
                  <span className="font-secondary text-xs opacity-60 uppercase">{item.match}</span>
                  <div className="text-right">
                    <span className="font-primary text-sm block uppercase">{item.pick}</span>
                    <div className="w-24 h-1 bg-white/10 mt-2">
                      <div className="h-full bg-white" style={{ width: `${item.conf}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Prediksi Togel':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-primary uppercase tracking-widest border-b border-white/10 pb-4">Daily Numbers</h2>
            <div className="grid grid-cols-2 gap-4">
              {['HONGKONG', 'SINGAPORE', 'SYDNEY', 'MACAU'].map((pool) => (
                <div key={pool} className="p-4 border border-white/10 hover:bg-white/5 transition-colors">
                  <p className="font-secondary text-[10px] opacity-40 mb-2">{pool}</p>
                  <p className="text-2xl font-primary tracking-tighter">
                    {Math.floor(1000 + Math.random() * 9000)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Syair':
        return (
          <div className="space-y-8 py-4">
             <div className="italic font-primary text-xl md:text-2xl leading-relaxed text-center opacity-80">
               "Burung merpati terbang tinggi,<br/>
               mencari makan di pagi hari.<br/>
               Angka main sudah menanti,<br/>
               jangan ragu pasang di hati."
             </div>
             <div className="text-center font-secondary text-[10px] tracking-[0.3em] uppercase opacity-40">
               Kodok Mas • Edisi 24.05
             </div>
          </div>
        );
      case 'Validasi Rekening':
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 border border-white/20 rounded-full mx-auto flex items-center justify-center animate-pulse">
              <div className="w-12 h-12 bg-white rounded-full opacity-20" />
            </div>
            <p className="font-secondary text-xs opacity-60 uppercase">Input Bank Details for Verification</p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <input type="text" placeholder="ACCOUNT NUMBER" className="bg-transparent border-b border-white/20 p-2 font-secondary text-xs focus:border-white outline-none transition-colors" />
              <button className="bg-white text-black font-primary text-xs py-3 uppercase tracking-widest hover:bg-gray-200 transition-colors mt-4">Run Validation</button>
            </div>
          </div>
        );
      case 'Shio Referensi':
        const shios = ['Tikus', 'Kerbau', 'Macan', 'Kelinci', 'Naga', 'Ular', 'Kuda', 'Kambing', 'Monyet', 'Ayam', 'Anjing', 'Babi'];
        return (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {shios.map((shio, i) => (
              <div key={shio} className="p-3 border border-white/5 text-center group hover:bg-white hover:text-black transition-all">
                <p className="font-secondary text-[10px] opacity-40 group-hover:opacity-100">{i + 1}</p>
                <p className="font-primary text-sm uppercase">{shio}</p>
              </div>
            ))}
          </div>
        );
      case 'Setting':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
               <span className="font-secondary text-xs uppercase opacity-60">System Luminance</span>
               <div className="w-32 h-1 bg-white/20 relative">
                  <div className="absolute inset-y-0 left-0 w-3/4 bg-white" />
               </div>
            </div>
            <div className="flex justify-between items-center">
               <span className="font-secondary text-xs uppercase opacity-60">Motion Blur</span>
               <div className="w-10 h-5 border border-white/20 rounded-full p-1 relative cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full ml-auto" />
               </div>
            </div>
            <div className="pt-4 border-t border-white/10 text-[9px] font-secondary uppercase opacity-30 text-center">
              Nexus Environment Engine v2.5.1
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-primary uppercase tracking-widest">Guide</h2>
            <p className="font-secondary text-sm leading-loose opacity-70">
              Nexus provides a secure and high-performance interface for all your analytical needs.
              Follow our official protocols to ensure maximum efficiency in match selection and pool analysis.
            </p>
            <ul className="space-y-2 pt-4">
              {['Analyze Trends', 'Cross-reference Data', 'Finalize Submission'].map((step, i) => (
                <li key={i} className="flex items-center gap-4 font-secondary text-xs uppercase">
                  <span className="opacity-30">0{i+1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 z-10 flex flex-col p-8 md:p-12 lg:p-16 transition-colors duration-1000 ${selectedItem ? 'bg-black/40' : 'pointer-events-none'}`}>
      
      {/* Header - Balanced 3-Column Layout */}
      <header className="grid grid-cols-2 lg:grid-cols-3 items-center pointer-events-auto z-[60]">
        {/* Logo - Left aligned */}
        <div 
          className="group relative w-12 h-8 cursor-pointer overflow-visible"
          onClick={() => {
            setSelectedItem(null);
            setIsNavOpen(false);
          }}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full transition-transform duration-500 group-hover:-translate-x-2"></div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full mix-blend-exclusion transition-transform duration-500 group-hover:translate-x-2"></div>
        </div>

        {/* Desktop Navbar - Center aligned to avoid Tweakpane on the right */}
        <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8">
          {menuItems.map((item, idx) => (
            <button
              key={item}
              onClick={() => handleNavClick(item, idx)}
              className={`font-secondary text-[9px] uppercase tracking-[0.2em] transition-all duration-300 hover:text-white relative pb-1 group/item ${
                activeIndex === idx ? 'text-white' : 'text-white/40'
              }`}
            >
              {item}
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white transition-transform duration-500 ${
                activeIndex === idx ? 'scale-100' : 'scale-0 group-hover/item:scale-75'
              }`} />
            </button>
          ))}
        </nav>

        {/* Right side - Mobile Nav Toggle or Empty space for desktop (to clear Tweakpane) */}
        <div className="flex justify-end">
          <button 
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="lg:hidden font-secondary text-[10px] uppercase tracking-widest text-white/60 hover:text-white"
          >
            {isNavOpen ? 'Close' : 'Index'}
          </button>
          <div className="hidden lg:block w-32 h-1 invisible">Space for Tweakpane</div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <div className={`fixed inset-0 bg-black/95 backdrop-blur-3xl z-[55] transition-all duration-700 lg:hidden pointer-events-auto flex flex-col ${
        isNavOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
      }`}>
        <div className="flex flex-col items-center justify-center h-full gap-6 px-12">
          {menuItems.map((item, idx) => (
            <button
              key={item}
              onClick={() => handleNavClick(item, idx)}
              className="font-primary text-2xl uppercase tracking-tighter text-white/50 hover:text-white transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Main Slider Content (Dimmed when active) */}
      <main 
        className={`flex-1 flex flex-col items-center justify-center relative transition-all duration-700 ${
          selectedItem ? 'opacity-20 scale-95 blur-sm' : 'pointer-events-auto'
        }`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative w-full max-w-7xl overflow-hidden py-10 md:py-20 group">
          <div 
            className="flex transition-transform duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {menuItems.map((item, idx) => (
              <div
                key={item}
                className="w-full flex-shrink-0 flex items-center justify-center px-4 relative"
              >
                {/* Darkness Aura Image Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-1000 overflow-visible">
                  <img 
                    src="https://i.postimg.cc/6ps1n0Sw/image.png" 
                    className={`w-[280px] h-[280px] md:w-[500px] md:h-[500px] lg:w-[700px] lg:h-[700px] object-contain mix-blend-screen transition-all duration-1000 ${
                      idx === activeIndex ? 'animate-aura' : 'opacity-0 scale-75'
                    }`}
                    alt="Darkness Aura"
                  />
                </div>

                <button 
                  onClick={() => setSelectedItem(item)}
                  className={`font-primary text-4xl md:text-7xl lg:text-9xl uppercase tracking-tighter transition-all duration-1000 relative z-10 ${
                    idx === activeIndex ? 'text-white scale-100 opacity-100' : 'text-gray-800 scale-90 opacity-30 blur-[2px]'
                  } hover:text-gray-200 outline-none`}
                >
                  {item}
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-6 text-gray-600 hover:text-white transition-all duration-300 transform hover:scale-110 active:scale-90"
          >
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                <path d="M15 18l-6-6 6-6" />
             </svg>
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-6 text-gray-600 hover:text-white transition-all duration-300 transform hover:scale-110 active:scale-90"
          >
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                <path d="M9 18l6-6-6-6" />
             </svg>
          </button>
        </div>

        <div className="flex gap-2 md:gap-3 mt-12">
          {menuItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="relative h-10 w-8 md:w-12 group"
            >
              <div className={`absolute top-1/2 left-0 right-0 h-[1px] transition-all duration-700 ${
                idx === activeIndex ? 'bg-white scale-x-110' : 'bg-gray-800 scale-x-100 group-hover:bg-gray-600'
              }`} />
              {idx === activeIndex && (
                 <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-secondary text-white opacity-40">
                   0{idx + 1}
                 </span>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Content Detail Panel */}
      {selectedItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 md:p-12 pointer-events-none">
          <div className="w-full max-w-2xl bg-black/70 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_32px_128px_-12px_rgba(0,0,0,0.8)] pointer-events-auto transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-12">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-8 right-8 p-2 text-white/30 hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-4">
              <p className="font-secondary text-[10px] uppercase tracking-[0.3em] text-white/30 mb-8 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                Nexus Node Management
              </p>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Area */}
      <footer className="flex justify-between items-end pointer-events-auto">
        <div className="font-secondary text-[9px] uppercase tracking-[0.4em] text-gray-400 flex flex-col gap-1">
           <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${selectedItem ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`} />
              <span>{selectedItem ? 'Module Active' : 'System Online'}</span>
           </div>
           <p className="opacity-60">Node: {selectedItem || menuItems[activeIndex]}</p>
        </div>

        <div className="hidden md:block text-right font-secondary text-[8px] uppercase tracking-[0.2em] text-gray-600 opacity-40 pr-[260px]">
          <p>Sector: {stats.x > 0 ? 'Alpha' : 'Beta'} / {stats.y > 0 ? 'North' : 'South'}</p>
          <p>Local: {stats.x.toFixed(2)} : {stats.y.toFixed(2)}</p>
        </div>
      </footer>
    </div>
  );
};

export default UIOverlay;
