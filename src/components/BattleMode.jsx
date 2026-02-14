import React, { useState, useEffect, useRef } from 'react';
import { MONSTERS } from '../data/constants';

export default function BattleMode({ tasks, defeated, onDefeat }) {
    const mi = Math.min(Math.floor(defeated / 2), MONSTERS.length - 1);
    const M = MONSTERS[mi];
    const monRef = useRef(M);
    monRef.current = M;

    const [mhp, setMhp] = useState(M.maxHp);
    const [dhp, setDhp] = useState(100);
    const [log, setLog] = useState(["⚔️ Battle begins! Complete tasks to attack!"]);
    const [shaking, setShaking] = useState(false);
    const [won, setWon] = useState(false);
    const [lost, setLost] = useState(false);
    const addLog = msg => setLog(l => [msg, ...l].slice(0, 10));

    const attack = t => {
        if (won || lost) return;
        const dmg = t.hp || 20;
        setMhp(prev => {
            const nx = Math.max(0, prev - dmg);
            if (nx <= 0) { setWon(true); addLog("🎉 " + monRef.current.name + " defeated! +" + monRef.current.reward + " XP!"); setTimeout(() => onDefeat(monRef.current.reward), 600); }
            return nx;
        });
        setShaking(true); setTimeout(() => setShaking(false), 350);
        addLog("⚡ " + t.name.substring(0, 22) + " deals " + dmg + " dmg!");
    };

    useEffect(() => {
        if (won || lost) return;
        const t = setInterval(() => {
            const dmg = Math.floor(Math.random() * 12) + 4;
            setDhp(p => { const nx = Math.max(0, p - dmg); if (nx <= 0) setLost(true); return nx; });
            addLog("💥 " + monRef.current.name + " attacks for " + dmg + "!");
        }, 7000);
        return () => clearInterval(t);
    }, [won, lost]);

    const doneTasks = tasks.filter(t => t.done);
    return (
        <div className="battle">
            <div className="ct">⚔️ Dragon Battle Mode</div>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div className={"mon-em" + (shaking ? " hit" : "")}>{M.em}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{M.name}</div>
                <div style={{ fontSize: 10, color: "var(--t2)" }}>Level {M.level} Boss</div>
                <div className="mhpbar"><div className="mhpfill" style={{ width: `${mhp / M.maxHp * 100}%` }} /></div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "var(--rose)" }}>{mhp}/{M.maxHp} HP</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "var(--t2)" }}>🐉 Dragon HP</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "var(--teal)" }}>{dhp}/100</span>
            </div>
            <div className="dhpbar"><div className="dhpfill" style={{ width: `${dhp}%` }} /></div>
            <div style={{ margin: "10px 0 5px", fontSize: 10, color: "var(--t2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>Completed tasks = attacks:</div>
            {doneTasks.length === 0 && <div style={{ fontSize: 11, color: "var(--t3)", padding: "6px 0" }}>Complete tasks on Dashboard to unlock attacks!</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {doneTasks.slice(0, 4).map(t => (
                    <button key={t.id} className="btn btn-r btn-sm" onClick={() => attack(t)} disabled={won || lost}>
                        ⚡ {t.name.split(" ")[0]} ({t.hp || 20})
                    </button>
                ))}
            </div>
            <div className="blog">{log.map((l, i) => <div key={i}>{l}</div>)}</div>
            {(won || lost) && (
                <div style={{ textAlign: "center", marginTop: 10, padding: 10, background: won ? "rgba(52,211,153,.1)" : "rgba(255,94,135,.1)", borderRadius: 9, border: `1px solid ${won ? "rgba(52,211,153,.2)" : "rgba(255,94,135,.2)"}` }}>
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{won ? "🏆" : "💀"}</div>
                    <div style={{ fontWeight: 700, color: won ? "var(--green)" : "var(--rose)" }}>{won ? `Victory! +${M.reward} XP claimed` : "Defeated... Keep grinding!"}</div>
                    <button className="btn btn-v btn-sm" style={{ marginTop: 10 }} onClick={() => { setMhp(M.maxHp); setDhp(100); setWon(false); setLost(false); setLog(["⚔️ New battle begins!"]); }}>
                        ⚔️ Next Battle
                    </button>
                </div>
            )}
        </div>
    );
}
