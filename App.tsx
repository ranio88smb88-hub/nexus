
import React, { useState } from 'react';
import MetaballsScene from './components/MetaballsScene';
import UIOverlay from './components/UIOverlay';

const App: React.FC = () => {
  const [stats, setStats] = useState({
    x: 0,
    y: 0,
    radius: 0.1,
    merges: 0,
    fps: 0
  });

  const handleUpdateStats = (x: number, y: number, radius: number, merges: number, fps: number) => {
    setStats({ x, y, radius, merges, fps });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden selection:bg-white selection:text-black bg-[#0f0f0f]">
      {/* Immersive Background Scene */}
      <MetaballsScene onUpdateStats={handleUpdateStats} />
      
      {/* Functional UI Overlay */}
      <UIOverlay stats={stats} />
    </div>
  );
};

export default App;
