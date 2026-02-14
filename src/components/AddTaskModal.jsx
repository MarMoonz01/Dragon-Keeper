import React, { useState, useEffect } from 'react';

export default function AddTaskModal({ onAdd, onClose }) {
    const [f, setF] = useState({ name: "", time: "09:00", cat: "work", xp: 30, hp: 20, calSync: true });
    const s = (k, v) => setF(p => ({ ...p, [k]: v }));

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="mo" onClick={onClose}>
            <div className="mc" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add new task">
                <div className="mc-t">✦ Add New Task</div>
                <div className="fr"><label>Task Name</label>
                    <input className="inp" placeholder="e.g. IELTS Writing Practice" value={f.name} onChange={e => s("name", e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <div className="fr" style={{ flex: 1 }}><label>Time</label>
                        <input className="inp" type="time" value={f.time} onChange={e => s("time", e.target.value)} />
                    </div>
                    <div className="fr" style={{ flex: 1 }}><label>Category</label>
                        <select className="inp" value={f.cat} onChange={e => s("cat", e.target.value)}>
                            {["health", "work", "ielts", "mind", "social"].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <div className="fr" style={{ flex: 1 }}><label>XP Reward</label>
                        <input className="inp" type="number" min={5} max={100} value={f.xp} onChange={e => s("xp", e.target.value)} />
                    </div>
                    <div className="fr" style={{ flex: 1 }}><label>Battle Damage</label>
                        <input className="inp" type="number" min={5} max={60} value={f.hp} onChange={e => s("hp", e.target.value)} />
                    </div>
                </div>
                <div className="fr" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" id="cs" checked={f.calSync} onChange={e => s("calSync", e.target.checked)} style={{ accentColor: "var(--teal)" }} />
                    <label htmlFor="cs" style={{ fontSize: 12, color: "var(--t1)", fontWeight: 600, cursor: "pointer" }}>Sync to Google Calendar</label>
                </div>
                <div className="mac">
                    <button className="btn btn-gh" onClick={onClose}>Cancel</button>
                    <button className="btn btn-g" onClick={() => { if (f.name.trim()) { onAdd({ ...f, id: Date.now(), done: false, xp: +f.xp, hp: +f.hp }); onClose(); } }}>Add Task ✦</button>
                </div>
            </div>
        </div>
    );
}
