import React, { useState, useEffect, useMemo } from 'react';
import AddTaskModal from '../components/AddTaskModal';
import Ring from '../components/Ring';
import Loader from '../components/Loader';
import DragonPanel from '../components/DragonPanel';
import GCalPanel from '../components/GCalPanel';
import JourneyPanel from '../components/JourneyPanel';
import MiniCal from '../components/MiniCal';
import BriefingCard from '../components/BriefingCard';
import EmptyState from '../components/EmptyState';
import TaskItem from '../components/TaskItem';
import XPShopModal from '../components/XPShopModal';
import ChallengesCard from '../components/ChallengesCard';
import { load, save, ai } from '../utils/helpers';
import { supabase } from '../utils/supabaseClient';
import { WL } from '../data/constants';
import { useGame } from '../context/GameContext';
import { useTasks } from '../context/TaskContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { updateStats, dragon, stats, currentStage, nextStage, dragonSkill } = useGame();
    // ...
    // around line 317 in DragonPanel component
    // I need to scan where DragonPanel is used.
    // Line 317: <DragonPanel xp={dragon.xp} lv={dragon.level} done={done} streak={streak} tasks={tasks} />
    // I need to change this logic too.
    // But first, let's update destructuring.
    const streak = stats.streak || 0;
    const { tasks, completeTask: onComplete, addTask: onAdd, editTask: onEdit, deleteTask: onDelete, gcalPushing: pushing, onGcalPush: onPush, showToast } = useTasks();
    const { gcal, updateGcal } = useSettings();
    const navigate = useNavigate();

    // Derived props
    const onFocus = (t) => navigate('/focus', { state: { task: t } });
    const onConnect = () => updateGcal({ ...gcal, connected: true });
    const [genLoading, setGenLoading] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [aiSched, setAiSched] = useState("");
    const [parsedSchedTasks, setParsedSchedTasks] = useState([]);
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
        if (supabase) {
            fetchWeeklyHistory();
            fetchCalHighlights();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragon.level, streak, fetchWeeklyHistory, fetchCalHighlights]);

    const fetchWeeklyHistory = React.useCallback(async () => {
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
    }, []);

    // Issue #9: fetch real dates for MiniCal highlights
    const fetchCalHighlights = React.useCallback(async () => {
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth();
        const start = new Date(y, m, 1).toISOString().split('T')[0];
        const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
        const { data } = await supabase.from('daily_summaries')
            .select('date')
            .gte('date', start).lte('date', end);
        if (data) setCalHighlights(data.map(d => new Date(d.date + 'T00:00:00').getDate()));
    }, []);

    // Parse AI schedule text into structured tasks
    const parseScheduleText = (text) => {
        const lines = text.split('\n').filter(l => l.trim());
        const parsed = [];
        for (const line of lines) {
            // Match: • HH:MM — Task [cat] +XXxp  (flexible with variations)
            const m = line.match(/•?\s*(\d{1,2}:\d{2})\s*[—–-]\s*(.+?)\s*\[(\w+)\]\s*\+(\d+)\s*xp/i);
            if (m) {
                const cat = m[3].toLowerCase();
                parsed.push({
                    id: Date.now() + parsed.length,
                    time: m[1].padStart(5, '0'),
                    name: m[2].trim(),
                    cat: ['health', 'work', 'ielts', 'mind', 'social'].includes(cat) ? cat : 'work',
                    xp: Math.max(10, Math.min(60, parseInt(m[4]) || 20)),
                    done: false,
                    calSync: true,
                    hp: Math.max(8, Math.min(50, parseInt(m[4]) || 15)),
                });
            }
        }
        return parsed;
    };

    const genSchedule = async () => {
        setGenLoading(true);
        setParsedSchedTasks([]);
        const dn = tasks.filter(t => t.done).map(t => t.name).join(", ") || "none";
        const pn = tasks.filter(t => !t.done).map(t => t.name).join(", ");

        // Anti-pattern: reusing helper from context folder but file is in utils. 
        // Dynamic import to avoid circular dependencies if any, though here it's fine.
        let patternCtx = "";
        if (supabase) {
            try {
                const { getWeeklyPatterns } = await import('../utils/patternAnalysis');
                patternCtx = await getWeeklyPatterns(supabase);
            } catch (e) { console.error("Pattern analysis failed", e); }
        }

        const r = await ai([{ role: "user", content: "Generate tomorrow's optimised schedule.\nCompleted today: " + dn + "\nPending: " + pn + "\nRate: " + pct + "%, Dragon Lv." + dragon.level + ".\n" + (patternCtx ? "Patterns: " + patternCtx + "\n" : "") + "Create 9 tasks with times (HH:MM), categories (health/work/ielts/mind), XP (10-60). Front-load IELTS before noon. Format: • HH:MM — Task [cat] +XXxp" }],
            "You are NEXUS AI Life Secretary. Generate practical, motivating schedules. Use EXACTLY the format: • HH:MM — Task Name [category] +XXxp");
        setAiSched(r);
        const parsed = parseScheduleText(r);
        setParsedSchedTasks(parsed);
        setGenLoading(false);
    };

    const removeSchedTask = (idx) => {
        setParsedSchedTasks(prev => prev.filter((_, i) => i !== idx));
    };

    const importAllTasks = () => {
        if (parsedSchedTasks.length === 0) return;
        parsedSchedTasks.forEach(t => onAdd(t));
        showToast("🚀", "Tasks Imported!", parsedSchedTasks.length + " tasks added to your schedule");
        setParsedSchedTasks([]);
        setAiSched("");
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

    return (
        <div>
            {showShop && <XPShopModal onClose={() => setShowShop(false)} />}
            {showAdd && <AddTaskModal onAdd={t => { onAdd(t); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}
            <div className="ph">
                <div className="ph-title">Command Center</div>
                <div className="ph-sub">{new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })} · AI Secretary Active</div>
            </div>
            <BriefingCard dragon={dragon} streak={streak} />
            <div className="g4" style={{ marginBottom: 18 }}>
                {[
                    { ic: "⚡", v: pct + "%", l: "Daily Progress", ch: "+15% vs yesterday", pos: true, c: "var(--teal)" },
                    { ic: "🏅", v: dragon.xp, l: "Total XP", ch: "+" + tasks.filter(t => t.done).reduce((a, t) => a + t.xp, 0) + " today", pos: true, c: "var(--gold)", action: { label: "🛒 SHOP", onClick: () => setShowShop(true) } },
                    { ic: "📚", v: tasks.filter(t => t.cat === "ielts" && t.done).length + "/3", l: "IELTS Done", ch: "On track", pos: true, c: "var(--violet)" },
                    { ic: "❤️", v: stats.healthScore || 0, l: "Health Score", ch: "Streak: " + streak + "d 🔥" + (stats.streakFreezes ? " 🧊×" + stats.streakFreezes : ""), pos: true, c: "var(--rose)", freezes: stats.streakFreezes || 0 },
                ].map((s, i) => (
                    <div key={i} className="sc">
                        <div className="sc-ic">{s.ic}</div>
                        <div className="sc-v" style={{ color: s.c }}>{s.v}</div>
                        <div className="sc-l">{s.l}</div>
                        <div className={"sc-ch " + (s.pos ? "pos" : "neg")} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {s.ch}
                            {s.freezes > 0 && (
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Use 1 Streak Freeze? (${s.freezes} remaining)\n\nYour streak will be preserved even if you miss tasks today.`)) {
                                            updateStats({ streakFreezes: s.freezes - 1 });
                                            showToast("🧊", "Streak Freeze Used", "Streak preserved!");
                                        }
                                    }}
                                    style={{ background: "rgba(56,189,248,.12)", border: "1px solid rgba(56,189,248,.3)", borderRadius: 6, cursor: "pointer", padding: "2px 6px", fontSize: 9, color: "var(--sky)", fontWeight: 700 }}
                                    aria-label="Use streak freeze"
                                    title="Use streak freeze to preserve your streak"
                                >USE</button>
                            )}
                            {s.action && (
                                <button onClick={s.action.onClick} style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 6, cursor: "pointer", padding: "2px 6px", fontSize: 9, color: "var(--gold)", fontWeight: 700, marginLeft: 6 }}>
                                    {s.action.label}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="gm">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <ChallengesCard />
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
                                    : <EmptyState emoji="🐉" title="Your dragon is waiting!" subtitle="Complete your first task to awaken it." action={{ label: "+ Add Task", onClick: () => setShowAdd(true) }} />
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
                            {genLoading ? "Generating with AI..." : "Generate Tomorrow's Schedule"}
                        </button>
                        {genLoading && <div style={{ marginTop: 10 }}><Loader text="AI is building your personalised plan..." /></div>}
                        {aiSched && <div className="aibx" style={{ marginTop: 12 }}>{aiSched}</div>}
                        {parsedSchedTasks.length > 0 && (
                            <div className="import-preview" style={{ marginTop: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)" }}>📋 {parsedSchedTasks.length} tasks parsed</div>
                                    <button className="btn btn-g btn-sm" onClick={importAllTasks} style={{ padding: "6px 14px" }}>
                                        🚀 Import All as Tasks
                                    </button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {parsedSchedTasks.map((t, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--card)", borderRadius: 8, fontSize: 11 }}>
                                            <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--teal)", fontWeight: 700, minWidth: 40 }}>{t.time}</span>
                                            <span style={{ flex: 1, color: "var(--t1)" }}>{t.name}</span>
                                            <span className="cat-badge" style={{ background: `${CC[t.cat]}22`, color: CC[t.cat], padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{t.cat}</span>
                                            <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 10 }}>+{t.xp}xp</span>
                                            <button onClick={() => removeSchedTask(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", fontSize: 12, padding: "0 2px" }} title="Remove">✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!aiSched && !genLoading && (
                            <div className="ins" style={{ marginTop: 10 }}>
                                <span className="ins-ic">💡</span>
                                <span>AI analyses today's performance and generates a schedule optimised for your IELTS goals, health patterns, and productivity rhythms.</span>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <JourneyPanel />
                    <DragonPanel
                        xp={dragon.xp} lv={dragon.level} done={done} streak={streak} tasks={tasks}
                        stage={currentStage} nextStage={nextStage} skill={dragonSkill}
                    />
                    <GCalPanel tasks={tasks} />
                    <div className="card"><div className="ct">Calendar</div><MiniCal hi={calHighlights.length > 0 ? calHighlights : []} /></div>
                </div>
            </div>
        </div>
    );
}
