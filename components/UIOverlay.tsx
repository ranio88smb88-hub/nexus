
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
  actual_end_time?: string;
  status: 'ACTIVE' | 'COMPLETED';
  penalty?: string;
}

interface UIOverlayProps {
  stats: { fps: number };
  config: Settings;
  navData: { label: string }[];
  sliderData: { title: string; desc: string; bg: string }[];
}

const UIOverlay: React.FC<UIOverlayProps> = ({ stats, config, navData, sliderData }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLive, setIsLive] = useState(false);
  
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
  const [shifts, setShifts] = useState<ShiftWork[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Input States
  const [newTask, setNewTask] = useState("");
  const [newReportTitle, setNewReportTitle] = useState("");
  const [newReportDesc, setNewReportDesc] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginType, setLoginType] = useState<'BK' | 'ADMIN' | 'POWER' | 'GMAIL'>('BK');
  const [staffNameInput, setStaffNameInput] = useState("");
  const [staffPassport, setStaffPassport] = useState("");
  const [staffRoom, setStaffRoom] = useState("");
  const [shiftStaffName, setShiftStaffName] = useState("");
  const [shiftIn, setShiftIn] = useState("");
  const [shiftOut, setShiftOut] = useState("");
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

  const saveToLocal = (table: string, data: any) => {
    localStorage.setItem(`nexus_cache_${table}`, JSON.stringify(data));
  };

  const getFromLocal = (table: string) => {
    const cached = localStorage.getItem(`nexus_cache_${table}`);
    return cached ? JSON.parse(cached) : [];
  };

  // REALTIME SYNC LOGIC
  useEffect(() => {
    const tables = ['tasks', 'reports', 'data_login', 'data_staff', 'shift_kerja', 'permissions'];
    setIsLive(!!supabase);

    if (supabase) {
      tables.forEach(table => {
        const setter = 
          table === 'tasks' ? setTasks :
          table === 'reports' ? setReports :
          table === 'data_login' ? setLogins :
          table === 'data_staff' ? setStaffs :
          table === 'shift_kerja' ? setShifts :
          setPermissions;

        // Fetch fresh data
        const fetchLatest = async () => {
          const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false });
          if (data) {
            setter(data);
            saveToLocal(table, data);
          }
        };

        fetchLatest();

        // Subscribe with unique channel name and proper schema config
        const channel = supabase
          .channel(`db-changes-${table}-${Math.random()}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: table },
            () => {
              console.log(`Syncing ${table}...`);
              fetchLatest();
            }
          )
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      });
    } else {
      // Fallback to local
      tables.forEach(table => {
        const cached = getFromLocal(table);
        const setter = table === 'tasks' ? setTasks : table === 'reports' ? setReports : table === 'data_login' ? setLogins : table === 'data_staff' ? setStaffs : table === 'shift_kerja' ? setShifts : setPermissions;
        if (cached.length > 0) setter(cached);
      });
    }
  }, []);

  const addItem = async (table: string, payload: any, setter: any, clearInputs: () => void) => {
    if (supabase) {
      const { error } = await supabase.from(table).insert([payload]);
      if (error) {
        console.error("DB Error:", error.message);
        alert("Gagal simpan ke database. Pastikan tabel sudah dibuat.");
      }
    } else {
      const newItem = { ...payload, id: Date.now(), created_at: new Date().toISOString() };
      setter((prev: any) => {
        const next = [newItem, ...prev];
        saveToLocal(table, next);
        return next;
      });
    }
    clearInputs();
  };

  const deleteItem = async (table: string, id: number, setter: any) => {
    if (supabase) {
      await supabase.from(table).delete().eq('id', id);
    } else {
      setter((prev: any) => {
        const next = prev.filter((i: any) => i.id !== id);
        saveToLocal(table, next);
        return next;
      });
    }
  };

  const clockIn = async (permissionId: number) => {
    const permission = permissions.find(p => p.id === permissionId);
    if (!permission) return;

    const returnTime = new Date();
    const scheduledEnd = new Date(permission.end_time);
    let penaltyString = "ON TIME";

    if (returnTime > scheduledEnd) {
      const diffMs = returnTime.getTime() - scheduledEnd.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      penaltyString = `LATE ${diffMins}:${diffSecs < 10 ? '0' : ''}${diffSecs}`;
    }

    const updatedData = { 
      status: 'COMPLETED' as const, 
      actual_end_time: returnTime.toISOString(),
      penalty: penaltyString 
    };

    if (supabase) {
      await supabase.from('permissions').update(updatedData).eq('id', permissionId);
    } else {
      setPermissions(prev => {
        const next = prev.map(p => p.id === permissionId ? { ...p, ...updatedData } : p);
        saveToLocal('permissions', next);
        return next;
      });
    }
  };

  const getTimerString = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const diff = end - now.getTime();
    if (diff <= 0) {
      const over = Math.abs(diff);
      const mins = Math.floor(over / 60000);
      const secs = Math.floor((over % 60000) / 1000);
      return `-${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
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

  const activeProtocol = permissions.find(p => p.status === 'ACTIVE');

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

      {/* MODALS (Semua modal tetap sama logicnya) */}
      {/* IZIN KELUAR MODAL */}
      {showIzinModal && (
        <div className="task-modal-overlay" onClick={() => setShowIzinModal(false)}>
          <div className="w-[95vw] max-w-[1100px] bg-black/60 border border-white/10 rounded-[3.5rem] p-8 md:p-14 max-h-[92vh] flex flex-col shadow-2xl interactable backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-3xl md:text-5xl font-primary font-bold text-white uppercase tracking-tighter">Exit Authorization</h2>
                <p className="opacity-30 text-[9px] uppercase tracking-[0.4em] mt-3 font-secondary text-[#ff6b35]">Protocol Monitor</p>
              </div>
              <button onClick={() => setShowIzinModal(false)} className="bg-white/5 hover:bg-white/10 p-5 rounded-full transition-all interactable">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-hidden flex-1">
              <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
                {!activeProtocol ? (
                  <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8">
                    <select value={selectedStaffIzin} onChange={e => setSelectedStaffIzin(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white font-primary interactable mb-8 text-sm focus:border-[#ff6b35] outline-none">
                      <option value="">CHOOSE STAFF...</option>
                      {shifts.map(s => <option key={s.id} value={s.staff_name}>{s.staff_name}</option>)}
                    </select>
                    <div className="flex flex-col gap-4">
                      <button onClick={() => {
                         const start = new Date();
                         const end = new Date(start.getTime() + 15 * 60000);
                         addItem('permissions', { staff_name: selectedStaffIzin, type: 'KELUAR', start_time: start.toISOString(), end_time: end.toISOString(), status: 'ACTIVE' }, setPermissions, () => {});
                      }} disabled={!selectedStaffIzin} className="w-full bg-white hover:bg-[#ff6b35] text-black hover:text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] interactable transition-all">Execute Exit (15m)</button>
                      <button onClick={() => {
                         const start = new Date();
                         const end = new Date(start.getTime() + 7 * 60000);
                         addItem('permissions', { staff_name: selectedStaffIzin, type: 'MAKAN', start_time: start.toISOString(), end_time: end.toISOString(), status: 'ACTIVE' }, setPermissions, () => {});
                      }} disabled={!selectedStaffIzin} className="w-full border border-white/20 hover:border-white text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] interactable transition-all">Execute Meal (7m)</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-[2.5rem] p-8 flex flex-col gap-6">
                     <div className="text-center">
                        <div className="text-[9px] uppercase tracking-[0.4em] text-[#ff6b35] mb-2">Ongoing Protocol</div>
                        <div className="text-2xl font-primary font-bold text-white">{activeProtocol.staff_name}</div>
                     </div>
                     <button onClick={() => clockIn(activeProtocol.id)} className="w-full bg-[#ff6b35] hover:bg-white text-white hover:text-black py-8 rounded-2xl font-bold uppercase text-[12px] tracking-[0.4em] interactable transition-all">Clock In / Return</button>
                  </div>
                )}
              </div>
              <div className="lg:col-span-8 flex flex-col overflow-hidden bg-white/[0.01] rounded-[2.5rem] border border-white/5 p-4">
                <div className="flex-1 overflow-y-auto task-list p-4 space-y-4">
                  {permissions.map(p => (
                    <div key={p.id} className={`p-8 rounded-[2.5rem] border transition-all ${p.status === 'ACTIVE' ? 'bg-[#ff6b35]/10 border-[#ff6b35]/30' : 'bg-white/[0.02] border-white/5 opacity-40'}`}>
                      <div className="flex justify-between items-center">
                        <div><div className="flex items-center gap-3 mb-4"><div className={`text-[8px] px-3 py-1 rounded-full font-bold uppercase tracking-[0.2em] ${p.type === 'KELUAR' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#ff6b35]/20 text-[#ff6b35]'}`}>{p.type}</div>{p.penalty && <div className="text-[8px] text-red-400 font-bold">{p.penalty}</div>}</div><h4 className="text-3xl font-primary font-bold text-white">{p.staff_name}</h4></div>
                        {p.status === 'ACTIVE' && <div className="text-4xl font-mono font-bold text-white tabular-nums">{getTimerString(p.end_time)}</div>}
                      </div>
                    </div>
                  ))}
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
              <button onClick={() => setShowTasks(false)} className="bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all interactable"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <div className="flex gap-4 mb-8">
              <input type="text" placeholder="Entri tugas baru..." value={newTask} onChange={(e) => setNewTask(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-white font-primary text-lg interactable focus:border-[#ff6b35] outline-none" />
              <button onClick={() => { if(!newTask.trim()) return; addItem('tasks', { title: newTask, is_completed: false }, setTasks, () => setNewTask("")); }} className="bg-[#ff6b35] hover:bg-white text-white hover:text-black px-10 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all interactable">SAVE</button>
            </div>
            <div className="task-list flex-1 overflow-y-auto pr-2 space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-6 p-6 rounded-[1.5rem] border border-white/5 bg-white/[0.03]">
                  <div className={`w-7 h-7 border-2 rounded-lg cursor-pointer flex items-center justify-center transition-all interactable ${task.is_completed ? 'bg-[#ff6b35] border-[#ff6b35]' : 'border-white/20'}`} onClick={async () => { 
                      if (supabase) await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', task.id);
                  }}>{task.is_completed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}</div>
                  <div className={`flex-1 font-primary text-white text-lg ${task.is_completed ? 'line-through opacity-30' : ''}`}>{task.title}</div>
                  <button onClick={() => deleteItem('tasks', task.id, setTasks)} className="p-2 hover:bg-red-500/10 rounded-lg interactable"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main UI Elements */}
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

      {/* Status Indicators */}
      <div className="fixed bottom-6 right-6 flex items-center gap-6 z-[100] pointer-events-none">
        <div className="flex flex-col items-end gap-1 opacity-40">
           <div className="flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
             <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white">{isLive ? 'LIVE CLOUD' : 'LOCAL MODE'}</span>
           </div>
           <div className="font-mono text-[8px] uppercase tracking-[0.4em] text-white">System Active // {stats.fps} FPS</div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
