import React, { useState, useEffect } from 'react';
import AddTaskModal from '../components/AddTaskModal';
import Ring from '../components/Ring';
import Loader from '../components/Loader';
import DragonPanel from '../components/DragonPanel';
import GCalPanel from '../components/GCalPanel';
import MiniCal from '../components/MiniCal';
import { load, save, ai } from '../utils/helpers';
import { supabase } from '../utils/supabaseClient';
import { WL } from '../data/constants';

export default function Dashboard({ tasks, onComplete, dragon, streak, onAdd, onEdit, onDelete, gcal, onConnect, onPush, pushing, stats }) {
    const [genLoading, setGenLoading] = useState(false);
    const [aiSched, setAiSched] = useState("");
    const [briefing, setBriefing] = useState("");
    const [briefLoading, setBriefLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [sortBy, setSortBy] = useState("time"); // time | category | xp
    const [filterInc, setFilterInc] = useState(false);
    const [calHighlights, setCalHighlights] = useState([]);

    const done = tasks.filter(t => t.done).length;
    const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;

    useEffect(() => {
        const key = "brief_" + new Date().toDateString() + "_lv" + dragon.level + "_s" + streak;
        load(key).then(c => {
            if (c) { setBriefing(c); return; }
            setBriefLoading(true);
            ai([{ role: "user", content: "Daily briefing: IELTS target 7.5 (current 6.5), healthy habits. " + new Date().toDateString() + ". Dragon Lv." + dragon.level + ", streak " + streak + " days. Give: 1 key priority, 1 IELTS tip, 1 motivational line. Max 90 words." }])
                .then(r => { setBriefing(r); save(key, r); setBriefLoading(false); })
                .catch(() => setBriefLoading(false));
        });

        if (supabase) {
            fetchWeeklyHistory();
            fetchCalHighlights();
        }
    }, [supabase, dragon.level, streak]);

    const fetchWeeklyHistory = async () => {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Get this week's Monday
        const monStr = monday.toISOString().split('T')[0];

        const { data } = await supabase.from('daily_summaries')
            .select('date, productivity_score')
            .gte('date', monStr)
            .order('date', { ascending: true })
            .limit(7);

        if (data) {
            const mapped = [0, 0, 0, 0, 0, 0, 0];
            data.forEach(d => {
                const dayIdx = (new Date(d.date + 'T00:00:00').getDay() + 6) % 7; // Mon=0
                mapped[dayIdx] = d.productivity_score || 0;
            });
            setWeeklyData(mapped);
        }
    };

    // Issue #9: fetch real dates for MiniCal highlights
    const fetchCalHighlights = async () => {
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth();
        const start = new Date(y, m, 1).toISOString().split('T')[0];
        const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
        const { data } = await supabase.from('daily_summaries')
            .select('date')
            .gte('date', start).lte('date', end);
        if (data) setCalHighlights(data.map(d => new Date(d.date + 'T00:00:00').getDate()));
    };

    const genSchedule = async () => {
        setGenLoading(true);
        const dn = tasks.filter(t => t.done).map(t => t.name).join(", ") || "none";
        const pn = tasks.filter(t => !t.done).map(t => t.name).join(", ");
        const r = await ai([{ role: "user", content: "Generate tomorrow's optimised schedule.\nCompleted today: " + dn + "\nPending: " + pn + "\nRate: " + pct + "%, Dragon Lv." + dragon.level + ".\nCreate 9 tasks with times (HH:MM), categories (health/work/ielts/mind), XP (10-60). Front-load IELTS before noon. Format: • HH:MM — Task [cat] +XXxp" }],
            "You are NEXUS AI Life Secretary. Generate practical, motivating schedules.");
        setAiSched(r); setGenLoading(false);
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

    // Sort and filter tasks
    const displayTasks = (() => {
        let t = filterInc ? tasks.filter(x => !x.done) : [...tasks];
        if (sortBy === "time") t.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
        else if (sortBy === "category") t.sort((a, b) => a.cat.localeCompare(b.cat));
        else if (sortBy === "xp") t.sort((a, b) => b.xp - a.xp);
        return t;
    })();

    // Check for "now" tasks (within ±15 min)
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const isNow = (timeStr) => {
        if (!timeStr) return false;
        const [h, m] = timeStr.split(":").map(Number);
        const taskMin = h * 60 + m;
        return Math.abs(taskMin - nowMinutes) <= 15;
    };

    return (
        <div>
            {showAdd && <AddTaskModal onAdd={t => { onAdd(t); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}
            <div className="ph">
                <div className="ph-title">Command Center</div>
                <div className="ph-sub">{new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })} · AI Secretary Active</div>
            </div>
            {briefLoading && (
                <div className="brief" style={{ opacity: 0.5 }}>
                    <div className="brief-time" style={{ background: "rgba(255,255,255,.06)", width: "40%", height: 12, borderRadius: 4 }}>&nbsp;</div>
                    <div className="brief-head" style={{ background: "rgba(255,255,255,.06)", width: "60%", height: 16, borderRadius: 4, marginTop: 6 }}>&nbsp;</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                        <div style={{ background: "rgba(255,255,255,.04)", height: 10, borderRadius: 3, width: "100%" }}>&nbsp;</div>
                        <div style={{ background: "rgba(255,255,255,.04)", height: 10, borderRadius: 3, width: "85%" }}>&nbsp;</div>
                        <div style={{ background: "rgba(255,255,255,.04)", height: 10, borderRadius: 3, width: "70%" }}>&nbsp;</div>
                    </div>
                </div>
            )}
            {briefing && (
                <div className="brief">
                    <div className="brief-time">🌅 DAILY BRIEFING — {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="brief-head">Good morning, Scholar</div>
                    <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.8 }}>{briefing}</div>
                </div>
            )}
            <div className="g4" style={{ marginBottom: 18 }}>
                {[
                    { ic: "⚡", v: pct + "%", l: "Daily Progress", ch: "+15% vs yesterday", pos: true, c: "var(--teal)" },
                    { ic: "🏅", v: dragon.xp, l: "Total XP", ch: "+" + tasks.filter(t => t.done).reduce((a, t) => a + t.xp, 0) + " today", pos: true, c: "var(--gold)" },
                    { ic: "📚", v: tasks.filter(t => t.cat === "ielts" && t.done).length + "/3", l: "IELTS Done", ch: "On track", pos: true, c: "var(--violet)" },
                    { ic: "❤️", v: stats.healthScore || 0, l: "Health Score", ch: "Streak: " + streak + "d 🔥" + (stats.streakFreezes ? " 🧊×" + stats.streakFreezes : ""), pos: true, c: "var(--rose)" },
                ].map((s, i) => (
                    <div key={i} className="sc">
                        <div className="sc-ic">{s.ic}</div>
                        <div className="sc-v" style={{ color: s.c }}>{s.v}</div>
                        <div className="sc-l">{s.l}</div>
                        <div className={"sc-ch " + (s.pos ? "pos" : "neg")}>{s.ch}</div>
                    </div>
                ))}
            </div>
            <div className="gm">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <div className="ct" style={{ margin: 0 }}>Today's Schedule</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Ring size={42} stroke={4} pct={pct} color="var(--teal)">
                                    <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{pct}%</span>
                                </Ring>
                                <button className="btn btn-gh btn-sm" onClick={() => setShowAdd(true)}>+ Task</button>
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
                            {displayTasks.map(t => (
                                <div key={t.id}>
                                    {editingId === t.id ? (
                                        <div className="task" style={{ flexDirection: "column", gap: 8, cursor: "default" }}>
                                            <div style={{ display: "flex", gap: 8, width: "100%" }}>
                                                <input className="inp" style={{ flex: 1, padding: "6px 10px", fontSize: 12 }} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} autoFocus onKeyDown={e => e.key === "Enter" && saveEdit()} />
                                                <input className="inp" type="time" style={{ width: 90, padding: "6px 8px", fontSize: 11 }} value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} />
                                            </div>
                                            <div style={{ display: "flex", gap: 8, width: "100%", alignItems: "center" }}>
                                                <select className="inp" style={{ width: 90, padding: "6px 8px", fontSize: 11 }} value={editForm.cat} onChange={e => setEditForm({ ...editForm, cat: e.target.value })}>
                                                    {["health", "work", "ielts", "mind", "social"].map(c => <option key={c}>{c}</option>)}
                                                </select>
                                                <input className="inp" type="number" min={5} max={100} style={{ width: 60, padding: "6px 8px", fontSize: 11 }} value={editForm.xp} onChange={e => setEditForm({ ...editForm, xp: e.target.value })} />
                                                <span style={{ fontSize: 10, color: "var(--t3)" }}>XP</span>
                                                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                                                    <button className="btn btn-g btn-sm" style={{ padding: "4px 10px" }} onClick={saveEdit}>Save</button>
                                                    <button className="btn btn-gh btn-sm" style={{ padding: "4px 10px" }} onClick={cancelEdit}>✕</button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={"task" + (t.done ? " done" : "")} style={{ position: "relative" }}>
                                            <div className={"chk" + (t.done ? " y" : "")} onClick={() => onComplete(t.id, t.xp)}>{t.done ? "✓" : ""}</div>
                                            <div style={{ flex: 1 }} onClick={() => !t.done && startEdit(t)}>
                                                <div className="tn">{t.name}</div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                                                    <span className="tm">⏰ {t.time}</span>
                                                    {t.calSync && <span style={{ fontSize: 9, color: "var(--teal)" }}>📅</span>}
                                                    {isNow(t.time) && !t.done && <span className="badge bt" style={{ fontSize: 8, padding: "1px 6px", animation: "pulse 2s infinite" }}>⏰ NOW</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                                                <span className={"cat c-" + t.cat}>{t.cat}</span>
                                                <span className="xptag">+{t.xp}xp</span>
                                            </div>
                                            {!t.done && (
                                                <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                                                    style={{ position: "absolute", top: 4, right: 4, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--t3)", opacity: 0.4, transition: "opacity .2s", padding: 2 }}
                                                    onMouseEnter={e => e.target.style.opacity = 1}
                                                    onMouseLeave={e => e.target.style.opacity = 0.4}
                                                    title="Delete task">
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {displayTasks.length === 0 && (
                                <div style={{ textAlign: "center", padding: 20, color: "var(--t3)", fontSize: 12 }}>
                                    {filterInc ? "All tasks completed! 🎉" : "No tasks yet. Add one above!"}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <div className="ct">Weekly Performance</div>
                        <div className="bch">
                            {weeklyData.map((h, i) => (
                                <div key={i} className="bc">
                                    <div className={"bb" + (i === (new Date().getDay() + 6) % 7 ? " act" : "")} style={{ height: h + "%" }} />
                                    <span className="bl">{WL[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card">
                        <div className="ct">🤖 AI Schedule Generator</div>
                        <button className="btn btn-v" style={{ width: "100%", justifyContent: "center", padding: "12px 18px" }} onClick={genSchedule} disabled={genLoading}>
                            <span style={{ fontSize: 16 }}>🤖</span>
                            {genLoading ? "Generating with Claude AI..." : "Generate Tomorrow's Schedule"}
                        </button>
                        {genLoading && <div style={{ marginTop: 10 }}><Loader text="Claude is building your personalised plan..." /></div>}
                        {aiSched && <div className="aibx" style={{ marginTop: 12 }}>{aiSched}</div>}
                        {!aiSched && !genLoading && (
                            <div className="ins" style={{ marginTop: 10 }}>
                                <span className="ins-ic">💡</span>
                                <span>Claude AI analyses today's performance and generates a schedule optimised for your IELTS goals, health patterns, and productivity rhythms.</span>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <DragonPanel xp={dragon.xp} lv={dragon.level} done={done} streak={streak} tasks={tasks} />
                    <GCalPanel gcal={gcal} onConnect={onConnect} onPush={onPush} pushing={pushing} />
                    <div className="card"><div className="ct">Calendar</div><MiniCal hi={calHighlights.length > 0 ? calHighlights : []} /></div>
                </div>
            </div>
        </div>
    );
}
