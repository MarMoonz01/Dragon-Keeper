import React, { useState } from 'react';

export default function DailyCheckInModal({ onClose, onSave }) {
    const [metrics, setMetrics] = useState({
        mood: 3, energy: 3, focus: 3, sleep: 3, reflection: ""
    });

    const handleChange = (k, v) => setMetrics(prev => ({ ...prev, [k]: v }));

    const handleSubmit = () => {
        onSave(metrics);
        onClose();
    };

    const categories = [
        { id: "mood", label: "Mood", icon: "😊" },
        { id: "energy", label: "Energy", icon: "⚡" },
        { id: "focus", label: "Focus", icon: "🎯" },
        { id: "sleep", label: "Sleep Quality", icon: "💤" }
    ];

    return (
        <div className="mo">
            <div className="mc">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div className="mc-t" style={{ margin: 0 }}>🌙 End of Day Check-in</div>
                    <button className="btn btn-gh btn-sm" onClick={onClose}>✕</button>
                </div>

                <div style={{ marginBottom: 20, fontSize: 13, color: "var(--t2)" }}>
                    Take a moment to reflect. These metrics help AI tailor your schedule.
                </div>

                <div className="g2" style={{ gap: 12, marginBottom: 20 }}>
                    {categories.map(c => (
                        <div key={c.id} className="card" style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ fontSize: 18 }}>{c.icon}</div>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</div>
                            </div>
                            <div style={{ display: "flex", gap: 4 }}>
                                {[1, 2, 3, 4, 5].map(v => (
                                    <button
                                        key={v}
                                        className={"btn btn-sm " + (metrics[c.id] === v ? "btn-p" : "btn-gh")}
                                        style={{ width: 28, height: 28, padding: 0 }}
                                        onClick={() => handleChange(c.id, v)}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="fr">
                    <label>Reflection (Optional)</label>
                    <textarea
                        className="inp"
                        rows={3}
                        placeholder="What went well? What distracted you? Any quick notes..."
                        value={metrics.reflection}
                        onChange={e => handleChange("reflection", e.target.value)}
                    />
                </div>

                <div className="mac">
                    <button className="btn btn-p" style={{ width: "100%", justifyContent: "center" }} onClick={handleSubmit}>
                        Save & Generate Insights ✨
                    </button>
                </div>
            </div>
        </div>
    );
}
