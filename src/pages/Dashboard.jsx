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

export default function Dashboard({ tasks, onComplete, dragon, streak, onAdd, gcal, onConnect, onPush, pushing, stats }) {
    const [genLoading, setGenLoading] = useState(false);
    const [aiSched, setAiSched] = useState("");
    const [briefing, setBriefing] = useState("");
    const [briefLoading, setBriefLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);

    const done = tasks.filter(t => t.done).length;
    const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;

    useEffect(() => {
        const key = "brief_" + new Date().toDateString();
        load(key).then(c => {
            if (c) { setBriefing(c); return; }
            setBriefLoading(true);
            ai([{ role: "user", content: "Daily briefing: IELTS target 7.5 (current 6.5), healthy habits. " + new Date().toDateString() + ". Dragon Lv." + dragon.level + ", streak " + streak + " days. Give: 1 key priority, 1 IELTS tip, 1 motivational line. Max 90 words." }])
                .then(r => { setBriefing(r); save(key, r); setBriefLoading(false); });
        });

        if (supabase) {
            fetchWeeklyHistory();
        }
    }, [supabase]);

    const fetchWeeklyHistory = async () => {
        // Fetch last 7 days of daily summaries
        const { data } = await supabase.from('daily_summaries')
            .select('date, productivity_score')
            .order('date', { ascending: false })
            .limit(7);

        if (data) {
            // Map to last 7 days (simplified for MVP: just show latest 7 data points or padding)
            // Ideally: map to specific days of week. For now, let's just reverse the data to show trend.
            const scores = data.map(d => d.productivity_score).reverse();
            // Pad with 0s if less than 7
            const padded = [...Array(Math.max(0, 7 - scores.length)).fill(0), ...scores];
            setWeeklyData(padded);
        }
    };

    const genSchedule = async () => {
        setGenLoading(true);
        const dn = tasks.filter(t => t.done).map(t => t.name).join(", ") || "none";
        const pn = tasks.filter(t => !t.done).map(t => t.name).join(", ");
        const r = await ai([{ role: "user", content: "Generate tomorrow's optimised schedule.\nCompleted today: " + dn + "\nPending: " + pn + "\nRate: " + pct + "%, Dragon Lv." + dragon.level + ".\nCreate 9 tasks with times (HH:MM), categories (health/work/ielts/mind), XP (10-60). Front-load IELTS before noon. Format: • HH:MM — Task [cat] +XXxp" }],
            "You are NEXUS AI Life Secretary. Generate practical, motivating schedules.");
        setAiSched(r); setGenLoading(false);
    };

    return (
        <div>
            {showAdd && <AddTaskModal onAdd={t => { onAdd(t); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}
            <div className="ph">
                <div className="ph-title">Command Center</div>
                <div className="ph-sub">{new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })} · AI Secretary Active</div>
            </div>
            {briefLoading && <div style={{ marginBottom: 16 }}><Loader text="Generating your daily AI briefing..." /></div>}
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
                    { ic: "❤️", v: stats.healthScore || 0, l: "Health Score", ch: "Streak: " + streak + "d 🔥", pos: true, c: "var(--rose)" },
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
                        <div className="sl">
                            {tasks.map(t => (
                                <div key={t.id} className={"task" + (t.done ? " done" : "")} onClick={() => onComplete(t.id)}>
                                    <div className={"chk" + (t.done ? " y" : "")}>{t.done ? "✓" : ""}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="tn">{t.name}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                                            <span className="tm">⏰ {t.time}</span>
                                            {t.calSync && <span style={{ fontSize: 9, color: "var(--teal)" }}>📅</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                                        <span className={"cat c-" + t.cat}>{t.cat}</span>
                                        <span className="xptag">+{t.xp}xp</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card">
                        <div className="ct">Weekly Performance</div>
                        <div className="bch">
                            {weeklyData.map((h, i) => (
                                <div key={i} className="bc">
                                    <div className={"bb" + (i === 6 ? " act" : "")} style={{ height: h + "%" }} />
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
                    <DragonPanel xp={dragon.xp} lv={dragon.level} done={done} streak={streak} />
                    <GCalPanel gcal={gcal} onConnect={onConnect} onPush={onPush} pushing={pushing} />
                    <div className="card"><div className="ct">Calendar</div><MiniCal hi={[5, 8, 11, 13, 16, 19, 22, 25]} /></div>
                </div>
            </div>
        </div>
    );
}
