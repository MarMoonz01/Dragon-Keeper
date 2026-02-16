import React from 'react';
import { useGame } from '../context/GameContext';

export default function ChallengesCard() {
    const { challenges } = useGame();
    const { daily, weekly } = challenges || {};

    const renderChallenge = (c) => {
        const pct = Math.min(100, (c.current / c.target) * 100);
        return (
            <div key={c.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <div style={{ color: c.completed ? "var(--teal)" : "var(--t1)", textDecoration: c.completed ? "line-through" : "none" }}>
                        {c.text}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700 }}>+{c.reward} XP</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: c.completed ? "var(--teal)" : "var(--gold)", transition: "width 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--t2)", minWidth: 40, textAlign: "right" }}>
                        {c.current} / {c.target}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="ct" style={{ margin: 0 }}>📜 Quests</div>
                <div style={{ fontSize: 11, color: "var(--t2)" }}>Reset: Midnight</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Daily */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", marginBottom: 10, letterSpacing: 1 }}>Daily</div>
                    {daily && daily.length > 0 ? daily.map(renderChallenge) : <div style={{ fontSize: 12, color: "var(--t2)" }}>No active quests</div>}
                </div>

                {/* Weekly */}
                <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", marginBottom: 10, letterSpacing: 1 }}>Weekly</div>
                    {weekly && weekly.length > 0 ? weekly.map(renderChallenge) : <div style={{ fontSize: 12, color: "var(--t2)" }}>No active quests</div>}
                </div>
            </div>
        </div>
    );
}
