import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ZONES, ZONE_MILESTONES, DRAGONS } from '../data/constants';
import { load, save } from '../utils/helpers';
import MapNode from '../components/MapNode';

const BOSS_SIZE = 72;

// Generate milestone nodes with due dates from deadline
function generatePath(zoneId, deadline) {
    const milestones = ZONE_MILESTONES[zoneId];
    if (!milestones || !deadline) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(deadline);
    end.setHours(23, 59, 59, 999);
    const totalDays = Math.max(1, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

    const totalWeight = milestones.reduce((s, m) => s + m.weight, 0);
    let dayAccum = 0;

    return milestones.map((m, i) => {
        dayAccum += (m.weight / totalWeight) * totalDays;
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + Math.round(dayAccum));
        if (i === milestones.length - 1) dueDate.setTime(end.getTime()); // Last node = deadline

        // Zigzag x positions for visual interest
        const xPositions = [50, 35, 65, 40, 60, 50, 35, 65, 45, 50];
        const x = xPositions[i % xPositions.length];
        const y = 90 - (i / (milestones.length - 1)) * 82; // 90 (bottom) → 8 (top)

        return {
            id: `${zoneId}_${m.key}`,
            ...m,
            x, y: Math.round(y),
            dueDate: dueDate.toISOString().split('T')[0],
            dueDateObj: dueDate,
            index: i
        };
    });
}

