
import React, { useState, useEffect, useCallback, useRef, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { Settings } from '../types';
import { supabase } from '../lib/supabase';

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
}

interface UIOverlayProps {
  stats: { fps: number };
  config: Settings;
  navData: { label: string }[];
  sliderData: { title: string; desc: string; bg: string }[];
}

const UIOverlay: React.FC<UIOverlayProps> = ({ stats, config, navData, sliderData }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTasksCount = tasks.filter(t => !t.is_completed).length;

  const fetchTasks = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (data) setTasks(data);
    } catch (err) {
      console.error("Gagal mengambil data tugas:", err);
    }
  };

  useEffect(() => {
    if (showTasks) fetchTasks();
  }, [showTasks]);

  const addTask = async () => {
    if (!newTask.trim() || !supabase) return;
    try {
      const { data, error } = await supabase.from('tasks').insert([{ title: newTask, is_completed: false }]).select();
      if (error) throw error;
      if (data) { 
        setTasks(prev => [data[0], ...prev]); 
        setNewTask(""); 
      }
    } catch (err) {
      console.error("Gagal menambah tugas:", err);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', task.id);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t));
    } catch (err) {
      console.error("Gagal memperbarui tugas:", err);
    }
  };

  const deleteTask = async (id: number) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Gagal menghapus tugas:", err);
    }
  };

  const items = sliderData && sliderData.length > 0 ? sliderData : [
    { title: config.slide1Title, bg: config.slide1Bg, desc: "Update harian skor pertandingan." },
    { title: config.slide2Title, bg: config.slide2Bg, desc: "Rekap data togel terpercaya." },
    { title: config.slide3Title, bg: config.slide3Bg, desc: "Layanan verifikasi rekening." },
    { title: config.slide4Title, bg: config.slide4Bg, desc: "Detail hadiah bola." },
    { title: config.slide5Title, bg: config.slide5Bg, desc: "Detail hadiah togel." }
  ];

  const navs = navData && navData.length > 0 ? navData : [
    { label: 'tugas today' }, { label: 'reportan' }, { label: 'data' }, { label: 'shift kerja' }, { label: 'izin keluar' }
  ];

  const centerCard = useCallback((index: number) => {
    if (!trackRef.current || !containerRef.current) return;
    const cards = Array.from(trackRef.current.children) as HTMLElement[];
    const card = cards[index];
    if (!card) return;
    const wrap = containerRef.current;
    wrap.scrollTo({
      left: card.offsetLeft - (window.innerWidth < 768 ? 20 : 100),
      behavior: "smooth"
    });
  }, []);

  const activate = (index: number) => {
    setActiveIdx(index);
    centerCard(index);
  };

  return (
    <div className="ui-overlay-root">
      {/* Navigation Layer - Harus pointer-events-auto */}
      <nav className="fixed top-0 left-0 w-full p-12 flex justify-start items-center z-[110] pointer-events-auto">
        <ul className="flex gap-12 list-none">
          {navs.map((item, i) => (
            <li key={i}>
              <button 
                onClick={() => item.label.toLowerCase().includes('tugas') ? setShowTasks(true) : undefined}
                className="font-primary text-[10px] uppercase tracking-[0.4em] text-white/40 hover:text-white transition-all cursor-pointer bg-transparent border-none outline-none interactable"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Task Modal Layer */}
      {showTasks && (
        <div className="task-modal-overlay" onClick={() => setShowTasks(false)}>
          <div 
            className="w-full max-w-[650px] bg-black/60 border border-white/10 rounded-[3rem] p-12 max-h-[85vh] flex flex-col shadow-2xl interactable" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-3xl font-primary font-bold text-white uppercase tracking-tight flex items-center gap-4">
                  Tugas Today
                  {activeTasksCount > 0 && <span className="bg-[#ff6b35] text-[11px] px-3 py-1 rounded-full">{activeTasksCount}</span>}
                </h2>
                <p className="opacity-30 text-[9px] uppercase tracking-[0.4em] mt-3 font-secondary">Operational Sync</p>
              </div>
              <button onClick={() => setShowTasks(false)} className="bg-white/5 hover:bg-white/10 p-4 rounded-full transition-all interactable">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="relative mb-10">
              <input 
                type="text" 
                placeholder="Entri tugas baru..." 
                value={newTask} 
                onChange={(e) => setNewTask(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 focus:outline-none focus:border-[#ff6b35] transition-all text-white font-primary text-lg interactable"
              />
            </div>

            <div className="task-list flex-1 overflow-y-auto pr-3">
              {tasks.length === 0 ? (
                <div className="py-20 text-center opacity-20 uppercase text-[10px] tracking-widest font-secondary">Tidak ada tugas aktif</div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="group flex items-center gap-6 p-7 mb-4 rounded-[1.8rem] border border-white/5 bg-white/[0.03] transition-all hover:border-white/20">
                    <div 
                      className={`w-7 h-7 border-2 rounded-xl cursor-pointer flex items-center justify-center transition-all interactable ${task.is_completed ? 'bg-[#ff6b35] border-[#ff6b35]' : 'border-white/20 hover:border-white/50'}`} 
                      onClick={() => toggleTask(task)}
                    >
                      {task.is_completed && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                    <div className={`flex-1 font-primary text-white text-xl tracking-tight ${task.is_completed ? 'line-through opacity-40' : ''}`}>
                      {task.title}
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)} 
                      className="opacity-0 group-hover:opacity-100 p-3 bg-red-500/10 rounded-xl transition-all hover:bg-red-500/20 interactable"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slider Section */}
      <section className="slider-section">
        <div className="slider-container" ref={containerRef}>
          <div className="slider-track" ref={trackRef}>
            {items.map((item, idx) => (
              <article 
                key={idx} 
                className="project-card interactable"
                data-active={idx === activeIdx}
                style={{ flexBasis: idx === activeIdx ? 'var(--open)' : 'var(--closed)' }}
                onClick={() => activate(idx)}
              >
                <img 
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 pointer-events-none ${idx === activeIdx ? 'opacity-40 scale-100' : 'opacity-10 scale-110 grayscale'}`} 
                  src={item.bg} 
                  alt="" 
                />
                <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-12 text-center pointer-events-none">
                  {idx === activeIdx ? (
                    <div className="animate-in fade-in zoom-in-95 duration-1000 flex flex-col items-center">
                      <h3 className="text-6xl font-primary font-bold text-white uppercase tracking-tighter mb-6">{item.title}</h3>
                      <p className="text-white/60 max-w-sm font-primary mb-10 text-xl leading-relaxed">{item.desc}</p>
                      <button className="px-12 py-5 rounded-full border border-white/20 bg-white/5 text-white uppercase text-[11px] font-bold tracking-[0.3em] hover:bg-white hover:text-black transition-all interactable">
                        Enter Protocol
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-xl font-primary font-bold text-white/30 uppercase tracking-[0.4em] writing-vertical rotate-180 transform">{item.title}</h3>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Layer */}
      <div className="fixed bottom-10 right-10 opacity-20 font-mono text-[9px] uppercase tracking-[0.4em] text-white pointer-events-none">
        System Active // {stats.fps} FPS
      </div>
    </div>
  );
};

export default UIOverlay;
