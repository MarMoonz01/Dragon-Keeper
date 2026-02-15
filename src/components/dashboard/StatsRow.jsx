import React from 'react';
import { useGame } from '../../context/GameContext';
import { useTasks } from '../../context/TaskContext';

export default function StatsRow({ setShowShop }) {
    const { updateStats, dragon, stats } = useGame();
    const { tasks, showToast } = useTasks();
    const streak = stats.streak || 0;

    const doneCount = tasks.filter(t => t.done).length;
    const pct = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;
    const xpToday = tasks.filter(t => t.done).reduce((a, t) => a + t.xp, 0);
    const ieltsDone = tasks.filter(t => t.cat === "ielts" && t.done).length;

    const items = [
        { ic: "⚡", v: pct + "%", l: "Daily Progress", ch: "+15% vs yesterday", pos: true, c: "var(--teal)" },
        {
            ic: "🏅", v: dragon.xp, l: "Total XP",
            ch: "+" + xpToday + " today", pos: true, c: "var(--gold)",
            action: { label: "🛒 SHOP", onClick: () => setShowShop(true) }
        },
        { ic: "📚", v: ieltsDone + "/3", l: "IELTS Done", ch: "On track", pos: true, c: "var(--violet)" },
        {
            ic: "❤️", v: stats.healthScore || 0, l: "Health Score",
            ch: "Streak: " + streak + "d 🔥" + (stats.streakFreezes ? " 🧊×" + stats.streakFreezes : ""),
            pos: true, c: "var(--rose)", freezes: stats.streakFreezes || 0
        },
    ];

    const handleFreeze = (freezes) => {
        if (window.confirm(`Use 1 Streak Freeze? (${freezes} remaining)\n\nYour streak will be preserved even if you miss tasks today.`)) {
            updateStats({ streakFreezes: freezes - 1 });
            showToast("🧊", "Streak Freeze Used", "Streak preserved!");
        }
    };

    return (
        <div className="g4" style={{ marginBottom: 18 }}>
            {items.map((s, i) => (
                <div key={i} className="sc">
                    <div className="sc-ic">{s.ic}</div>
                    <div className="sc-v" style={{ color: s.c }}>{s.v}</div>
                    <div className="sc-l">{s.l}</div>
                    <div className={"sc-ch " + (s.pos ? "pos" : "neg")} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {s.ch}
                        {s.freezes > 0 && (
                            <button
                                onClick={() => handleFreeze(s.freezes)}
                                style={{
                                    background: "rgba(56,189,248,.12)", border: "1px solid rgba(56,189,248,.3)",
                                    borderRadius: 6, cursor: "pointer", padding: "2px 6px",
                                    fontSize: 9, color: "var(--sky)", fontWeight: 700
                                }}
                                aria-label="Use streak freeze"
                                title="Use streak freeze to preserve your streak"
                            >
                                USE
                            </button>
                        )}
                        {s.action && (
                            <button
                                onClick={s.action.onClick}
                                style={{
                                    background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)",
                                    borderRadius: 6, cursor: "pointer", padding: "2px 6px",
                                    fontSize: 9, color: "var(--gold)", fontWeight: 700, marginLeft: 6
                                }}
                            >
                                {s.action.label}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