function formatDate(d) {
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function daysFromNow(d) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const target = new Date(d); target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export default function WorldMapPage({ dragon, stats, showToast, onXP }) {
    const [zone, setZone] = useState("scholar");
    const [quests, setQuests] = useState({});      // { nodeId: { status, score, completedAt } }
    const [deadlines, setDeadlines] = useState({}); // { zoneId: "YYYY-MM-DD" }
    const [selected, setSelected] = useState(null);
    const [animating, setAnimating] = useState(null);
    const [pathLit, setPathLit] = useState(null);
    const [scoringNode, setScoringNode] = useState(null);
    const [pendingScore, setPendingScore] = useState(3);
    const [viewMode, setViewMode] = useState("map"); // "map" or "plan"

    // Load state
    useEffect(() => {
        const q = load("nx-quests"); if (q) setQuests(q);
        const d = load("nx-deadlines"); if (d) setDeadlines(d);
    }, []);

    const zoneDeadline = deadlines[zone];
    const nodes = useMemo(() => zoneDeadline ? generatePath(zone, zoneDeadline) : [], [zone, zoneDeadline]);

    const dragonEmoji = useMemo(() =>
        DRAGONS.reduce((s, st) => dragon.level >= st.lv ? st : s, DRAGONS[0]).em,
        [dragon.level]
    );

    const getStatus = useCallback((nodeId) => quests[nodeId]?.status || "locked", [quests]);

    // Auto-set first node available when deadline set
    useEffect(() => {
        if (nodes.length > 0 && !quests[nodes[0].id]) {
            setQuests(prev => {
                const updated = { ...prev, [nodes[0].id]: { status: "available" } };
                save("nx-quests", updated);
                return updated;
            });
        }
    }, [nodes]);

    const activeNode = useMemo(() =>
        nodes.find(n => quests[n.id]?.status === "active"),
        [nodes, quests]
    );

    const dragonNode = useMemo(() => {
        if (activeNode) return activeNode;
        const cleared = [...nodes].reverse().find(n => quests[n.id]?.status === "cleared");
        return cleared || nodes[nodes.length - 1];
    }, [activeNode, nodes, quests]);

    // Calculate Stats for Sidebar
    const totalStars = useMemo(() => {
        return Object.values(quests).reduce((sum, q) => sum + (q.score || 0), 0);
    }, [quests]);

    const totalMaxStars = useMemo(() => {
        const totalNodes = Object.keys(ZONE_MILESTONES).reduce((acc, z) => acc + ZONE_MILESTONES[z].length, 0);
        return totalNodes * 5;
    }, []);

    const setDeadline = (date) => {
        const updated = { ...deadlines, [zone]: date };
        setDeadlines(updated);
        save("nx-deadlines", updated);
        const newQuests = { ...quests };
        ZONE_MILESTONES[zone]?.forEach((m, i) => {
            const nid = `${zone}_${m.key}`;
            newQuests[nid] = { status: i === 0 ? "available" : "locked" };
        });
        setQuests(newQuests);
        save("nx-quests", newQuests);
    };

    const startQuest = (node) => {
        if (getStatus(node.id) !== "available") return;
        const updated = { ...quests };
        nodes.forEach(n => {
            if (updated[n.id]?.status === "active") updated[n.id] = { ...updated[n.id], status: "available" };
        });
        updated[node.id] = { ...updated[node.id], status: "active" };
        setQuests(updated);
        save("nx-quests", updated);
        if (viewMode === "map") setSelected(node);
    };

    const completeQuest = (node) => {
        if (getStatus(node.id) !== "active") return;
        setScoringNode(node);
        setPendingScore(3);
        setSelected(null);
    };

    const submitScore = () => {
        const node = scoringNode;
        if (!node) return;

        if (viewMode === "map") setAnimating(node.id);
        setScoringNode(null);

        setTimeout(() => {
            const updated = { ...quests };
            updated[node.id] = {
                status: "cleared",
                score: pendingScore,
                completedAt: new Date().toISOString()
            };

            const nextIdx = node.index + 1;
            if (nextIdx < nodes.length) {
                const nextNode = nodes[nextIdx];
                if (viewMode === "map") setPathLit({ from: node.id, to: nextNode.id });
                if (!updated[nextNode.id] || updated[nextNode.id].status === "locked") {
                    updated[nextNode.id] = { status: "available" };
                }
            }

            setTimeout(() => {
                setQuests(updated);
                save("nx-quests", updated);
                setAnimating(null);
                setTimeout(() => setPathLit(null), 800);
            }, viewMode === "map" ? 600 : 0);

            if (onXP) onXP(node.reward);
            const scoreLabels = ["", "😰 Struggled", "😐 Okay", "👍 Good", "💪 Great", "🏆 Perfect"];
            if (showToast) showToast("🏆", `${node.title} Complete!`, `+${node.reward} XP · ${scoreLabels[pendingScore]}`);
        }, 500);
    };

    const deadlineDays = zoneDeadline ? daysFromNow(zoneDeadline) : null;
    const zoneData = ZONES.find(z => z.id === zone);

    const renderPaths = () => {
        const paths = [];
        for (let i = 1; i < nodes.length; i++) {
            const prev = nodes[i - 1];
            const curr = nodes[i];
            const isLit = pathLit && pathLit.from === prev.id && pathLit.to === curr.id;
            const isCleared = quests[prev.id]?.status === "cleared" && getStatus(curr.id) !== "locked";
            paths.push(
                <line key={`${prev.id}-${curr.id}`}
                    x1={`${prev.x}%`} y1={`${prev.y}%`}
                    x2={`${curr.x}%`} y2={`${curr.y}%`}
                    className={`wm-path${isCleared ? " lit" : ""}${isLit ? " lighting" : ""}`}
                />
            );
        }
        return paths;
    };

    const renderNode = useCallback((node) => (
        <MapNode
            key={node.id}
            node={node}
            status={getStatus(node.id)}
            score={quests[node.id]?.score}
            animating={animating}
            onClick={(n) => { if (getStatus(n.id) !== "locked") setSelected(n); }}
        />
    ), [getStatus, quests, animating]);

    // Render Plan View (Grid)
    const renderPlanView = () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, padding: "0 24px 80px", overflowY: "auto", height: "100%" }}>
            {nodes.map(node => {
                const status = getStatus(node.id);
                const dueDays = daysFromNow(node.dueDate);
                const isOverdue = status !== "cleared" && dueDays < 0;
                const score = quests[node.id]?.score;
                const borderColor = status === "cleared" ? "var(--green)" : status === "active" ? "var(--gold)" : "var(--bdr)";
                const bgColor = status === "cleared" ? "rgba(52,211,153,0.05)" : status === "active" ? "rgba(255,184,0,0.05)" : "var(--bg-card)";

                return (
                    <div key={node.id} style={{
                        background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 0,
                        opacity: status === "locked" ? 0.6 : 1, transition: "transform 0.2s",
                        cursor: status !== "locked" ? "pointer" : "default"
                    }} onClick={() => { if (status !== "locked") setSelected(node); }}>
                        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: status === "active" ? "rgba(255,184,0,0.1)" : "transparent" }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--t1)" }}>{node.title}</div>
                            <div style={{ fontSize: 11, color: isOverdue ? "var(--rose)" : "var(--t2)" }}>{isOverdue ? "⚠️ Overdue" : formatDate(node.dueDate)}</div>
                        </div>
                        <div style={{ padding: 16, display: "flex", gap: 12 }}>
                            <div style={{ fontSize: 32 }}>{status === "locked" ? "❓" : node.em}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 8, lineHeight: 1.4 }}>{status === "locked" ? "???" : node.desc}</div>
                                <div style={{ display: "flex", gap: 12, fontSize: 11, fontWeight: 700, color: "var(--t2)" }}>
                                    <span>✨ {node.reward} XP</span>
                                    {score && <span style={{ color: "var(--gold)" }}>⭐ {score}/5</span>}
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: "0 16px 16px" }}>
                            {status === "available" && <button className="btn btn-g btn-sm" style={{ width: "100%" }} onClick={(e) => { e.stopPropagation(); startQuest(node); }}>Start Quest</button>}
                            {status === "active" && <button className="btn btn-p btn-sm" style={{ width: "100%", background: "linear-gradient(135deg, var(--teal), var(--violet))" }} onClick={(e) => { e.stopPropagation(); completeQuest(node); }}>Complete & Rate</button>}
                            {status === "cleared" && <div style={{ textAlign: "center", fontSize: 11, color: "var(--green)", fontWeight: 700 }}>✅ Completed</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="wmap-page" style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>


            {/* Header */}
            <div className="wm-header" style={{ flexShrink: 0 }}>
                <div className="wm-title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>🗺️</span>
                    <span style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 16, color: "var(--gold)" }}>World Map</span>
                    {deadlineDays !== null && (
                        <span className={`wm-countdown${deadlineDays <= 7 ? " urgent" : ""}`}>
                            ⏳ {deadlineDays > 0 ? `${deadlineDays}d left` : deadlineDays === 0 ? "TODAY!" : `${Math.abs(deadlineDays)}d overdue`}
                        </span>
                    )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <div className="join">
                        <button className={`btn btn-sm ${viewMode === "map" ? "btn-g" : "btn-gh"}`} onClick={() => setViewMode("map")}>🗺️ Map</button>
                        <button className={`btn btn-sm ${viewMode === "plan" ? "btn-g" : "btn-gh"}`} onClick={() => setViewMode("plan")}>📅 Plan</button>
                    </div>
                </div>

                <div className="wm-zones">
                    {ZONES.map(z => (
                        <button key={z.id}
                            className={`wm-zone-tab${zone === z.id ? " active" : ""}`}
                            style={{ "--zone-color": z.color }}
                            onClick={() => { setZone(z.id); setSelected(null); }}
                        >
                            <span className="wm-zone-ic">{z.ic}</span>
                            <span className="wm-zone-name">{z.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="wmap-layout">
                <div className="wmap-main">
                    {/* Setup or Content */}
                    {!zoneDeadline ? (
                        <div className="wm-setup">
                            <div className="wm-setup-card">
                                <div style={{ fontSize: 48, marginBottom: 12 }}>{zoneData.ic}</div>
                                <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 18, color: "var(--gold)", marginBottom: 6 }}>{zoneData.name}</div>
                                <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 24, lineHeight: 1.7 }}>
                                    Set your deadline to generate a personalized quest path.<br />
                                    Milestones will be spaced proportionally across your timeline.
                                </div>
                                <div className="fr" style={{ marginBottom: 16 }}>
                                    <label>{zoneData.goalLabel}</label>
                                    <input className="inp" type="date" id="deadline-input"
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{ fontSize: 14, padding: 12 }}
                                    />
                                </div>
                                <button className="btn btn-g" style={{ width: "100%", padding: 14, fontSize: 14, justifyContent: "center" }}
                                    onClick={() => {
                                        const val = document.getElementById('deadline-input').value;
                                        if (val) setDeadline(val);
                                        else if (showToast) showToast("⚠️", "No Date", "Pick a deadline first");
                                    }}
                                >
                                    🗺️ Generate Quest Path
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {viewMode === "map" ? (
                                <div className="wm-container" style={{ flex: 1, position: "relative" }}>
                                    <div className="wm-bg" style={{
                                        background: `radial-gradient(ellipse at 50% 100%, ${zoneData.color}15 0%, transparent 60%), radial-gradient(ellipse at 50% 0%, ${zoneData.color}08 0%, transparent 50%)`
                                    }} />
                                    <svg className="wm-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        {renderPaths()}
                                    </svg>
                                    <div className="wm-fog" />
                                    {nodes.map(renderNode)}
                                    {dragonNode && (
                                        <div className="wm-dragon" style={{ left: `${dragonNode.x}%`, top: `${dragonNode.y - 8}%` }}>
                                            <div className="wm-dragon-em">{dragonEmoji}</div>
                                            <div className="wm-dragon-shadow" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ flex: 1, overflow: "hidden", paddingTop: 20 }}>
                                    {renderPlanView()}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar (Right) */}
                <div className="wmap-sidebar">
                    <div style={{ padding: 24, borderBottom: "1px solid var(--bdr)" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Journey Stats</div>

                        <div className="g2" style={{ gap: 12 }}>
                            <div className="card" style={{ padding: 12, textAlign: "center" }}>
                                <div style={{ fontSize: 24 }}>{deadlineDays || "-"}</div>
                                <div style={{ fontSize: 10, color: "var(--t2)" }}>Days Left</div>
                            </div>
                            <div className="card" style={{ padding: 12, textAlign: "center" }}>
                                <div style={{ fontSize: 24 }}>{totalStars}</div>
                                <div style={{ fontSize: 10, color: "var(--t2)" }}>Total Stars</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                                <span>Progress</span>
                                <span>{nodes.filter(n => quests[n.id]?.status === "cleared").length}/{nodes.length} Milestones</span>
                            </div>
                            <div className="ach-pb"><div className="ach-pf" style={{ width: (nodes.filter(n => quests[n.id]?.status === "cleared").length / nodes.length * 100) + "%" }}></div></div>
                        </div>
                    </div>

                    <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                        <div style={{ fontSize: 64, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>{dragonEmoji}</div>
                        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 12, position: "relative", maxWidth: 220 }}>
                            <div style={{ position: "absolute", top: -8, left: "50%", width: 16, height: 16, background: "var(--bg2)", transform: "translateX(-50%) rotate(45deg)" }}></div>
                            <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--t1)", lineHeight: 1.5 }}>
                                "Every step on this map brings you closer to mastery. Keep pushing forward, Hunter!"
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: 24, borderTop: "1px solid var(--bdr)" }}>
                        <div style={{ fontSize: 11, color: "var(--t3)", textAlign: "center" }}>
                            Deadline: {zoneDeadline ? formatDate(zoneDeadline) : "Not set"}
                            {zoneDeadline && <span style={{ marginLeft: 8, cursor: "pointer", color: "var(--rose)" }} onClick={() => { setDeadlines(prev => { const d = { ...prev }; delete d[zone]; save("nx-deadlines", d); return d; }); }}>Reset</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Click Modal (Reused) */}
            {selected && viewMode === "map" && (
                <div className="wm-panel" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
                    <div className="wm-panel-card">
                        <button className="wm-panel-close" onClick={() => setSelected(null)}>✕</button>
                        <div className="wm-panel-header">
                            <div className="wm-panel-em" style={{ borderColor: zoneData.color }}>{selected.em}</div>
                            <div>
                                <div className="wm-panel-title">{selected.title}</div>
                                <div className="wm-panel-zone">
                                    {zoneData.ic} {zoneData.name} · Due {formatDate(selected.dueDate)}
                                    {daysFromNow(selected.dueDate) < 0 && <span style={{ color: "var(--rose)", marginLeft: 6 }}>⚠️ OVERDUE</span>}
                                </div>
                            </div>
                            {selected.type === "boss" && <span className="wm-panel-boss">💀 BOSS</span>}
                        </div>
                        <div className="wm-panel-desc">{selected.desc}</div>
                        <div className="wm-panel-rewards">
                            <div className="wm-panel-reward"><span>✨</span> {selected.reward} XP</div>
                            <div className="wm-panel-reward"><span>📅</span> {formatDate(selected.dueDate)}</div>
                            {quests[selected.id]?.score && (
                                <div className="wm-panel-reward"><span>⭐</span> Score: {quests[selected.id].score}/5</div>
                            )}
                        </div>
                        <div className="wm-panel-actions">
                            {getStatus(selected.id) === "available" && (
                                <button className="btn btn-g" style={{ flex: 1 }} onClick={() => startQuest(selected)}>⚔️ Start Quest</button>
                            )}
                            {getStatus(selected.id) === "active" && (
                                <button className="btn btn-p" style={{ flex: 1, background: "linear-gradient(135deg, var(--teal), var(--violet))" }}
                                    onClick={() => completeQuest(selected)}>✅ Complete & Rate</button>
                            )}
                            {getStatus(selected.id) === "cleared" && (
                                <div style={{ textAlign: "center", color: "var(--gold)", fontWeight: 700, fontSize: 13, padding: "8px 0" }}>
                                    ✅ Cleared! {"⭐".repeat(quests[selected.id]?.score || 0)} +{selected.reward} XP
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Scoring Modal (Reused) */}
            {scoringNode && (
                <div className="wm-panel" onClick={e => { if (e.target === e.currentTarget) setScoringNode(null); }}>
                    <div className="wm-panel-card" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>{scoringNode.em}</div>
                        <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 16, color: "var(--gold)", marginBottom: 4 }}>
                            {scoringNode.title}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 20 }}>
                            How well did you do on this milestone?
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <button key={s}
                                    className={`wm-score-btn${pendingScore === s ? " active" : ""}`}
                                    onClick={() => setPendingScore(s)}
                                >
                                    <div style={{ fontSize: 20 }}>{"⭐".repeat(s)}</div>
                                    <div style={{ fontSize: 9, marginTop: 4 }}>
                                        {["", "Weak", "Okay", "Good", "Great", "Perfect"][s]}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button className="btn btn-g" style={{ width: "100%", padding: 14, fontSize: 14, justifyContent: "center" }}
                            onClick={submitScore}>
                            🏆 Submit Score & Complete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
