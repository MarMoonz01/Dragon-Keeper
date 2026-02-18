import React from 'react';

const SKILL_COLORS = {
    listening: "var(--teal)",
    reading: "var(--violet)",
    writing: "var(--gold)",
    speaking: "var(--rose)",
    vocabulary: "#a78bfa",
    review: "var(--t2)",
};

const SKILL_ICONS = {
    listening: "🎧",
    reading: "📖",
    writing: "✍️",
    speaking: "🎤",
    vocabulary: "📝",
    review: "🔄",
};

const CAT_COLORS = {
    health: "var(--teal)",
    work: "var(--violet)",
    ielts: "var(--gold)",
    mind: "#a78bfa",
    social: "var(--rose)",
};

const CAT_ICONS = {
    health: "🏃",
    work: "💼",
    ielts: "📚",
    mind: "🧘",
    social: "👥",
};

export default function TaskDetailModal({ task, onClose, onComplete }) {
    if (!task) return null;
    const details = task.details || {};

    // Use skill-based color/icon for IELTS, cat-based for everything else
    const isIelts = task.cat === "ielts" && task.skill;
    const color = isIelts ? (SKILL_COLORS[task.skill] || CAT_COLORS[task.cat]) : (CAT_COLORS[task.cat] || "var(--teal)");
    const icon = isIelts ? (SKILL_ICONS[task.skill] || CAT_ICONS[task.cat]) : (CAT_ICONS[task.cat] || "📋");
    const badgeLabel = isIelts ? task.skill : task.cat;

    return (
        <div className="mo" onClick={onClose}>
            <div className="mc" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: "85vh", overflow: "auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 22 }}>{icon}</span>
                            <div className="mc-t" style={{ margin: 0, fontSize: 16 }}>{task.name}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            <span className="badge" style={{ background: `${color}22`, color, fontSize: 10, textTransform: "capitalize" }}>{badgeLabel}</span>
                            <span className="tm" style={{ fontSize: 11 }}>⏰ {task.time}</span>
                            <span className="xptag">+{task.xp}xp</span>
                        </div>
                    </div>
                    <button className="btn btn-gh btn-sm" onClick={onClose} style={{ flexShrink: 0 }}>✕</button>
                </div>

                {/* Objective */}
                {details.objective && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Objective</div>
                        <div style={{ fontSize: 13, color: "var(--t1)", lineHeight: 1.6, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `3px solid ${color}` }}>{details.objective}</div>
                    </div>
                )}

                {/* Materials */}
                {details.materials && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Materials Needed</div>
                        <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6, padding: "8px 12px", background: "rgba(167,139,250,0.06)", borderRadius: 8 }}>{details.materials}</div>
                    </div>
                )}

                {/* Step-by-Step Guide */}
                {details.steps && details.steps.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Step-by-Step Guide</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {details.steps.map((step, i) => (
                                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${color}22`, color, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                                    <div style={{ fontSize: 12, color: "var(--t1)", lineHeight: 1.6, paddingTop: 2 }}>{step}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Strategies & Tips */}
                {details.strategies && details.strategies.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Strategies & Tips</div>
                        <div style={{ padding: "8px 12px", background: "rgba(0,221,179,0.06)", borderRadius: 8 }}>
                            {details.strategies.map((s, i) => (
                                <div key={i} style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6, marginBottom: i < details.strategies.length - 1 ? 4 : 0 }}>
                                    💡 {s}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Time Breakdown */}
                {details.timeBreakdown && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Time Breakdown</div>
                        <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6, padding: "8px 12px", background: "rgba(240,192,64,0.06)", borderRadius: 8, fontFamily: "'JetBrains Mono',monospace" }}>{details.timeBreakdown}</div>
                    </div>
                )}

                {/* Common Mistakes */}
                {details.commonMistakes && (
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Common Mistakes to Avoid</div>
                        <div style={{ fontSize: 12, color: "var(--rose)", lineHeight: 1.6, padding: "8px 12px", background: "rgba(255,94,135,0.06)", borderRadius: 8 }}>{details.commonMistakes}</div>
                    </div>
                )}

                {/* Mark Complete */}
                {!task.done ? (
                    <button className="btn btn-g" style={{ width: "100%" }} onClick={() => { onComplete(task.id, task.xp); onClose(); }}>
                        Mark Complete (+{task.xp} XP)
                    </button>
                ) : (
                    <div style={{ textAlign: "center", fontSize: 12, color: "var(--teal)", fontWeight: 700, padding: "10px 0" }}>
                        ✓ Completed
                    </div>
                )}
            </div>
        </div>
    );
}
