
import React, { useState, useEffect } from 'react';
import MetaballsScene from './components/MetaballsScene';
import UIOverlay from './components/UIOverlay';
import { INITIAL_SETTINGS, SLIDER_ITEMS_DEFAULT } from './constants';
import { Settings } from './types';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [stats, setStats] = useState({ fps: 0 });
  const [config, setConfig] = useState<Settings>({ ...INITIAL_SETTINGS });
  const [navItems, setNavItems] = useState<{ label: string }[]>([]);
  const [sliderItems, setSliderItems] = useState<{ title: string; desc: string; bg: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const defaultNav = [
        { label: 'tugas today' },
        { label: 'reportan' },
        { label: 'data' },
        { label: 'shift kerja' },
        { label: 'izin keluar' }
      ];
      const defaultSlider = SLIDER_ITEMS_DEFAULT.map(item => ({
        title: item.title,
        desc: item.desc,
        bg: item.bg
      }));

      if (!supabase) {
        setNavItems(defaultNav);
        setSliderItems(defaultSlider);
        setLoading(false);
        return;
      }

      try {
        const fetchUI = async () => {
          const [navResponse, sliderResponse] = await Promise.all([
            supabase.from('navbar_items').select('label').order('order_index', { ascending: true }),
            supabase.from('slider_items').select('title, description, bg_image').order('order_index', { ascending: true })
          ]);
          
          if (navResponse.data && navResponse.data.length > 0) setNavItems(navResponse.data);
          else setNavItems(defaultNav);

          if (sliderResponse.data && sliderResponse.data.length > 0) {
            setSliderItems(sliderResponse.data.map(item => ({
              title: item.title,
              desc: item.description,
              bg: item.bg_image
            })));
          } else setSliderItems(defaultSlider);
        };

        await fetchUI();

        // Realtime sync for UI config
        const navChannel = supabase.channel('ui-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'navbar_items' }, fetchUI)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'slider_items' }, fetchUI)
          .subscribe();

        setLoading(false);
      } catch (error) {
        console.error('Sync Error:', error);
        setNavItems(defaultNav);
        setSliderItems(defaultSlider);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleUpdateStats = (x: number, y: number, radius: number, merges: number, fps: number) => {
    setStats({ fps });
  };

  const handleUpdateSettings = (newSettings: Settings) => {
    setConfig(newSettings);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#07090d] text-white font-mono tracking-widest overflow-hidden">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">Nexus Engine</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#ff6b35] animate-pulse">Syncing Database...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden selection:bg-[#ff6b35] selection:text-white">
      <MetaballsScene onUpdateStats={handleUpdateStats} onUpdateSettings={handleUpdateSettings} />
      <UIOverlay 
        stats={stats} 
        config={config} 
        navData={navItems} 
        sliderData={sliderItems} 
      />
    </div>
  );
};

export default App;
