
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from '../types';
import { supabase } from '../lib/supabase';

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
}

interface UIOverlayProps {
  stats: {
    fps: number;
  };
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

  const fetchTasks = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTasks(data);
  };

  useEffect(() => {
    if (showTasks) fetchTasks();
  }, [showTasks]);

  const addTask = async () => {
    if (!newTask.trim() || !supabase) return;
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: newTask, is_completed: false }])
      .select();
    
    if (data) {
      setTasks([data[0], ...tasks]);
      setNewTask("");
    }
  };

  const toggleTask = async (task: Task) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !task.is_completed })
      .eq('id', task.id);
    
    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t));
    }
  };

  const deleteTask = async (id: number) => {
    if (!supabase) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks(tasks.filter(t => t.id !== id));
  };

  const items = sliderData.length > 0 ? sliderData : [
    { title: config.slide1Title, bg: config.slide1Bg, desc: "Update harian skor pertandingan." },
    { title: config.slide2Title, bg: config.slide2Bg, desc: "Rekap data togel terpercaya." },
    { title: config.slide3Title, bg: config.slide3Bg, desc: "Layanan verifikasi rekening." },
    { title: config.slide4Title, bg: config.slide4Bg, desc: "Detail hadiah bola." },
    { title: config.slide5Title, bg: config.slide5Bg, desc: "Detail hadiah togel." }
  ];

  const navs = navData.length > 0 ? navData : [
    { label: 'tugas today' },
    { label: 'reportan' },
    { label: 'data' },
    { label: 'shift kerja' },
    { label: 'izin keluar' }
  ];

  const centerCard = useCallback((index: number) => {
    if (!trackRef.current || !containerRef.current) return;
    const cards = Array.from(trackRef.current.children) as HTMLElement[];
    const card = cards[index];
    if (!card) return;

    const wrap = containerRef.current;
    const mobile = window.innerWidth < 768;
    const axis = mobile ? "top" : "left";
    const size = mobile ? wrap.clientHeight : wrap.clientWidth;
    const start = mobile ? card.offsetTop : card.offsetLeft;
    const cardSize = mobile ? card.clientHeight : card.clientWidth;

    wrap.scrollTo({
      [axis]: start - (mobile ? (size / 2 - cardSize / 2) : 0),
      behavior: "smooth"
    });
  }, []);

  const activate = (index: number) => {
    if (index === activeIdx) return;
    setActiveIdx(index);
    centerCard(index);
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: '2-digit', month: 'short' };
    const dateStr = d.toLocaleDateString('id-ID', options);
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} | ${timeStr}`;
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-4 z-10 pointer-events-none">
      <nav className="nexus-nav pointer-events-auto">
        <ul className="nav-links">
          {navs.map((item, i) => (
            <li key={i}>
              <a onClick={() => item.label.toLowerCase().includes('tugas') ? setShowTasks(true) : null}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Modern Task Modal */}
      <div className={`task-modal ${showTasks ? 'open' : ''}`} onClick={() => setShowTasks(false)}>
        <div className="task-container font-primary pointer-events-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white uppercase">Management Tugas</h2>
              <p className="opacity-40 text-[9px] uppercase tracking-widest font-secondary mt-1">Rekap Aktivitas Harian Nexus</p>
            </div>
            <button onClick={() => setShowTasks(false)} className="hover:rotate-90 transition-transform duration-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Input tugas baru..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-[#ff6b35] transition-all text-white"
            />
            <button 
              onClick={addTask}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#ff6b35] p-2 rounded-lg hover:scale-110 active:scale-90 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>

          <div className="task-list flex-1">
            {tasks.length === 0 ? (
              <div className="text-center py-20 opacity-20 uppercase text-[10px] tracking-widest">Belum ada history tugas</div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className={`task-item group ${task.is_completed ? 'completed' : ''}`}>
                  <div 
                    className={`custom-checkbox ${task.is_completed ? 'checked' : ''}`}
                    onClick={() => toggleTask(task)}
                  >
                    {task.is_completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <div className="flex-1" onClick={() => toggleTask(task)}>
                    <div className="task-text text-sm font-medium text-white/90 mb-1">{task.title}</div>
                    <div className="text-[9px] opacity-40 uppercase tracking-tighter font-secondary">
                      {formatDateTime(task.created_at)}
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <section className="slider-section pointer-events-auto">
        <div className="slider-container" ref={containerRef}>
          <div className="slider-track" ref={trackRef}>
            {items.map((item, idx) => (
              <article 
                key={idx} 
                className="project-card"
                data-active={idx === activeIdx}
                onClick={() => activate(idx)}
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
          {items.map((_, idx) => (
            <span key={idx} className={`dot ${idx === activeIdx ? 'active' : ''}`} onClick={() => activate(idx)} />
          ))}
        </div>
      </section>

      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-1 opacity-20">
        <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-[0.3em] text-white/60">
          FPS: {stats.fps}
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
