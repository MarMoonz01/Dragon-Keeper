import React from 'react';
import { DRAGONS } from '../data/constants';

export default function DragonPanel({ xp, lv, done, streak, tasks = [], stage, nextStage, skill }) {
    const mxp = lv * 100, pct = (xp % mxp) / mxp * 100;

    // Fallback if stage not passed (e.g. during refactor)
    const currentStage = stage || DRAGONS[0];
    const currentBand = skill?.band || 5.5;

    // Compute badges dynamically
    const doneTasks = tasks.filter(t => t.done);
    const badges = [];
    if (doneTasks.filter(t => t.cat === "mind").length >= 3) badges.push("🧘 Mindful");
    if (doneTasks.filter(t => t.cat === "health").length >= 3) badges.push("🏋️ Active");
    if (doneTasks.filter(t => t.cat === "ielts").length >= 3) badges.push("📚 Scholar");
    if (streak >= 7) badges.push("🔥 Dedicated");
    if (lv >= 5) badges.push("⚡ Veteran");
    if (currentBand >= 7.0) badges.push("👑 Band 7+");

    return (
        <div className="dr-wrap">
            <span className="dr-em">{currentStage.em}</span>
            <div className="dr-name">{currentStage.name}</div>
            <div className="dr-lv">✦ Level {lv} · {currentStage.trait} ✦</div>

            {/* XP Bar */}
            <div className="xpbar"><div className="xpfill" style={{ width: `${pct}%` }} /></div>
            <div className="xplbl">{xp % mxp} / {mxp} XP to next level</div>

            {/* Evolution Requirement (if next stage exists) */}
            {nextStage && (
                <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 11 }}>
                    <div style={{ color: "var(--t2)", textTransform: "uppercase", fontSize: 9, fontWeight: 700, marginBottom: 4 }}>Next Evolution: {nextStage.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: lv >= nextStage.lv ? "var(--teal)" : "var(--t2)" }}>
                                {lv >= nextStage.lv ? "✅" : "⭕"} Lv.{nextStage.lv}
                            </span>
                            <span style={{ color: "var(--t3)" }}>+</span>
                            <span style={{ color: currentBand >= (nextStage.minBand || 0) ? "var(--teal)" : "var(--t2)" }}>
                                {currentBand >= (nextStage.minBand || 0) ? "✅" : "⭕"} Band {nextStage.minBand || 0}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="dr-stats" style={{ marginTop: 12 }}>
                <div className="ds"><span className="dsv">{done}</span><span className="dsl">Done</span></div>
                <div className="ds"><span className="dsv">{streak}🔥</span><span className="dsl">Streak</span></div>
                <div className="ds"><span className="dsv">{xp}</span><span className="dsl">XP</span></div>
            </div>
            {badges.length > 0 && (
                <div className="str">
                    {badges.map(b => <div key={b} className="sb3">{b}</div>)}
                </div>
            )}
        </div>
    );
}
