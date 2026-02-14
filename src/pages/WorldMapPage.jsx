import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ZONES, ZONE_MILESTONES, DRAGONS } from '../data/constants';
import { load, save } from '../utils/helpers';

const NODE_SIZE = 56;
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
    const [scoringNode, setScoringNode] = useState(null); // node being scored
    const [pendingScore, setPendingScore] = useState(3);

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

    const setDeadline = (date) => {
        const updated = { ...deadlines, [zone]: date };
        setDeadlines(updated);
        save("nx-deadlines", updated);
        // Reset quests for this zone
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
        // Deactivate other actives in zone
        nodes.forEach(n => {
            if (updated[n.id]?.status === "active") updated[n.id] = { ...updated[n.id], status: "available" };
        });
        updated[node.id] = { ...updated[node.id], status: "active" };
        setQuests(updated);
        save("nx-quests", updated);
        setSelected(node);
    };

    const completeQuest = (node) => {
        if (getStatus(node.id) !== "active") return;
        // Open scoring modal
        setScoringNode(node);
        setPendingScore(3);
        setSelected(null);
    };

    const submitScore = () => {
        const node = scoringNode;
        if (!node) return;

        setAnimating(node.id);
        setScoringNode(null);

        setTimeout(() => {
            const updated = { ...quests };
            updated[node.id] = {
                status: "cleared",
                score: pendingScore,
                completedAt: new Date().toISOString()
            };

            // Unlock next node
            const nextIdx = node.index + 1;
            if (nextIdx < nodes.length) {
                const nextNode = nodes[nextIdx];
                setPathLit({ from: node.id, to: nextNode.id });
                if (!updated[nextNode.id] || updated[nextNode.id].status === "locked") {
                    updated[nextNode.id] = { status: "available" };
                }
            }

            setTimeout(() => {
                setQuests(updated);
                save("nx-quests", updated);
                setAnimating(null);
                setTimeout(() => setPathLit(null), 800);
            }, 600);

            if (onXP) onXP(node.reward);

            const scoreLabels = ["", "😰 Struggled", "😐 Okay", "👍 Good", "💪 Great", "🏆 Perfect"];
            if (showToast) showToast("🏆", `${node.title} Complete!`, `+${node.reward} XP · ${scoreLabels[pendingScore]}`);
        }, 500);
    };

    // Calculate zone overall score
    const zoneScore = useMemo(() => {
        const scored = nodes.filter(n => quests[n.id]?.score);
        if (scored.length === 0) return null;
        return (scored.reduce((s, n) => s + quests[n.id].score, 0) / scored.length).toFixed(1);
    }, [nodes, quests]);

    const deadlineDays = zoneDeadline ? daysFromNow(zoneDeadline) : null;

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

    const renderNode = (node) => {
        const status = getStatus(node.id);
        const isBoss = node.type === "boss";
        const size = isBoss ? BOSS_SIZE : NODE_SIZE;
        const isAnimatingThis = animating === node.id;
        const dueDays = daysFromNow(node.dueDate);
        const isOverdue = status !== "cleared" && dueDays < 0;
        const isDueSoon = status !== "cleared" && dueDays >= 0 && dueDays <= 2;
        const score = quests[node.id]?.score;

        return (
            <div key={node.id}
                className={`wm-node ${status}${isBoss ? " boss" : ""}${isAnimatingThis ? " clearing" : ""}${isOverdue ? " overdue" : ""}`}
                style={{
                    left: `${node.x}%`, top: `${node.y}%`,
                    width: size, height: size,
                    transform: "translate(-50%, -50%)"
                }}
                onClick={() => {
                    if (status !== "locked") setSelected(node);
                }}
            >
                <div className="wm-node-em">
                    {status === "locked" ? "❓" : node.em}
                </div>
                {status === "cleared" && <div className="wm-node-check">✓</div>}
                {status === "active" && <div className="wm-node-pulse" />}
                {isBoss && status !== "locked" && <div className="wm-node-boss-label">BOSS</div>}

                {/* Score badge */}
                {score && (
                    <div className="wm-node-score">{"⭐".repeat(score)}</div>
                )}

                {/* Due date label */}
                <div className={`wm-node-due${isOverdue ? " overdue" : ""}${isDueSoon ? " soon" : ""}`}>
                    {status === "cleared" ? node.title : (isOverdue ? `⚠️ OVERDUE` : `${formatDate(node.dueDate)}`)}
                </div>
            </div>
        );
    };

    const zoneData = ZONES.find(z => z.id === zone);

    return (
        <div className="wmap-page">
            {/* Zone Tabs + Deadline */}
            <div className="wm-header">
                <div className="wm-title">
                    <span style={{ fontSize: 18 }}>🗺️</span>
                    <span style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 16, color: "var(--gold)" }}>World Map</span>
                    {deadlineDays !== null && (
                        <span className={`wm-countdown${deadlineDays <= 7 ? " urgent" : ""}`}>
                            ⏳ {deadlineDays > 0 ? `${deadlineDays}d left` : deadlineDays === 0 ? "TODAY!" : `${Math.abs(deadlineDays)}d overdue`}
                        </span>
                    )}
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

            {/* Deadline Setup or Map */}
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
                <div className="wm-container">
                    {/* Background */}
                    <div className="wm-bg" style={{
                        background: `radial-gradient(ellipse at 50% 100%, ${zoneData.color}15 0%, transparent 60%), radial-gradient(ellipse at 50% 0%, ${zoneData.color}08 0%, transparent 50%)`
                    }} />

                    {/* SVG Paths */}
                    <svg className="wm-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {renderPaths()}
                    </svg>

                    {/* Fog */}
                    <div className="wm-fog" />

                    {/* Nodes */}
                    {nodes.map(renderNode)}

                    {/* Dragon */}
                    {dragonNode && (
                        <div className="wm-dragon" style={{ left: `${dragonNode.x}%`, top: `${dragonNode.y - 8}%` }}>
                            <div className="wm-dragon-em">{dragonEmoji}</div>
                            <div className="wm-dragon-shadow" />
                        </div>
                    )}

                    {/* Zone Stats */}
                    <div className="wm-zone-stats">
                        <div className="wm-zone-stats-label">{zoneData.ic} {zoneData.name}</div>
                        <div className="wm-zone-stats-prog">
                            {nodes.filter(n => quests[n.id]?.status === "cleared").length} / {nodes.length} cleared
                            {zoneScore && <span style={{ marginLeft: 8, color: "var(--gold)" }}>· Avg ⭐ {zoneScore}/5</span>}
                        </div>
                        <div className="wm-zone-stats-bar">
                            <div style={{ width: `${(nodes.filter(n => quests[n.id]?.status === "cleared").length / nodes.length) * 100}%` }} />
                        </div>
                        <div style={{ fontSize: 9, color: "var(--t3)", marginTop: 6 }}>
                            Deadline: {formatDate(zoneDeadline)}
                            <span style={{ marginLeft: 8, cursor: "pointer", color: "var(--rose)" }}
                                onClick={() => { setDeadlines(prev => { const d = { ...prev }; delete d[zone]; save("nx-deadlines", d); return d; }); }}>
                                ✕ Reset
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Quest Detail Panel */}
            {selected && (
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

            {/* Scoring Modal */}
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
