
import React, { useState } from 'react';
import MetaballsScene from './components/MetaballsScene';
import UIOverlay from './components/UIOverlay';
import { INITIAL_SETTINGS } from './constants';
import { Settings } from './types';

const App: React.FC = () => {
  const [stats, setStats] = useState({ fps: 0 });
  const [config, setConfig] = useState<Settings>({ ...INITIAL_SETTINGS });

  const handleUpdateStats = (x: number, y: number, radius: number, merges: number, fps: number) => {
    setStats({ fps });
  };

  const handleUpdateSettings = (newSettings: Settings) => {
    setConfig(newSettings);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden selection:bg-white selection:text-black">
      {/* Immersive Background Scene with Settings UI */}
      <MetaballsScene onUpdateStats={handleUpdateStats} onUpdateSettings={handleUpdateSettings} />
      
      {/* Functional UI Overlay with Dynamic Slider Content */}
      <UIOverlay stats={stats} config={config} />
    </div>
  );
};

export default App;
