import React from 'react';
import { DRAGONS } from '../data/constants';

export default function DragonPanel({ xp, lv, done, streak }) {
    const mxp = lv * 100, pct = (xp % mxp) / mxp * 100;
    const stage = DRAGONS.reduce((s, st) => lv >= st.lv ? st : s, DRAGONS[0]);
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
            <div className="str">
                {["🧘 Mindful", "🏋️ Active", "📚 Scholar"].map(b => <div key={b} className="sb3">{b}</div>)}
            </div>
        </div>
    );
}
