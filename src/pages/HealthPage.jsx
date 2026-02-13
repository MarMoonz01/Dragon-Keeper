import React, { useState, useEffect } from 'react';
import Ring from '../components/Ring';
import { load, save } from '../utils/helpers';

export default function HealthPage({ health, onSave }) {
    const [loc, setLoc] = useState(health);
    const s = (k, v) => setLoc(p => ({ ...p, [k]: v }));
    const [saved, setSaved] = useState(false);
    const [weeklyHealth, setWeeklyHealth] = useState([0, 0, 0, 0, 0, 0, 0]);

    useEffect(() => {
        load("nx-health-history").then(h => {
            if (h && Array.isArray(h)) setWeeklyHealth(h);
        });
    }, []);

    const handleSave = () => {
        // Calculate today's composite health score
        const sleepPct = loc.sleep ? Math.min((loc.sleep / 8) * 100, 100) : 0;
        const stepsPct = loc.steps ? Math.min((loc.steps / 10000) * 100, 100) : 0;
        const waterPct = loc.water ? Math.min((loc.water / 3) * 100, 100) : 0;
        const todayScore = Math.round((sleepPct + stepsPct + waterPct) / 3);

        // Shift weekly data left, append today's score
        const updated = [...weeklyHealth.slice(1), todayScore];
        setWeeklyHealth(updated);
        save("nx-health-history", updated);

        onSave(loc);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div>
            <div className="ph"><div className="ph-title">Health Dashboard</div><div className="ph-sub">Log metrics · AI uses this to optimise your schedule</div></div>
            <div className="gm">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="card">
                        <div className="ct">📊 Today's Metrics</div>
                        {[
                            { k: "sleep", ic: "💤", n: "Sleep Duration", u: "hrs", min: 0, max: 12, step: 0.5 },
                            { k: "steps", ic: "🚶", n: "Steps", u: "steps", min: 0, max: 30000, step: 100 },
                            { k: "water", ic: "💧", n: "Water Intake", u: "L", min: 0, max: 5, step: 0.1 },
                            { k: "hr", ic: "🫀", n: "Resting Heart Rate", u: "bpm", min: 40, max: 120, step: 1 },
                            { k: "calories", ic: "🔥", n: "Calories", u: "kcal", min: 0, max: 4000, step: 50 },
                        ].map(m => (
                            <div key={m.k} className="hm">
                                <div className="hm-ic">{m.ic}</div>
                                <div className="hm-info">
                                    <div className="hm-n">{m.n}</div>
                                    <div className="hm-v">{parseFloat(loc[m.k] || 0).toLocaleString()} {m.u}</div>
                                </div>
                                <input className="hm-inp" type="number" min={m.min} max={m.max} step={m.step} value={loc[m.k] || 0} onChange={e => s(m.k, e.target.value)} />
                            </div>
                        ))}
                        <button className="btn btn-t" style={{ width: "100%", marginTop: 14, justifyContent: "center" }} onClick={handleSave}>
                            {saved ? "✓ Saved!" : "💾 Save Health Data"}
                        </button>
                    </div>
                    <div className="card">
                        <div className="ct">Goals</div>
                        {[{ ic: "🎯", n: "IELTS Target Band", v: "7.5" }, { ic: "🏃", n: "Exercise Days/Week", v: "5" }, { ic: "📚", n: "Study Hours/Day", v: "3" }, { ic: "💤", n: "Target Sleep (hrs)", v: "8" }].map((g, i) => (
                            <div key={i} className="goal">
                                <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(167,139,250,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{g.ic}</div>
                                <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{g.n}</div>
                                <div style={{ width: 70, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--teal)", background: "rgba(0,221,179,.08)", border: "1px solid rgba(0,221,179,.15)", borderRadius: 7, padding: "5px 0" }}>{g.v}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="card">
                        <div className="ct">Health Score</div>
                        <div style={{ textAlign: "center", padding: "10px 0" }}>
                            <Ring size={100} stroke={8} pct={loc.sleep ? Math.min((loc.sleep / 8) * 100, 100) : 0} color="var(--rose)">
                                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: "var(--rose)", display: "block" }}>
                                    {loc.sleep ? Math.round((loc.sleep / 8) * 100) : 0}
                                </span>
                                <span style={{ fontSize: 9, color: "var(--t2)" }}>/100</span>
                            </Ring>
                        </div>
                        {[["Sleep Quality", "var(--teal)", loc.sleep ? Math.round((loc.sleep / 8) * 100) : 0], ["Activity", "var(--green)", loc.steps ? Math.min(Math.round((loc.steps / 10000) * 100), 100) : 0], ["Hydration", "var(--sky)", loc.water ? Math.min(Math.round((loc.water / 3) * 100), 100) : 0]].map(([l, c, v]) => (
                            <div key={l} style={{ marginBottom: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                    <span style={{ fontSize: 11 }}>{l}</span>
                                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: c }}>{v}</span>
                                </div>
                                <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 20, height: 5, overflow: "hidden" }}>
                                    <div style={{ width: v + "%", height: "100%", borderRadius: 20, background: c, transition: "width .8s ease" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card">
                        <div className="ct">Weekly Trend</div>
                        <div className="bch">
                            {weeklyHealth.map((h, i) => (
                                <div key={i} className="bc">
                                    <div className={"bb" + (i === 6 ? " act" : "")} style={{ height: h + "%", background: "var(--rose)" }} />
                                    <span style={{ fontSize: 9, color: "var(--t2)", marginTop: 4 }}>{["S", "M", "T", "W", "T", "F", "S"][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
