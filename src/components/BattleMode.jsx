import React, { useState, useEffect, useRef } from 'react';
import { generateRandomMonster } from '../utils/gameLogic';

export default function BattleMode({ tasks, defeated, onDefeat, level }) {
    // Generate initial monster based on dragon level
    const [monster, setMonster] = useState(() => generateRandomMonster(level || 1));
    const monRef = useRef(monster);
    monRef.current = monster;

    const [mhp, setMhp] = useState(monster.maxHp);
    const [dhp, setDhp] = useState(100);
    const [log, setLog] = useState(["⚔️ Battle begins! Complete tasks to attack!"]);
    const [shaking, setShaking] = useState(false);
    const [won, setWon] = useState(false);
    const [lost, setLost] = useState(false);
    const addLog = msg => setLog(l => [msg, ...l].slice(0, 10));

    const attack = t => {
        if (won || lost) return;
        const dmg = t.hp || 20;

        // 1. Player Attack
        setMhp(prev => {
            const nx = Math.max(0, prev - dmg);
            if (nx <= 0) {
                setWon(true);
                addLog("🎉 " + monRef.current.name + " defeated! +" + monRef.current.xp + " XP!");
                setTimeout(() => onDefeat(monRef.current.xp), 600);
            } else {
                // 2. Boss Counter-Attack (only if alive)
                setTimeout(() => {
                    const bossDmg = Math.floor(Math.random() * 12) + 8; // Slightly stronger counter
                    setDhp(p => {
                        const nd = Math.max(0, p - bossDmg);
                        if (nd <= 0) setLost(true);
                        return nd;
                    });
                    addLog("💥 " + monRef.current.name + " counters for " + bossDmg + "!");
                    setShaking(true); setTimeout(() => setShaking(false), 350);
                }, 600);
            }
            return nx;
        });

        addLog("⚡ " + t.name.substring(0, 22) + " deals " + dmg + " dmg!");
    };

    const nextBattle = () => {
        const nextMon = generateRandomMonster(level || 1);
        setMonster(nextMon);
        setMhp(nextMon.maxHp);
        setDhp(100);
        setWon(false);
        setLost(false);
        setLog(["⚔️ New battle begins!"]);
    };

    const doneTasks = tasks.filter(t => t.done);
    return (
        <div className="battle">
            <div className="ct">⚔️ Dragon Battle Mode</div>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div className={"mon-em" + (shaking ? " hit" : "")}>{monster.em}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{monster.name}</div>
                <div style={{ fontSize: 10, color: "var(--t2)" }}>Level {monster.lv} {monster.type || "Monster"}</div>
                <div className="mhpbar"><div className="mhpfill" style={{ width: `${mhp / monster.maxHp * 100}%` }} /></div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "var(--rose)" }}>{mhp}/{monster.maxHp} HP</div>
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
                    <div style={{ fontWeight: 700, color: won ? "var(--green)" : "var(--rose)" }}>{won ? `Victory! +${monster.xp} XP claimed` : "Defeated... Keep grinding!"}</div>
                    <button className="btn btn-v btn-sm" style={{ marginTop: 10 }} onClick={nextBattle}>
                        ⚔️ Next Battle
                    </button>
                </div>
            )}
        </div>
    );
}
