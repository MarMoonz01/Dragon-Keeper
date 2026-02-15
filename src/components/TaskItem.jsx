import React from 'react';
import { useGame } from '../context/GameContext';

const TaskItem = React.memo(({ t, editingId, editForm, setEditForm, saveEdit, cancelEdit, startEdit, onComplete, onFocus, onDelete, isNow }) => {
    const [showXp, setShowXp] = React.useState(false);

    const handleComplete = (e) => {
        e.stopPropagation();
        if (!t.done) {
            setShowXp(true);
            setTimeout(() => setShowXp(false), 1000); // Match animation duration
        }
        onComplete(t.id, t.xp);
    };

    return (
        <div key={t.id} style={{ position: "relative" }}>
            {showXp && (
                <span className="xp-float" style={{
                    position: "absolute",
                    top: 0,
                    right: 40,
                    color: "var(--gold)",
                    fontWeight: "bold",
                    fontSize: "14px",
                    zIndex: 10,
                    pointerEvents: "none",
                    animation: "floatUp 1s ease-out forwards"
                }}>
                    +{t.xp} XP
                </span>
            )}
            {editingId === t.id ? (
                <div className="task" style={{ flexDirection: "column", gap: 8, cursor: "default" }}>
                    <div style={{ display: "flex", gap: 8, width: "100%" }}>
                        <input className="inp" style={{ flex: 1, padding: "6px 10px", fontSize: 12 }} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} autoFocus onKeyDown={e => e.key === "Enter" && saveEdit()} />
                        <input className="inp" type="time" style={{ width: 90, padding: "6px 8px", fontSize: 11 }} value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} />
                    </div>
                    <div style={{ display: "flex", gap: 8, width: "100%", alignItems: "center" }}>
                        <select className="inp" style={{ width: 90, padding: "6px 8px", fontSize: 11 }} value={editForm.cat} onChange={e => setEditForm({ ...editForm, cat: e.target.value })}>
                            {["health", "work", "ielts", "mind", "social"].map(c => <option key={c}>{c}</option>)}
                        </select>
                        <input className="inp" type="number" min={5} max={100} style={{ width: 60, padding: "6px 8px", fontSize: 11 }} value={editForm.xp} onChange={e => setEditForm({ ...editForm, xp: e.target.value })} />
                        <span style={{ fontSize: 10, color: "var(--t3)" }}>XP</span>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                            <button className="btn btn-g btn-sm" style={{ padding: "4px 10px" }} onClick={saveEdit}>Save</button>
                            <button className="btn btn-gh btn-sm" style={{ padding: "4px 10px" }} onClick={cancelEdit}>✕</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={"task" + (t.done ? " done" : "")} style={{ position: "relative", alignItems: "center" }}>
                    {/* Task Check/Complete */}
                    <div className={"task-check" + (t.done ? " y" : "")}
                        onClick={handleComplete}
                        style={{
                            width: 20, height: 20, borderRadius: 6, border: "2px solid var(--bdr)",
                            marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", background: t.done ? "var(--teal)" : "transparent",
                            borderColor: t.done ? "var(--teal)" : "var(--bdr)", transition: "all .2s"
                        }}>
                        {t.done && "✓"}
                    </div>

                    <div style={{ flex: 1 }} onClick={() => !t.done && startEdit(t)}>
                        <div className="tn">{t.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                            <span className="tm">⏰ {t.time}</span>
                            {t.calSync && <span style={{ fontSize: 9, color: "var(--teal)" }}>📅</span>}
                            {isNow(t.time) && !t.done && <span className="badge bt" style={{ fontSize: 8, padding: "1px 6px", animation: "pulse 2s infinite" }}>⏰ NOW</span>}
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                            <span className={"cat c-" + t.cat}>{t.cat}</span>
                            <span className="xptag">+{t.xp}xp</span>
                        </div>
                        {!t.done && (
                            <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={(e) => { e.stopPropagation(); onFocus(t); }}
                                    style={{ background: "transparent", border: "1px solid var(--bdr)", borderRadius: 4, cursor: "pointer", fontSize: 13, color: "var(--t3)", transition: "all .2s", padding: "4px 6px" }}
                                    onMouseEnter={e => { e.target.style.color = "var(--t1)"; e.target.style.borderColor = "var(--t3)"; }}
                                    onMouseLeave={e => { e.target.style.color = "var(--t3)"; e.target.style.borderColor = "var(--bdr)"; }}
                                    title="Focus Mode" aria-label="Start focus mode">
                                    🍅
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                                    style={{ background: "transparent", border: "1px solid var(--bdr)", borderRadius: 4, cursor: "pointer", fontSize: 13, color: "var(--t3)", transition: "all .2s", padding: "4px 6px" }}
                                    onMouseEnter={e => { e.target.style.color = "var(--rose)"; e.target.style.borderColor = "var(--rose)"; }}
                                    onMouseLeave={e => { e.target.style.color = "var(--t3)"; e.target.style.borderColor = "var(--bdr)"; }}
                                    title="Delete task" aria-label="Delete task">
                                    🗑️
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

export default TaskItem;
