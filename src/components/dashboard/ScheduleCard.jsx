import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Ring from '../Ring';
import TaskItem from '../TaskItem';
import EmptyState from '../EmptyState';
import { useTasks } from '../../context/TaskContext';

export default function ScheduleCard({ onAddClick, pct }) {
    const { tasks, completeTask: onComplete, editTask: onEdit, deleteTask: onDelete, regenerateSchedule } = useTasks();
    const [regenerating, setRegenerating] = useState(false);
    const navigate = useNavigate();

    const [sortBy, setSortBy] = useState("time");
    const [filterInc, setFilterInc] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Sort and filter tasks (memoized)
    const displayTasks = useMemo(() => {
        let t = filterInc ? tasks.filter(x => !x.done) : [...tasks];
        if (sortBy === "time") t.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
        else if (sortBy === "category") t.sort((a, b) => a.cat.localeCompare(b.cat));
        else if (sortBy === "xp") t.sort((a, b) => b.xp - a.xp);
        return t;
    }, [tasks, sortBy, filterInc]);

    // Check for "now" tasks (within ±15 min)
    const nowMinutes = useMemo(() => {
        const n = new Date();
        return n.getHours() * 60 + n.getMinutes();
    }, []);

    const isNow = (timeStr) => {
        if (!timeStr) return false;
        const [h, m] = timeStr.split(":").map(Number);
        const taskMin = h * 60 + m;
        return Math.abs(taskMin - nowMinutes) <= 15;
    };

    const startEdit = (t) => {
        setEditingId(t.id);
        setEditForm({ name: t.name, time: t.time, cat: t.cat, xp: t.xp });
    };

    const saveEdit = () => {
        if (editingId && editForm.name?.trim()) {
            onEdit(editingId, { ...editForm, xp: +editForm.xp });
            setEditingId(null);
        }
    };

    const cancelEdit = () => { setEditingId(null); };

    const onFocus = (t) => navigate('/focus', { state: { task: t } });

    return (
        <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div className="ct" style={{ margin: 0 }}>Today's Schedule</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Ring size={42} stroke={4} pct={pct} color="var(--teal)">
                        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{pct}%</span>
                    </Ring>
                    <button
                        className="btn btn-gh btn-sm"
                        disabled={regenerating}
                        onClick={async () => { setRegenerating(true); try { await regenerateSchedule(); } finally { setRegenerating(false); } }}
                        title="Regenerate schedule with AI"
                    >{regenerating ? <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> : "🔄"}</button>
                    <button className="btn btn-gh btn-sm" onClick={onAddClick}>+ Task</button>
                </div>
            </div>
            {/* Sort / Filter bar */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, color: "var(--t3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Sort:</span>
                {["time", "category", "xp"].map(s => (
                    <button key={s} className={"btn btn-sm " + (sortBy === s ? "btn-t" : "btn-gh")} style={{ padding: "3px 8px", fontSize: 10 }} onClick={() => setSortBy(s)}>
                        {s === "time" ? "⏰" : s === "category" ? "📁" : "⚡"} {s}
                    </button>
                ))}
                <button className={"btn btn-sm " + (filterInc ? "btn-p" : "btn-gh")} style={{ padding: "3px 8px", fontSize: 10, marginLeft: "auto" }} onClick={() => setFilterInc(f => !f)}>
                    {filterInc ? "✓ Incomplete" : "All"}
                </button>
            </div>
            <div className="sl">
                {regenerating ? (
                    <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: 10, opacity: 0.5 }}>
                        <div style={{ textAlign: "center", fontSize: 12, color: "var(--t2)", marginBottom: 4 }}>
                            <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 18 }}>⟳</span>
                            <div style={{ marginTop: 6 }}>Generating your schedule...</div>
                        </div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,.03)", borderRadius: 10 }}>
                                <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(255,255,255,.06)" }} />
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ height: 12, borderRadius: 4, background: "rgba(255,255,255,.06)", width: `${60 + i * 8}%` }} />
                                    <div style={{ height: 8, borderRadius: 3, background: "rgba(255,255,255,.04)", width: "30%" }} />
                                </div>
                                <div style={{ width: 40, height: 16, borderRadius: 8, background: "rgba(255,255,255,.06)" }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {displayTasks.map(t => (
                            <TaskItem
                                key={t.id}
                                t={t}
                                editingId={editingId}
                                editForm={editForm}
                                setEditForm={setEditForm}
                                saveEdit={saveEdit}
                                cancelEdit={cancelEdit}
                                startEdit={startEdit}
                                onComplete={onComplete}
                                onFocus={onFocus}
                                onDelete={onDelete}
                                isNow={isNow}
                            />
                        ))}
                        {displayTasks.length === 0 && (
                            filterInc
                                ? <EmptyState emoji="🎉" title="All tasks conquered!" subtitle="Your dragon rests, but tomorrow brings new challenges." />
                                : <EmptyState emoji="🐉" title="Your dragon is waiting!" subtitle="Complete your first task to awaken it." action={{ label: "+ Add Task", onClick: onAddClick }} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
