import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from '../types';

interface UIOverlayProps {
  stats: {
    fps: number;
  };
  config: Settings;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ stats, config }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Map settings to slider items array
  const sliderItems = [
    { title: config.slide1Title, bg: config.slide1Bg, desc: "Update harian skor dan analisa pertandingan bola." },
    { title: config.slide2Title, bg: config.slide2Bg, desc: "Rekap data dan prediksi angka togel terpercaya." },
    { title: config.slide3Title, bg: config.slide3Bg, desc: "Layanan verifikasi rekening untuk keamanan transaksi." },
    { title: config.slide4Title, bg: config.slide4Bg, desc: "Informasi detail mengenai hadiah kemenangan bola." },
    { title: config.slide5Title, bg: config.slide5Bg, desc: "Daftar rincian hadiah untuk pemenang togel." }
  ];

  const isMobile = useCallback(() => {
    return window.matchMedia("(max-width:767px)").matches;
  }, []);

  const centerCard = useCallback((index: number) => {
    if (!trackRef.current || !containerRef.current) return;
    const cards = Array.from(trackRef.current.children) as HTMLElement[];
    const card = cards[index];
    if (!card) return;

    const wrap = containerRef.current;
    const mobile = isMobile();
    const axis = mobile ? "top" : "left";
    const size = mobile ? wrap.clientHeight : wrap.clientWidth;
    const start = mobile ? card.offsetTop : card.offsetLeft;
    const cardSize = mobile ? card.clientHeight : card.clientWidth;

    wrap.scrollTo({
      [axis]: start - (mobile ? (size / 2 - cardSize / 2) : 0),
      behavior: "smooth"
    });
  }, [isMobile]);

  const activate = (index: number) => {
    if (index === activeIdx) return;
    setActiveIdx(index);
    centerCard(index);
  };

  useEffect(() => {
    const handleResize = () => centerCard(activeIdx);
    window.addEventListener('resize', handleResize);
    
    const timeout = setTimeout(() => centerCard(activeIdx), 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [activeIdx, centerCard]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-4 z-10 pointer-events-none">
      {/* Navbar */}
      <nav className="nexus-nav pointer-events-auto">
        <ul className="nav-links">
          <li><a href="#">tugas today</a></li>
          <li><a href="#">reportan</a></li>
          <li><a href="#">data</a></li>
          <li><a href="#">shift kerja</a></li>
          <li><a href="#">izin keluar</a></li>
        </ul>
      </nav>

      <section className="slider-section pointer-events-auto">
        {/* Removed slider-head containing nav buttons */}
        
        <div className="slider-container" ref={containerRef}>
          <div className="slider-track" ref={trackRef}>
            {sliderItems.map((item, idx) => (
              <article 
                key={idx} 
                className="project-card"
                data-active={idx === activeIdx}
                onClick={() => activate(idx)}
                onMouseEnter={() => !isMobile() && activate(idx)}
              >
                <img className="project-card__bg" src={item.bg} alt="" />
                <div className="project-card__content">
                  <div className="project-card__info">
                    <h3 className="project-card__title">{item.title}</h3>
                    <p className="project-card__desc">{item.desc}</p>
                    <button className="project-card__btn">Details</button>
                  </div>
                  {idx !== activeIdx && (
                    <h3 className="project-card__title">{item.title}</h3>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="dots">
          {sliderItems.map((_, idx) => (
            <span 
              key={idx} 
              className={`dot ${idx === activeIdx ? 'active' : ''}`}
              onClick={() => activate(idx)}
            />
          ))}
        </div>
      </section>

      {/* Floating System Stats */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-1 opacity-20 hover:opacity-100 transition-opacity">
        <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-[0.3em] text-white/60">
          FPS: {stats.fps}
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;