import React, { useState } from 'react';
import Ring from '../components/Ring';
import Loader from '../components/Loader';
import { ai } from '../utils/helpers';
import { supabase } from '../utils/supabaseClient';
import { CC } from '../data/constants';

import { useGame } from '../context/GameContext';
import { useTasks } from '../context/TaskContext';

export default function AnalysisPage() {
    const { dragon, stats } = useGame();
    const streak = stats.streak || 0;
    const { tasks } = useTasks();
    const [insight, setInsight] = useState("");
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState({ mood: 0, energy: 0, focus: 0, sleep: 0 });

    React.useEffect(() => {
        if (!supabase) return;
        supabase.from('daily_summaries').select('*').order('date', { ascending: false }).limit(1).single()
            .then(({ data }) => {
                if (data) {
                    setMetrics({
                        mood: data.mood_score || 0,
                        energy: data.energy_score || 0,
                        focus: data.focus_score || 0,
                        sleep: data.sleep_score || 0
                    });
                    if (data.summary) setInsight(data.summary);
                }
            });
    }, []);

    const cats = ["health", "work", "ielts", "mind", "social"];
    const cd = cats.map(c => ({ cat: c, total: tasks.filter(t => t.cat === c).length, done: tasks.filter(t => t.cat === c && t.done).length }));
    const pct = tasks.length ? Math.round(tasks.filter(t => t.done).length / tasks.length * 100) : 0;
    const getInsight = async () => {
        setLoading(true);
        const sum = cd.map(c => c.cat + ": " + c.done + "/" + c.total).join(", ");
        const r = await ai([{ role: "user", content: "Analyse daily performance:\nCategories: " + sum + "\nCompletion: " + pct + "%, XP: " + dragon.xp + ", Level: " + dragon.level + ", Streak: " + streak + " days\n\nGive exactly 3 insights:\n1. What went well\n2. Top priority for tomorrow (specific)\n3. One concrete IELTS tip based on pattern" }]);
        setInsight(r); setLoading(false);
    };
    return (
        <div>
            <div className="ph"><div className="ph-title">Daily Analysis</div><div className="ph-sub">AI-powered insights to sharpen tomorrow</div></div>
            <div className="g2" style={{ marginBottom: 16 }}>
                <div className="card">
                    <div className="ct">Category Performance</div>
                    {cd.map(c => (
                        <div key={c.cat} className="abar">
                            <div className="abl">{c.cat}</div>
                            <div className="abtr"><div className="abfi" style={{ width: c.total > 0 ? c.done / c.total * 100 + "%" : "0%", background: CC[c.cat] }} /></div>
                            <div className="abv">{c.total > 0 ? Math.round(c.done / c.total * 100) + "%" : "—"}</div>
                        </div>
                    ))}
                </div>
                <div className="card">
                    <div className="ct">Completion Rings</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                        {cd.map(c => (
                            <Ring key={c.cat} size={60} stroke={5} pct={c.total > 0 ? c.done / c.total * 100 : 0} color={CC[c.cat]}>
                                <span className="rv" style={{ fontSize: 10, color: CC[c.cat] }}>{c.total > 0 ? Math.round(c.done / c.total * 100) : 0}%</span>
                                <span className="rl" style={{ textTransform: "capitalize" }}>{c.cat}</span>
                            </Ring>
                        ))}
                    </div>
                </div>
            </div>
            <div className="g4" style={{ marginBottom: 16 }}>
                {["Mood", "Energy", "Focus", "Sleep"].map((m, i) => {
                    const v = [metrics.mood, metrics.energy, metrics.focus, metrics.sleep][i];
                    const hasData = v > 0;
                    return (
                        <div key={m} className="sc">
                            <div className="sc-ic">{["😊", "⚡", "🎯", "💤"][i]}</div>
                            <div className="sc-v" style={{ color: hasData ? "var(--teal)" : "var(--t3)" }}>{hasData ? v + "/5" : "—"}</div>
                            <div className="sc-l">{hasData ? m + " Today" : "Not logged yet"}</div>
                            <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
                                {[1, 2, 3, 4, 5].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= v ? "var(--teal)" : "rgba(255,255,255,.08)" }} />)}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div className="ct" style={{ margin: 0 }}>🤖 AI Analysis</div>
                    <button className="btn btn-v btn-sm" onClick={getInsight} disabled={loading}>{loading ? "Analysing..." : "Get AI Insights"}</button>
                </div>
                {loading && <Loader text="AI is analysing your performance..." />}
                {insight && <div className="aibx">{insight}</div>}
                {!insight && !loading && <div style={{ color: "var(--t3)", fontSize: 12, textAlign: "center", padding: "18px 0" }}>Click "Get AI Insights" for personalised analysis</div>}
            </div>
        </div>
    );
}
