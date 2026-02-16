
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
  const [activeDataTab, setActiveDataTab] = useState<'login' | 'staff'>('login');

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

  // Derived state to fix "Cannot find name 'activeProtocol'" errors
  const activeProtocol = permissions.find(p => p.status === 'ACTIVE');

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

        const fetchLatest = async () => {
          const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false });
          if (data) {
            setter(data);
            saveToLocal(table, data);
          }
        };

        fetchLatest();

        const channel = supabase
          .channel(`db-changes-${table}-${Math.random()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: table }, () => fetchLatest())
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      });
    } else {
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
      if (error) console.error("DB Error:", error.message);
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
    let penaltyString = returnTime > scheduledEnd ? "LATE" : "ON TIME";

    const updatedData = { status: 'COMPLETED' as const, actual_end_time: returnTime.toISOString(), penalty: penaltyString };
    if (supabase) {
      await supabase.from('permissions').update(updatedData).eq('id', permissionId);
    } else {
      // Logic fix: Ensure local state is updated when not using Supabase
      setPermissions((prev) => {
        const next = prev.map(p => p.id === permissionId ? { ...p, ...updatedData } : p);
        saveToLocal('permissions', next);
        return next;
      });
    }
  };

  const getTimerString = (endTime: string) => {
    const diff = new Date(endTime).getTime() - now.getTime();
    if (diff <= 0) return "TIME UP";
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activate = (index: number) => {
    setActiveIdx(index);
    if (!trackRef.current || !containerRef.current) return;
    const card = (Array.from(trackRef.current.children) as HTMLElement[])[index];
    if (card) containerRef.current.scrollTo({ left: card.offsetLeft - (window.innerWidth < 768 ? 20 : 100), behavior: "smooth" });
  };

  return (
    <div className="ui-overlay-root">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-6 md:p-12 flex justify-start items-center z-[500] pointer-events-auto">
        <ul className="flex gap-6 md:gap-12 list-none m-0 p-0 overflow-x-auto no-scrollbar">
          {menuItems.map((item, i) => (
            <li key={i} className="flex-shrink-0">
              <button 
                onClick={() => {
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

      {/* 1. MODAL TUGAS */}
      {showTasks && (
        <div className="task-modal-overlay interactable" onClick={() => setShowTasks(false)}>
          <div className="w-[90vw] max-w-[600px] bg-black/80 border border-white/10 rounded-[3rem] p-10 max-h-[80vh] flex flex-col shadow-2xl backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-primary font-bold text-white uppercase tracking-widest">Tugas Today</h2>
              <button onClick={() => setShowTasks(false)} className="text-white/40 hover:text-white transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <div className="flex gap-4 mb-6">
              <input type="text" placeholder="Entri tugas..." value={newTask} onChange={e => setNewTask(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-primary outline-none focus:border-[#ff6b35]" />
              <button onClick={() => { if(newTask) addItem('tasks', { title: newTask, is_completed: false }, setTasks, () => setNewTask("")); }} className="bg-[#ff6b35] px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-all">Save</button>
            </div>
            <div className="flex-1 overflow-y-auto task-list space-y-3">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <div className={`w-6 h-6 border rounded-md cursor-pointer flex items-center justify-center ${t.is_completed ? 'bg-[#ff6b35] border-[#ff6b35]' : 'border-white/20'}`} onClick={async () => { if(supabase) await supabase.from('tasks').update({is_completed: !t.is_completed}).eq('id', t.id); }}>{t.is_completed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}</div>
                  <span className={`flex-1 text-white/80 font-primary ${t.is_completed ? 'line-through opacity-30' : ''}`}>{t.title}</span>
                  <button onClick={() => deleteItem('tasks', t.id, setTasks)} className="text-red-500/50 hover:text-red-500 transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL REPORTAN */}
      {showReports && (
        <div className="task-modal-overlay interactable" onClick={() => setShowReports(false)}>
          <div className="w-[90vw] max-w-[800px] bg-black/80 border border-white/10 rounded-[3rem] p-10 max-h-[85vh] flex flex-col shadow-2xl backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-primary font-bold text-white uppercase tracking-widest">Global Reports</h2>
              <button onClick={() => setShowReports(false)} className="text-white/40 hover:text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-8 flex flex-col gap-4">
              <input type="text" placeholder="Report Title..." value={newReportTitle} onChange={e => setNewReportTitle(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white font-primary outline-none focus:border-[#ff6b35]" />
              <textarea placeholder="Description..." value={newReportDesc} onChange={e => setNewReportDesc(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white font-primary outline-none focus:border-[#ff6b35] h-24 resize-none" />
              <button onClick={() => { if(newReportTitle) addItem('reports', { title: newReportTitle, description: newReportDesc }, setReports, () => { setNewReportTitle(""); setNewReportDesc(""); }); }} className="bg-[#ff6b35] py-4 rounded-xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-white hover:text-black transition-all">Submit Report</button>
            </div>
            <div className="flex-1 overflow-y-auto task-list space-y-4">
              {reports.map(r => (
                <div key={r.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl relative">
                  <button onClick={() => deleteItem('reports', r.id, setReports)} className="absolute top-6 right-6 text-red-500/30 hover:text-red-500 transition-all"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  <h4 className="text-[#ff6b35] font-primary font-bold uppercase text-[11px] tracking-[0.2em] mb-2">{r.title}</h4>
                  <p className="text-white/60 font-primary text-sm leading-relaxed">{r.description}</p>
                  <div className="mt-4 text-[9px] text-white/20 uppercase font-mono">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL DATA (TABS) */}
      {showDataModal && (
        <div className="task-modal-overlay interactable" onClick={() => setShowDataModal(false)}>
          <div className="w-[95vw] max-w-[1000px] bg-black/80 border border-white/10 rounded-[3rem] p-10 max-h-[85vh] flex flex-col shadow-2xl backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-8">
                <button onClick={() => setActiveDataTab('login')} className={`text-xl font-primary font-bold uppercase tracking-widest transition-all ${activeDataTab === 'login' ? 'text-[#ff6b35]' : 'text-white/20'}`}>Data Login</button>
                <button onClick={() => setActiveDataTab('staff')} className={`text-xl font-primary font-bold uppercase tracking-widest transition-all ${activeDataTab === 'staff' ? 'text-[#ff6b35]' : 'text-white/20'}`}>Data Staff</button>
              </div>
              <button onClick={() => setShowDataModal(false)} className="text-white/40 hover:text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>

            {activeDataTab === 'login' ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <input type="email" placeholder="Email Address..." value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-primary outline-none focus:border-[#ff6b35]" />
                  <select value={loginType} onChange={e => setLoginType(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-primary outline-none focus:border-[#ff6b35] appearance-none">
                    <option value="BK">BK</option><option value="ADMIN">ADMIN</option><option value="POWER">POWER</option><option value="GMAIL">GMAIL</option>
                  </select>
                  <button onClick={() => { if(loginEmail) addItem('data_login', { email: loginEmail, login_type: loginType }, setLogins, () => setLoginEmail("")); }} className="bg-[#ff6b35] rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all">Add Login Data</button>
                </div>
                <div className="flex-1 overflow-y-auto task-list border border-white/5 rounded-3xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#07090d] z-10">
                      <tr><th className="p-6 text-[10px] uppercase text-white/30 tracking-widest border-b border-white/5">Email</th><th className="p-6 text-[10px] uppercase text-white/30 tracking-widest border-b border-white/5">Type</th><th className="p-6 text-[10px] uppercase text-white/30 tracking-widest border-b border-white/5 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logins.map(l => (
                        <tr key={l.id} className="hover:bg-white/[0.02] transition-all">
                          <td className="p-6 text-white/80 font-primary text-sm">{l.email}</td>
                          <td className="p-6"><span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-[#ff6b35]">{l.login_type}</span></td>
                          <td className="p-6 text-right"><button onClick={() => deleteItem('data_login', l.id, setLogins)} className="text-red-500/50 hover:text-red-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                  <input placeholder="Name..." value={staffNameInput} onChange={e => setStaffNameInput(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-primary text-sm outline-none" />
                  <input placeholder="Passport..." value={staffPassport} onChange={e => setStaffPassport(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-primary text-sm outline-none" />
                  <input placeholder="Room..." value={staffRoom} onChange={e => setStaffRoom(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-primary text-sm outline-none" />
                  <input placeholder="Email..." value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-primary text-sm outline-none" />
                  <button onClick={() => { if(staffNameInput) addItem('data_staff', { name: staffNameInput, passport: staffPassport, room: staffRoom, email: loginEmail }, setStaffs, () => { setStaffNameInput(""); setStaffPassport(""); setStaffRoom(""); setLoginEmail(""); }); }} className="bg-[#ff6b35] rounded-xl font-bold uppercase text-[9px] tracking-widest">Add Staff</button>
                </div>
                <div className="flex-1 overflow-y-auto task-list border border-white/5 rounded-3xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#07090d] z-10">
                      <tr><th className="p-4 text-[9px] uppercase text-white/30 tracking-widest border-b border-white/5">Name</th><th className="p-4 text-[9px] uppercase text-white/30 tracking-widest border-b border-white/5">Passport</th><th className="p-4 text-[9px] uppercase text-white/30 tracking-widest border-b border-white/5">Room</th><th className="p-4 text-[9px] uppercase text-white/30 tracking-widest border-b border-white/5 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {staffs.map(s => (
                        <tr key={s.id} className="hover:bg-white/[0.02]">
                          <td className="p-4 text-white/80 font-primary text-sm">{s.name}</td>
                          <td className="p-4 text-white/50 font-mono text-xs">{s.passport}</td>
                          <td className="p-4 text-white/80 font-primary text-sm">{s.room}</td>
                          <td className="p-4 text-right"><button onClick={() => deleteItem('data_staff', s.id, setStaffs)} className="text-red-500/50"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL SHIFT KERJA */}
      {showShiftModal && (
        <div className="task-modal-overlay interactable" onClick={() => setShowShiftModal(false)}>
          <div className="w-[90vw] max-w-[700px] bg-black/80 border border-white/10 rounded-[3rem] p-10 max-h-[85vh] flex flex-col shadow-2xl backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-primary font-bold text-white uppercase tracking-widest">Shift Kerja</h2>
              <button onClick={() => setShowShiftModal(false)} className="text-white/40 hover:text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <input placeholder="Staff Name..." value={shiftStaffName} onChange={e => setShiftStaffName(e.target.value)} className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-primary outline-none" />
              <div className="flex flex-col gap-2"><label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Shift In</label><input type="time" value={shiftIn} onChange={e => setShiftIn(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-mono outline-none" /></div>
              <div className="flex flex-col gap-2"><label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Shift Out</label><input type="time" value={shiftOut} onChange={e => setShiftOut(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-mono outline-none" /></div>
              <button onClick={() => { if(shiftStaffName) addItem('shift_kerja', { staff_name: shiftStaffName, shift_in: shiftIn, shift_out: shiftOut }, setShifts, () => { setShiftStaffName(""); setShiftIn(""); setShiftOut(""); }); }} className="col-span-2 bg-[#ff6b35] py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all">Assign Shift</button>
            </div>
            <div className="flex-1 overflow-y-auto task-list space-y-3">
              {shifts.map(s => (
                <div key={s.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex justify-between items-center">
                  <div><h4 className="text-white font-primary font-bold text-lg">{s.staff_name}</h4><div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Schedule: {s.shift_in} - {s.shift_out}</div></div>
                  <button onClick={() => deleteItem('shift_kerja', s.id, setShifts)} className="text-red-500/30 hover:text-red-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL IZIN KELUAR */}
      {showIzinModal && (
        <div className="task-modal-overlay interactable" onClick={() => setShowIzinModal(false)}>
          <div className="w-[95vw] max-w-[1100px] bg-black/80 border border-white/10 rounded-[3.5rem] p-10 max-h-[92vh] flex flex-col shadow-2xl backdrop-blur-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-primary font-bold text-white uppercase tracking-tighter">Exit Authorization</h2>
              <button onClick={() => setShowIzinModal(false)} className="bg-white/5 hover:bg-white/10 p-4 rounded-full transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-hidden flex-1">
              <div className="lg:col-span-4 flex flex-col gap-6">
                {!activeProtocol ? (
                  <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8">
                    <select value={selectedStaffIzin} onChange={e => setSelectedStaffIzin(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white font-primary mb-8 outline-none">
                      <option value="">CHOOSE STAFF...</option>
                      {shifts.map(s => <option key={s.id} value={s.staff_name}>{s.staff_name}</option>)}
                    </select>
                    <div className="flex flex-col gap-4">
                      <button onClick={() => { if(!selectedStaffIzin) return; const start = new Date(); const end = new Date(start.getTime() + 15 * 60000); addItem('permissions', { staff_name: selectedStaffIzin, type: 'KELUAR', start_time: start.toISOString(), end_time: end.toISOString(), status: 'ACTIVE' }, setPermissions, () => {}); }} className="w-full bg-white text-black py-6 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#ff6b35] hover:text-white transition-all">Exit (15m)</button>
                      <button onClick={() => { if(!selectedStaffIzin) return; const start = new Date(); const end = new Date(start.getTime() + 7 * 60000); addItem('permissions', { staff_name: selectedStaffIzin, type: 'MAKAN', start_time: start.toISOString(), end_time: end.toISOString(), status: 'ACTIVE' }, setPermissions, () => {}); }} className="w-full border border-white/20 text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:border-white transition-all">Meal (7m)</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-[2.5rem] p-10 text-center flex flex-col gap-6">
                    <div className="text-[9px] uppercase tracking-[0.4em] text-[#ff6b35]">Active Protocol</div>
                    <div className="text-3xl font-primary font-bold text-white">{activeProtocol.staff_name}</div>
                    <button onClick={() => clockIn(activeProtocol.id)} className="w-full bg-[#ff6b35] py-8 rounded-2xl font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all">Return / Clock In</button>
                  </div>
                )}
              </div>
              <div className="lg:col-span-8 overflow-y-auto task-list p-4 space-y-4">
                {permissions.map(p => (
                  <div key={p.id} className={`p-8 rounded-[2.5rem] border transition-all ${p.status === 'ACTIVE' ? 'bg-[#ff6b35]/10 border-[#ff6b35]/30' : 'bg-white/[0.02] border-white/5 opacity-40'}`}>
                    <div className="flex justify-between items-center">
                      <div><div className="flex gap-4 items-center mb-2"><div className={`text-[8px] px-3 py-1 rounded-full font-bold uppercase ${p.type === 'KELUAR' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#ff6b35]/20 text-[#ff6b35]'}`}>{p.type}</div>{p.penalty && <div className="text-[8px] text-red-500 font-bold">{p.penalty}</div>}</div><h4 className="text-2xl font-primary font-bold text-white">{p.staff_name}</h4></div>
                      {p.status === 'ACTIVE' && <div className="text-4xl font-mono font-bold text-white">{getTimerString(p.end_time)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Slider Elements */}
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
             <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'}`}></div>
             <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white">{isLive ? 'LIVE CLOUD' : 'LOCAL MODE'}</span>
           </div>
           <div className="font-mono text-[8px] uppercase tracking-[0.4em] text-white">System Active // {stats.fps} FPS</div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
