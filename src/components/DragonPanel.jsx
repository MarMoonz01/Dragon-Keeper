import React from 'react';
import { DRAGONS } from '../data/constants';

export default function DragonPanel({ xp, lv, done, streak, tasks = [] }) {
    const mxp = lv * 100, pct = (xp % mxp) / mxp * 100;
    const stage = DRAGONS.reduce((s, st) => lv >= st.lv ? st : s, DRAGONS[0]);

    // Compute badges dynamically from actual task behavior
    const doneTasks = tasks.filter(t => t.done);
    const badges = [];
    if (doneTasks.filter(t => t.cat === "mind").length >= 3) badges.push("🧘 Mindful");
    if (doneTasks.filter(t => t.cat === "health").length >= 3) badges.push("🏋️ Active");
    if (doneTasks.filter(t => t.cat === "ielts").length >= 3) badges.push("📚 Scholar");
    if (streak >= 7) badges.push("🔥 Dedicated");
    if (lv >= 5) badges.push("⚡ Veteran");

    return (
        <div className="dr-wrap">
            <span className="dr-em">{stage.em}</span>
            <div className="dr-name">{stage.name}</div>
            <div className="dr-lv">✦ Level {lv} · {stage.trait} ✦</div>
            <div className="xpbar"><div className="xpfill" style={{ width: `${pct}%` }} /></div>
            <div className="xplbl">{xp % mxp} / {mxp} XP to next level</div>
            <div className="dr-stats">
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
