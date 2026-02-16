
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

  // Helper to save to local storage if supabase is null
  const saveToLocal = (table: string, data: any) => {
    if (!supabase) {
      localStorage.setItem(`nexus_cache_${table}`, JSON.stringify(data));
    }
  };

  const fetchData = async (table: string, setter: any) => {
    if (!supabase) {
      const cached = localStorage.getItem(`nexus_cache_${table}`);
      if (cached) setter(JSON.parse(cached));
      return;
    }
    try {
      const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      if (data) setter(data);
    } catch (err) { console.error(`Error fetch ${table}:`, err); }
  };

  useEffect(() => {
    fetchData('tasks', setTasks);
    fetchData('reports', setReports);
    fetchData('data_login', setLogins);
    fetchData('data_staff', setStaffs);
    fetchData('shift_kerja', setShifts);
    fetchData('permissions', setPermissions);
  }, [showTasks, showReports, showDataModal, showShiftModal, showIzinModal]);

  const addItem = async (table: string, payload: any, setter: any, clearInputs: () => void) => {
    const tempId = Date.now();
    const newItem = { ...payload, id: tempId, created_at: new Date().toISOString() };

    if (!supabase) {
      setter((prev: any) => {
        const next = [newItem, ...prev];
        saveToLocal(table, next);
        return next;
      });
      clearInputs();
      return;
    }

    try {
      const { data, error } = await supabase.from(table).insert([payload]).select();
      if (error) throw error;
      if (data) {
        setter((prev: any) => [data[0], ...prev]);
        clearInputs();
      }
    } catch (err) { 
      setter((prev: any) => {
        const next = [newItem, ...prev];
        saveToLocal(table, next);
        return next;
      });
      clearInputs();
    }
  };

  const deleteItem = async (table: string, id: number, setter: any) => {
    setter((prev: any) => {
      const next = prev.filter((i: any) => i.id !== id);
      saveToLocal(table, next);
      return next;
    });
    if (!supabase) return;
    try { await supabase.from(table).delete().eq('id', id); } catch (err) {}
  };

  const startIzin = async (type: 'KELUAR' | 'MAKAN') => {
    if (!selectedStaffIzin) return;
    const anyActive = permissions.some(p => p.status === 'ACTIVE');
    if (anyActive) {
      alert("Sistem Terkunci: Masih ada personel di luar.");
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

    setterLoop: {
        setPermissions(prev => {
            const next = prev.map(p => p.id === permissionId ? { ...p, ...updatedData } : p);
            saveToLocal('permissions', next);
            return next;
        });
    }

    if (supabase) {
      await supabase.from('permissions').update(updatedData).eq('id', permissionId);
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
                      <button onClick={() => startIzin('KELUAR')} disabled={!selectedStaffIzin} className="w-full bg-white hover:bg-[#ff6b35] text-black hover:text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] interactable transition-all">Execute Exit (15m)</button>
                      <button onClick={() => startIzin('MAKAN')} disabled={!selectedStaffIzin} className="w-full border border-white/20 hover:border-white text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] interactable transition-all">Execute Meal (7m)</button>
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
                  <div className={`w-7 h-7 border-2 rounded-lg cursor-pointer flex items-center justify-center transition-all interactable ${task.is_completed ? 'bg-[#ff6b35] border-[#ff6b35]' : 'border-white/20'}`} onClick={async () => { const newState = !task.is_completed; setTasks(prev => { const next = prev.map(t => t.id === task.id ? { ...t, is_completed: newState } : t); saveToLocal('tasks', next); return next; }); if (supabase) await supabase.from('tasks').update({ is_completed: newState }).eq('id', task.id); }}>{task.is_completed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}</div>
                  <div className={`flex-1 font-primary text-white text-lg ${task.is_completed ? 'line-through opacity-30' : ''}`}>{task.title}</div>
                  <button onClick={() => deleteItem('tasks', task.id, setTasks)} className="p-2 hover:bg-red-500/10 rounded-lg interactable"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REPORTAN MODAL */}
      {showReports && (
        <div className="task-modal-overlay" onClick={() => setShowReports(false)}>
          <div className="w-[95vw] max-w-[800px] bg-black/80 border border-white/10 rounded-[3rem] p-10 md:p-12 max-h-[85vh] flex flex-col shadow-2xl interactable backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-10">
              <div><h2 className="text-3xl font-primary font-bold text-white uppercase tracking-tight">Reportan</h2><p className="opacity-30 text-[9px] uppercase tracking-[0.4em] mt-3 font-secondary">Archive Records</p></div>
              <button onClick={() => setShowReports(false)} className="bg-white/5 hover:bg-white/10 p-4 rounded-full transition-all interactable"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <input type="text" placeholder="Report Title..." value={newReportTitle} onChange={e => setNewReportTitle(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-primary interactable focus:border-[#ff6b35] outline-none" />
              <input type="text" placeholder="Description..." value={newReportDesc} onChange={e => setNewReportDesc(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-primary interactable focus:border-[#ff6b35] outline-none" />
              <button onClick={() => { if(!newReportTitle) return; addItem('reports', { title: newReportTitle, description: newReportDesc }, setReports, () => {setNewReportTitle(""); setNewReportDesc("");}); }} className="md:col-span-2 bg-white/10 hover:bg-white hover:text-black text-white py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest border border-white/10 interactable transition-all">SUBMIT REPORT</button>
            </div>
            <div className="task-list flex-1 overflow-y-auto pr-3 space-y-4">
              {reports.map(report => (
                <div key={report.id} className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.03] group relative">
                  <h4 className="text-xl font-primary font-bold text-white mb-2">{report.title}</h4>
                  <p className="text-white/40 text-sm leading-relaxed">{report.description}</p>
                  <button onClick={() => deleteItem('reports', report.id, setReports)} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all interactable p-2 bg-red-500/10 rounded-lg"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DATA MODAL */}
      {showDataModal && (
        <div className="task-modal-overlay" onClick={() => setShowDataModal(false)}>
          <div className="w-[98vw] max-w-[1000px] bg-black/85 border border-white/10 rounded-[4rem] p-10 md:p-16 max-h-[90vh] flex flex-col shadow-2xl interactable backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-primary font-bold text-white uppercase tracking-tighter">Database</h2>
              <div className="flex gap-2 md:gap-4 bg-white/5 p-2 rounded-full border border-white/10">
                {(['login', 'staff', 'others'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveDataTab(tab)} className={`px-6 md:px-10 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all interactable ${activeDataTab === tab ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>{tab}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeDataTab === 'login' ? (
                <div className="flex flex-col h-full">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10 items-end">
                    <div className="md:col-span-6"><input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white interactable outline-none" /></div>
                    <div className="md:col-span-4"><select value={loginType} onChange={e => setLoginType(e.target.value as any)} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white interactable outline-none"><option value="BK">BK</option><option value="ADMIN">ADMIN</option><option value="POWER">POWER</option><option value="GMAIL">GMAIL</option></select></div>
                    <button onClick={() => { if(!loginEmail) return; addItem('data_login', { email: loginEmail, login_type: loginType }, setLogins, () => setLoginEmail("")); }} className="md:col-span-2 bg-[#ff6b35] text-white py-4 rounded-2xl font-bold interactable transition-all">ADD</button>
                  </div>
                  <div className="flex-1 overflow-y-auto task-list pr-4 space-y-4">
                    {logins.map(l => (
                      <div key={l.id} className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl group">
                        <div><div className="text-white font-primary text-lg">{l.email}</div><div className="text-[10px] uppercase text-[#ff6b35] mt-1">{l.login_type} ACCESS</div></div>
                        <button onClick={() => deleteItem('data_login', l.id, setLogins)} className="p-3 text-red-500/20 group-hover:text-red-500 interactable"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeDataTab === 'staff' ? (
                <div className="flex flex-col h-full">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <input placeholder="Name" value={staffNameInput} onChange={e => setStaffNameInput(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white interactable outline-none" />
                    <input placeholder="Passport" value={staffPassport} onChange={e => setStaffPassport(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white interactable outline-none" />
                    <input placeholder="Room" value={staffRoom} onChange={e => setStaffRoom(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white interactable outline-none" />
                    <button onClick={() => { if(!staffNameInput) return; addItem('data_staff', { name: staffNameInput, passport: staffPassport, room: staffRoom }, setStaffs, () => {setStaffNameInput(""); setStaffPassport(""); setStaffRoom("");}); }} className="bg-white/10 hover:bg-white hover:text-black py-4 rounded-xl font-bold interactable transition-all">ADD</button>
                  </div>
                  <div className="flex-1 overflow-y-auto task-list pr-4 space-y-4">
                    {staffs.map(s => (
                      <div key={s.id} className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <div className="flex gap-10 items-center"><div><div className="text-[8px] uppercase text-white/30 mb-1">Name</div><div className="text-white font-primary">{s.name}</div></div><div><div className="text-[8px] uppercase text-white/30 mb-1">Passport</div><div className="text-white font-primary">{s.passport}</div></div><div><div className="text-[8px] uppercase text-white/30 mb-1">Room</div><div className="text-white font-primary">{s.room}</div></div></div>
                        <button onClick={() => deleteItem('data_staff', s.id, setStaffs)} className="text-red-500/20 hover:text-red-500 interactable"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center opacity-10 uppercase tracking-[1em] text-xs">No Records Found</div>
              )}
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
              <button onClick={() => setShowShiftModal(false)} className="bg-white/5 hover:bg-white/10 p-4 rounded-full transition-all interactable"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
              <input placeholder="Staff Name" value={shiftStaffName} onChange={e => setShiftStaffName(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white interactable text-sm outline-none" />
              <input type="time" value={shiftIn} onChange={e => setShiftIn(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white interactable text-sm outline-none" />
              <input type="time" value={shiftOut} onChange={e => setShiftOut(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white interactable text-sm outline-none" />
              <button onClick={() => { if(!shiftStaffName) return; addItem('shift_kerja', { staff_name: shiftStaffName, shift_in: shiftIn, shift_out: shiftOut }, setShifts, () => setShiftStaffName("")); }} className="bg-[#ff6b35] text-white py-4 rounded-xl transition-all font-bold text-[11px] tracking-widest interactable">ADD</button>
            </div>
            <div className="flex-1 overflow-y-auto task-list pr-2 space-y-4">
              {shifts.map(s => (
                <div key={s.id} className="grid grid-cols-4 items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl group">
                  <div className="text-white font-primary font-bold">{s.staff_name}</div>
                  <div className="text-white/40 text-[9px] uppercase font-secondary">IN: {s.shift_in}</div>
                  <div className="text-white/40 text-[9px] uppercase font-secondary">OUT: {s.shift_out}</div>
                  <button onClick={() => deleteItem('shift_kerja', s.id, setShifts)} className="justify-self-end text-red-500/20 group-hover:text-red-500 interactable transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
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
