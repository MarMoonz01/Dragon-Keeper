import React, { useState, useEffect, useMemo } from 'react';
import Loader from '../Loader';
import TaskDetailModal from './TaskDetailModal';
import { ai } from '../../utils/helpers';
import { useIELTS } from '../../context/IELTSContext';
import { useGame } from '../../context/GameContext';
import { supabase } from '../../utils/supabaseClient';
import { useTasks } from '../../context/TaskContext';

const EXAM_DATE = new Date('2025-03-02');

const SKILL_COLORS = {
    listening: "var(--teal)", reading: "var(--violet)", writing: "var(--gold)",
    speaking: "var(--rose)", vocabulary: "#a78bfa", review: "var(--t2)",
};
const SKILL_ICONS = {
    listening: "🎧", reading: "📖", writing: "✍️",
    speaking: "🎤", vocabulary: "📝", review: "🔄",
};

export default function IELTSSchedule() {
    const { realScores, ieltsTarget } = useIELTS();
    const { addXP } = useGame();
    const { tasks: dashTasks, setTasks: setDashTasks } = useTasks();

    const todayStr = new Date().toISOString().split("T")[0];
    const cacheKey = "nx-ielts-schedule-" + todayStr;

    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    // Load from cache on mount
    useEffect(() => {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) { setBlocks(parsed); return; }
            } catch { /* regenerate */ }
        }
    }, []);

    // Exam countdown
    const daysUntilExam = useMemo(() => {
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const diff = Math.ceil((EXAM_DATE - now) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    }, []);

    // Latest scores
    const latestScore = realScores && realScores.length > 0 ? realScores[0] : null;

    // Compute weak skills
    const skillGaps = useMemo(() => {
        if (!latestScore) return [];
        const target = parseFloat(ieltsTarget) || 7;
        const skills = ["listening", "reading", "writing", "speaking"];
        return skills.map(s => ({
            skill: s,
            current: latestScore[s] || 0,
            gap: target - (latestScore[s] || 0),
        })).sort((a, b) => b.gap - a.gap);
    }, [latestScore, ieltsTarget]);

    const weakestSkill = skillGaps.length > 0 && skillGaps[0].gap > 0 ? skillGaps[0].skill : null;

    // Progress
    const completedCount = blocks.filter(b => b.done).length;
    const totalCount = blocks.length;
    const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

    const generateSchedule = async () => {
        setLoading(true);
        try {
            // Fetch writing sub-scores if available
            let writingCtx = "";
            if (supabase) {
                try {
                    const { data } = await supabase.from('writing_history').select('band,ta,cc,lr,gra').order('created_at', { ascending: false }).limit(3);
                    if (data && data.length > 0) {
                        const avg = (key) => (data.reduce((sum, d) => sum + (d[key] || 0), 0) / data.length).toFixed(1);
                        writingCtx = `Writing sub-scores (avg of last ${data.length}): TA ${avg('ta')}, CC ${avg('cc')}, LR ${avg('lr')}, GRA ${avg('gra')}.`;
                    }
                } catch { /* no writing history */ }
            }

            const scoreCtx = latestScore
                ? `Current IELTS scores — Listening: ${latestScore.listening}, Reading: ${latestScore.reading}, Writing: ${latestScore.writing}, Speaking: ${latestScore.speaking}, Overall: ${latestScore.overall}. ${writingCtx}`
                : "No IELTS scores recorded yet.";

            const gapCtx = skillGaps.length > 0
                ? `Skill gaps (target ${ieltsTarget}): ${skillGaps.map(g => `${g.skill}: ${g.gap > 0 ? '+' + g.gap.toFixed(1) + ' needed' : 'on target'}`).join(', ')}. Weakest: ${weakestSkill || 'unknown'}.`
                : "";

            const prompt = `Generate an IELTS-focused daily study schedule. ${daysUntilExam > 0 ? `Exam is in ${daysUntilExam} days (March 2).` : "Exam date has passed, focus on general practice."}

${scoreCtx}
${gapCtx}
Target band: ${ieltsTarget}.

Create exactly 8 IELTS study blocks as a JSON array. Skills with larger gaps should get MORE time blocks. Each block must have:
- id (number 1-8)
- name (string, specific task e.g. "Cambridge 18 Test 2 Listening Section 3-4")
- time (HH:MM, spread between 08:00-21:00)
- skill (one of: listening/reading/writing/speaking/vocabulary/review)
- xp (15-50)
- done (false)
- details: {
    objective (1-2 sentences of what to achieve),
    materials (specific books/websites/test numbers),
    steps (array of 3-6 specific step strings),
    strategies (array of 2-4 exam strategy tips),
    timeBreakdown (string like "5 min warm-up → 20 min practice → 5 min review"),
    commonMistakes (string of what to avoid)
  }

Focus heavily on ${weakestSkill || 'all skills equally'}. Include vocabulary and review blocks. Be extremely specific with materials (Cambridge test numbers, exact websites, page numbers).
Respond with ONLY the JSON array.`;

            const res = await ai(
                [{ role: "user", content: prompt }],
                "You are an expert IELTS tutor creating a detailed daily study plan. Return valid JSON only."
            );

            let newBlocks = [];
            try {
                const jsonMatch = res.match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        newBlocks = parsed.map((b, i) => ({
                            id: b.id || i + 1,
                            name: String(b.name || ''),
                            time: String(b.time || '08:00'),
                            skill: ['listening', 'reading', 'writing', 'speaking', 'vocabulary', 'review'].includes(b.skill) ? b.skill : 'review',
                            xp: Math.max(15, Math.min(50, Number(b.xp) || 25)),
                            done: false,
                            cat: "ielts",
                            details: {
                                objective: String(b.details?.objective || ''),
                                materials: String(b.details?.materials || ''),
                                steps: Array.isArray(b.details?.steps) ? b.details.steps.map(String) : [],
                                strategies: Array.isArray(b.details?.strategies) ? b.details.strategies.map(String) : [],
                                timeBreakdown: String(b.details?.timeBreakdown || ''),
                                commonMistakes: String(b.details?.commonMistakes || ''),
                            },
                        }));
                    }
                }
            } catch (parseErr) {
                console.warn("IELTS schedule parse failed:", parseErr);
            }

            if (newBlocks.length > 0) {
                setBlocks(newBlocks);
                localStorage.setItem(cacheKey, JSON.stringify(newBlocks));

                // Also sync to dashboard tasks
                syncToDashboard(newBlocks);
            }
        } catch (e) {
            console.error("IELTS schedule generation failed:", e);
        }
        setLoading(false);
    };

    // Sync IELTS blocks into the dashboard task list
    const syncToDashboard = (ieltsBlocks) => {
        const ieltsTaskIds = ieltsBlocks.map(b => "ielts-sched-" + b.id);
        // Remove old ielts-sched tasks, add new ones
        const nonIelts = dashTasks.filter(t => !String(t.id).startsWith("ielts-sched-"));
        const mappedTasks = ieltsBlocks.map(b => ({
            id: "ielts-sched-" + b.id,
            name: b.name,
            time: b.time,
            cat: "ielts",
            xp: b.xp,
            done: b.done,
            calSync: false,
            hp: 20,
            desc: b.details?.objective || '',
            tip: b.details?.strategies?.[0] || '',
            skill: b.skill,
            details: b.details,
        }));
        setDashTasks([...nonIelts, ...mappedTasks]);
    };

    const completeBlock = (id, xp) => {
        const updated = blocks.map(b => b.id === id ? { ...b, done: true } : b);
        setBlocks(updated);
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        addXP(xp);

        // Also update in dashboard
        setDashTasks(prev =>
            prev.map(t => t.id === "ielts-sched-" + id ? { ...t, done: true } : t)
        );
    };

    if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader text="Generating IELTS study plan..." /></div>;

    if (blocks.length === 0) {
        return (
            <div>
                {/* Exam Countdown */}
                {daysUntilExam > 0 && (
                    <div className="card" style={{ textAlign: "center", marginBottom: 16, background: "linear-gradient(135deg,rgba(167,139,250,.1),rgba(0,221,179,.06))" }}>
                        <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Days Until Exam</div>
                        <div style={{ fontSize: 42, fontWeight: 700, color: "var(--violet)", fontFamily: "'JetBrains Mono',monospace" }}>{daysUntilExam}</div>
                        <div style={{ fontSize: 11, color: "var(--t2)" }}>March 2, 2025</div>
                    </div>
                )}
                <div className="card" style={{ textAlign: "center", padding: 30 }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📚</div>
                    <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 6 }}>No IELTS schedule for today yet.</div>
                    {weakestSkill && (
                        <div style={{ fontSize: 11, color: "var(--rose)", marginBottom: 14 }}>
                            Weakest skill detected: <strong style={{ textTransform: "capitalize" }}>{weakestSkill}</strong> — schedule will prioritize it.
                        </div>
                    )}
                    <button className="btn btn-g" onClick={generateSchedule}>Generate Today's Plan</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Exam Countdown */}
            {daysUntilExam > 0 && (
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div className="card" style={{ flex: 1, textAlign: "center", background: "linear-gradient(135deg,rgba(167,139,250,.1),rgba(0,221,179,.06))" }}>
                        <div style={{ fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Exam In</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "var(--violet)", fontFamily: "'JetBrains Mono',monospace" }}>{daysUntilExam}</div>
                        <div style={{ fontSize: 9, color: "var(--t3)" }}>days</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Progress</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: pct === 100 ? "var(--teal)" : "var(--t1)", fontFamily: "'JetBrains Mono',monospace" }}>{pct}%</div>
                        <div style={{ fontSize: 9, color: "var(--t3)" }}>{completedCount}/{totalCount} blocks</div>
                    </div>
                    {weakestSkill && (
                        <div className="card" style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Focus</div>
                            <div style={{ fontSize: 22 }}>{SKILL_ICONS[weakestSkill]}</div>
                            <div style={{ fontSize: 9, color: "var(--rose)", textTransform: "capitalize", fontWeight: 700 }}>{weakestSkill}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Progress bar */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Today's IELTS Schedule</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: pct === 100 ? "var(--teal)" : "var(--t2)" }}>{completedCount}/{totalCount}</span>
                        <button className="btn btn-gh btn-sm" onClick={generateSchedule} title="Regenerate schedule">🔄</button>
                    </div>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "var(--teal)" : "var(--violet)", borderRadius: 3, transition: "width 0.3s" }} />
                </div>
                {pct === 100 && <div style={{ marginTop: 8, fontSize: 11, color: "var(--teal)", fontWeight: 700, textAlign: "center" }}>All IELTS blocks completed! Great work!</div>}
            </div>

            {/* Study blocks */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {blocks.sort((a, b) => (a.time || "").localeCompare(b.time || "")).map(block => {
                    const color = SKILL_COLORS[block.skill] || "var(--teal)";
                    const icon = SKILL_ICONS[block.skill] || "📋";
                    return (
                        <div
                            key={block.id}
                            className={"task" + (block.done ? " done" : "")}
                            style={{ cursor: "pointer", alignItems: "center" }}
                            onClick={() => setSelectedTask(block)}
                        >
                            {/* Check */}
                            <div
                                onClick={e => { e.stopPropagation(); if (!block.done) completeBlock(block.id, block.xp); }}
                                style={{
                                    width: 20, height: 20, borderRadius: 6,
                                    border: `2px solid ${block.done ? "var(--teal)" : "var(--bdr)"}`,
                                    marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", background: block.done ? "var(--teal)" : "transparent",
                                    transition: "all .2s", fontSize: 11, color: "#fff", flexShrink: 0,
                                }}
                            >
                                {block.done && "✓"}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 14 }}>{icon}</span>
                                    <div className="tn">{block.name}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                                    <span className="tm">⏰ {block.time}</span>
                                    {block.details?.timeBreakdown && (
                                        <span style={{ fontSize: 9, color: "var(--t3)" }}>{block.details.timeBreakdown}</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                                <span className="badge" style={{ background: `${color}22`, color, fontSize: 9, padding: "2px 8px" }}>{block.skill}</span>
                                <span className="xptag">+{block.xp}xp</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detail Modal */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onComplete={completeBlock}
                />
            )}
        </div>
    );
}
