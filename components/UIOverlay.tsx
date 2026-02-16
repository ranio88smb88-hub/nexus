
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from '../types';
import { supabase } from '../lib/supabase';

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
}

interface Report {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface DataLogin {
  id: number;
  email: string;
  login_type: 'BK' | 'ADMIN' | 'POWER' | 'GMAIL';
  created_at: string;
}

interface DataStaff {
  id: number;
  name: string;
  passport: string;
  room: string;
  email: string;
  created_at: string;
}

interface DataOthers {
  id: number;
  email: string;
  login_type: string;
  created_at: string;
}

interface ShiftWork {
  id: number;
  staff_name: string;
  shift_in: string;
  shift_out: string;
  total_hours: string;
  created_at: string;
}

interface Permission {
  id: number;
  staff_name: string;
  type: 'KELUAR' | 'MAKAN';
  start_time: string;
  end_time: string;
  status: 'ACTIVE' | 'COMPLETED';
}

interface UIOverlayProps {
  stats: { fps: number };
  config: Settings;
  navData: { label: string }[];
  sliderData: { title: string; desc: string; bg: string }[];
}

const UIOverlay: React.FC<UIOverlayProps> = ({ stats, config, navData, sliderData }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  
  // Modal States
  const [showTasks, setShowTasks] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [activeDataTab, setActiveDataTab] = useState<'login' | 'staff' | 'others'>('login');

  // Lists States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [logins, setLogins] = useState<DataLogin[]>([]);
  const [staffs, setStaffs] = useState<DataStaff[]>([]);
  const [others, setOthers] = useState<DataOthers[]>([]);
  const [shifts, setShifts] = useState<ShiftWork[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Input States
  const [newTask, setNewTask] = useState("");
  const [newReportTitle, setNewReportTitle] = useState("");
  const [newReportDesc, setNewReportDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Data Login Inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginType, setLoginType] = useState<'BK' | 'ADMIN' | 'POWER' | 'GMAIL'>('BK');

  // Data Staff Inputs
  const [staffNameInput, setStaffNameInput] = useState("");
  const [staffPassport, setStaffPassport] = useState("");
  const [staffRoom, setStaffRoom] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  // Shift Kerja Inputs
  const [shiftStaffName, setShiftStaffName] = useState("");
  const [shiftIn, setShiftIn] = useState("");
  const [shiftOut, setShiftOut] = useState("");

  // Izin Keluar Inputs
  const [selectedStaffIzin, setSelectedStaffIzin] = useState("");
  const [now, setNow] = useState(new Date());

  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const menuItems = navData?.length > 0 ? navData : [
    { label: 'tugas today' },
    { label: 'reportan' },
    { label: 'data' },
    { label: 'shift kerja' },
    { label: 'izin keluar' }
  ];

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async (table: string, setter: any) => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      if (data) setter(data);
    } catch (err) { console.error(`Error fetch ${table}:`, err); }
  };

  useEffect(() => {
    if (showTasks) fetchData('tasks', setTasks);
    if (showReports) fetchData('reports', setReports);
    if (showDataModal) {
      fetchData('data_login', setLogins);
      fetchData('data_staff', setStaffs);
      fetchData('data_others', setOthers);
    }
    if (showShiftModal) fetchData('shift_kerja', setShifts);
    if (showIzinModal) {
      fetchData('shift_kerja', setShifts);
      fetchData('permissions', setPermissions);
    }
  }, [showTasks, showReports, showDataModal, showShiftModal, showIzinModal]);

  const addItem = async (table: string, payload: any, setter: any, clearInputs: () => void) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from(table).insert([payload]).select();
      if (error) throw error;
      if (data) {
        setter((prev: any) => [data[0], ...prev]);
        clearInputs();
      }
    } catch (err) { console.error(`Error add to ${table}:`, err); }
  };

  const deleteItem = async (table: string, id: number, setter: any) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      setter((prev: any) => prev.filter((i: any) => i.id !== id));
    } catch (err) { console.error(`Error delete from ${table}:`, err); }
  };

  const startIzin = async (type: 'KELUAR' | 'MAKAN') => {
    if (!selectedStaffIzin || !supabase) return;
    const anyActive = permissions.some(p => p.status === 'ACTIVE');
    if (anyActive) {
      alert("Sistem Terkunci: Masih ada personel di luar.");
      return;
    }
    const today = new Date().toDateString();
    const staffHistory = permissions.filter(p => p.staff_name === selectedStaffIzin && new Date(p.start_time).toDateString() === today);
    const count = staffHistory.filter(p => p.type === type).length;
    const limit = type === 'KELUAR' ? 4 : 3;
    if (count >= limit) {
      alert(`Jatah hari ini habis (${limit}x).`);
      return;
    }
    const durationMinutes = type === 'KELUAR' ? 15 : 7;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    await addItem('permissions', {
      staff_name: selectedStaffIzin,
      type: type,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'ACTIVE'
    }, setPermissions, () => {});
  };

  const checkAutoExpiry = useCallback(async () => {
    const active = permissions.filter(p => p.status === 'ACTIVE');
    for (const p of active) {
      if (new Date(p.end_time) <= new Date()) {
        await supabase?.from('permissions').update({ status: 'COMPLETED' }).eq('id', p.id);
        setPermissions(prev => prev.map(item => item.id === p.id ? { ...item, status: 'COMPLETED' as const } : item));
      }
    }
  }, [permissions]);

  useEffect(() => {
    const check = setInterval(checkAutoExpiry, 5000);
    return () => clearInterval(check);
  }, [checkAutoExpiry]);

  const getTimerString = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const diff = end - now.getTime();
    if (diff <= 0) return "EXPIRED";
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const activate = (index: number) => {
    setActiveIdx(index);
    if (!trackRef.current || !containerRef.current) return;
    const cards = Array.from(trackRef.current.children) as HTMLElement[];
    const card = cards[index];
    if (card) containerRef.current.scrollTo({ left: card.offsetLeft - (window.innerWidth < 768 ? 20 : 100), behavior: "smooth" });
  };

  return (
    <div className="ui-overlay-root">
      {/* Navigation Layer */}
      <nav className="fixed top-0 left-0 w-full p-6 md:p-12 flex justify-start items-center z-[500] pointer-events-auto">
        <ul className="flex gap-6 md:gap-12 list-none m-0 p-0 overflow-x-auto no-scrollbar">
          {menuItems.map((item, i) => (
            <li key={i} className="flex-shrink-0">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const label = item.label.toLowerCase();
                  if (label.includes('tugas')) setShowTasks(true);
                  else if (label.includes('reportan')) setShowReports(true);
                  else if (label.includes('data')) setShowDataModal(true);
                  else if (label.includes('shift')) setShowShiftModal(true);
                  else if (label.includes('izin')) setShowIzinModal(true);
                }}
                className="font-primary text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-white/40 hover:text-[#ff6b35] transition-all cursor-pointer bg-transparent border-none outline-none interactable"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* IZIN KELUAR MODAL - Refined Spacing */}
      {showIzinModal && (
        <div className="task-modal-overlay" onClick={() => setShowIzinModal(false)}>
          <div 
            className="w-[95vw] max-w-[1100px] bg-black/60 border border-white/10 rounded-[3rem] p-8 md:p-12 max-h-[92vh] flex flex-col shadow-2xl interactable backdrop-blur-3xl" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-primary font-bold text-white uppercase tracking-tighter">Exit Authorization</h2>
                <p className="opacity-30 text-[9px] uppercase tracking-[0.4em] mt-2 font-secondary text-[#ff6b35]">Protocol Active Monitoring</p>
              </div>
              <button onClick={() => setShowIzinModal(false)} className="bg-white/5 hover:bg-white/10 p-4 rounded-full transition-all interactable">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden flex-1">
              {/* Left Side: Controls */}
              <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
                <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6">
                  <label className="text-[9px] uppercase text-white/30 block mb-3 font-secondary tracking-widest">Select Personnel</label>
                  <select 
                    value={selectedStaffIzin} onChange={e => setSelectedStaffIzin(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white font-primary interactable appearance-none mb-8 text-sm focus:border-[#ff6b35] outline-none"
                  >
                    <option value="">CHOOSE STAFF...</option>
                    {shifts.map(s => <option key={s.id} value={s.staff_name}>{s.staff_name}</option>)}
                  </select>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => startIzin('KELUAR')} 
                      disabled={!selectedStaffIzin || permissions.some(p => p.status === 'ACTIVE')} 
                      className="w-full bg-white hover:bg-[#ff6b35] text-black hover:text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] interactable transition-all disabled:opacity-10"
                    >
                      Execute Exit (15m)
                    </button>
                    <button 
                      onClick={() => startIzin('MAKAN')} 
                      disabled={!selectedStaffIzin || permissions.some(p => p.status === 'ACTIVE')} 
                      className="w-full border border-white/20 hover:border-white text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] interactable transition-all disabled:opacity-10"
                    >
                      Execute Meal (7m)
                    </button>
                  </div>
                </div>

                <div className={`p-8 rounded-[2rem] border transition-all text-center flex-shrink-0 ${permissions.some(p => p.status === 'ACTIVE') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-[#ff6b35]/5 border-[#ff6b35]/10 text-white'}`}>
                  <div className="text-[9px] uppercase tracking-[0.4em] mb-3 opacity-50">System Status</div>
                  <div className="font-primary text-xl font-bold uppercase tracking-widest">
                    {permissions.some(p => p.status === 'ACTIVE') ? 'GATE BUSY' : 'READY'}
                  </div>
                </div>
              </div>

              {/* Right Side: List */}
              <div className="lg:col-span-8 flex flex-col overflow-hidden bg-white/[0.01] rounded-[2rem] border border-white/5 p-2">
                <div className="flex-1 overflow-y-auto task-list p-6 space-y-4">
                  {permissions.length > 0 ? (
                    permissions.map(p => (
                      <div key={p.id} className={`p-8 rounded-[2rem] border transition-all ${p.status === 'ACTIVE' ? 'bg-[#ff6b35]/10 border-[#ff6b35]/30' : 'bg-white/[0.02] border-white/5 opacity-40'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className={`text-[8px] px-3 py-1 rounded-full font-bold uppercase tracking-[0.2em] mb-3 inline-block ${p.type === 'KELUAR' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#ff6b35]/20 text-[#ff6b35]'}`}>
                              {p.type} PROTOCOL
                            </div>
                            <h4 className="text-2xl font-primary font-bold text-white tracking-tight">{p.staff_name}</h4>
                          </div>
                          {p.status === 'ACTIVE' && (
                            <div className="text-right">
                              <div className="text-[9px] uppercase tracking-widest text-[#ff6b35] mb-1 font-secondary">T-Minus</div>
                              <div className="text-4xl font-mono font-bold text-white tabular-nums">{getTimerString(p.end_time)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                      <p className="uppercase tracking-[0.8em] mt-6 text-[10px]">No Active Records</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TASKS MODAL */}
      {showTasks && (
        <div className="task-modal-overlay" onClick={() => setShowTasks(false)}>
          <div className="w-[90vw] max-w-[650px] bg-black/80 border border-white/10 rounded-[3rem] p-10 max-h-[85vh] flex flex-col shadow-2xl interactable backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl font-primary font-bold text-white uppercase tracking-tight">Tugas Today</h2>
              <button onClick={() => setShowTasks(false)} className="bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all interactable">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <input 
              type="text" placeholder="Entri tugas baru..." value={newTask} 
              onChange={(e) => setNewTask(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && addItem('tasks', { title: newTask, is_completed: false }, setTasks, () => setNewTask(""))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 mb-8 text-white font-primary text-lg interactable focus:border-[#ff6b35] outline-none"
            />
            <div className="task-list flex-1 overflow-y-auto pr-2 space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-6 p-6 rounded-[1.5rem] border border-white/5 bg-white/[0.03]">
                  <div 
                    className={`w-7 h-7 border-2 rounded-lg cursor-pointer flex items-center justify-center transition-all interactable ${task.is_completed ? 'bg-[#ff6b35] border-[#ff6b35]' : 'border-white/20'}`} 
                    onClick={async () => {
                      if (!supabase) return;
                      await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', task.id);
                      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t));
                    }}
                  >
                    {task.is_completed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <div className={`flex-1 font-primary text-white text-lg ${task.is_completed ? 'line-through opacity-30' : ''}`}>{task.title}</div>
                  <button onClick={() => deleteItem('tasks', task.id, setTasks)} className="p-2 hover:bg-red-500/10 rounded-lg interactable transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHIFT KERJA MODAL */}
      {showShiftModal && (
        <div className="task-modal-overlay" onClick={() => setShowShiftModal(false)}>
          <div className="w-[95vw] max-w-[850px] bg-black/80 border border-white/10 rounded-[3rem] p-10 max-h-[85vh] flex flex-col shadow-2xl interactable backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl font-primary font-bold text-white uppercase tracking-tighter">Shift Kerja</h2>
              <button onClick={() => setShowShiftModal(false)} className="bg-white/5 hover:bg-white/10 p-4 rounded-full transition-all interactable">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
              <input placeholder="Staff Name" value={shiftStaffName} onChange={e => setShiftStaffName(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white interactable text-sm" />
              <input type="time" value={shiftIn} onChange={e => setShiftIn(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white interactable text-sm" />
              <input type="time" value={shiftOut} onChange={e => setShiftOut(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white interactable text-sm" />
              <button onClick={() => addItem('shift_kerja', { staff_name: shiftStaffName, shift_in: shiftIn, shift_out: shiftOut }, setShifts, () => setShiftStaffName(""))} className="bg-[#ff6b35] hover:bg-white text-white hover:text-black py-4 rounded-xl transition-all font-bold text-[11px] tracking-widest interactable">ADD</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {shifts.map(s => (
                <div key={s.id} className="grid grid-cols-4 items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="text-white font-primary font-bold">{s.staff_name}</div>
                  <div className="text-white/40 text-[9px] uppercase font-secondary">IN: {s.shift_in}</div>
                  <div className="text-white/40 text-[9px] uppercase font-secondary">OUT: {s.shift_out}</div>
                  <button onClick={() => deleteItem('shift_kerja', s.id, setShifts)} className="justify-self-end text-red-500/40 hover:text-red-500 interactable"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Slider Section */}
      <section className="slider-section">
        <div className="slider-container" ref={containerRef}>
          <div className="slider-track" ref={trackRef}>
            {sliderData.map((item, idx) => (
              <article key={idx} className="project-card interactable" data-active={idx === activeIdx} style={{ flexBasis: idx === activeIdx ? 'var(--open)' : 'var(--closed)' }} onClick={() => activate(idx)}>
                <img className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 pointer-events-none ${idx === activeIdx ? 'opacity-40 scale-100' : 'opacity-10 scale-110 grayscale'}`} src={item.bg} alt="" />
                <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-12 text-center pointer-events-none">
                  {idx === activeIdx ? (
                    <div className="animate-in fade-in zoom-in-95 duration-1000 flex flex-col items-center">
                      <h3 className="text-4xl md:text-6xl font-primary font-bold text-white uppercase tracking-tighter mb-6">{item.title}</h3>
                      <p className="text-white/60 max-w-sm font-primary mb-10 text-lg md:text-xl leading-relaxed">{item.desc}</p>
                      <button className="px-10 py-4 rounded-full border border-white/20 bg-white/5 text-white uppercase text-[10px] font-bold tracking-[0.3em] hover:bg-white hover:text-black transition-all interactable">Enter Protocol</button>
                    </div>
                  ) : (
                    <h3 className="text-lg md:text-xl font-primary font-bold text-white/30 uppercase tracking-[0.4em] writing-vertical rotate-180 transform">{item.title}</h3>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-6 right-6 opacity-20 font-mono text-[8px] uppercase tracking-[0.4em] text-white pointer-events-none z-[100]">
        System Active // {stats.fps} FPS
      </div>
    </div>
  );
};

export default UIOverlay;
