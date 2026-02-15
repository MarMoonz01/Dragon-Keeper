import React, { useState, useEffect, useRef } from 'react';
import { ai } from '../utils/helpers';
import { useTasks } from '../context/TaskContext';
import { useGame } from '../context/GameContext';
import { useIELTS } from '../context/IELTSContext';
import Loader from './Loader';

export default function AIChatBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! I'm Nexus. I have full access to your schedule, IELTS scores, and dragon evolution. How can I help?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    const { tasks, addTask, editTask, completeTask } = useTasks();
    const { dragon, stats, challenges, currentStage, nextStage } = useGame();
    const { realScores, ieltsTarget } = useIELTS();

    useEffect(() => {
        if (isOpen && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const msg = input;
        setInput("");
        setMessages(p => [...p, { role: "user", content: msg }]);
        setLoading(true);

        // Build Comprehensive Context
        const taskList = tasks.map(t => `#${t.id} ${t.name} (${t.time}, ${t.done ? "DONE" : "TODO"})`).join("\n");
        const latestIELTS = realScores[0] || {};
        const ieltsCtx = `Target: ${ieltsTarget}, Current Band: ${latestIELTS.overall || "N/A"} (W:${latestIELTS.writing}, R:${latestIELTS.reading}, L:${latestIELTS.listening}, S:${latestIELTS.speaking})`;
        const dragonCtx = `Level: ${dragon.level}, XP: ${dragon.xp}, Stage: ${currentStage?.name || "Unknown"}`;
        const evoCtx = nextStage ? `Next Evolution: ${nextStage.name} (Req: Lv.${nextStage.lv} + Band ${nextStage.minBand})` : "Max Evolution Reached";
        const challengeCtx = `Daily Quests: ${challenges.daily.filter(c => !c.completed).map(c => c.text).join(", ") || "None"}`;

        const sys = `You are a helpful AI Secretary (God Mode) for Nexus app. You manage productivity (Tasks) AND game progress (Dragon/IELTS).
        
Current State:
[TASKS]
${taskList}

[IELTS]
${ieltsCtx}

[GAME]
${dragonCtx}
${evoCtx}
${challengeCtx}
Streak: ${stats.streak} days

Your Goal: Help the user succeed in IELTS and Life. Be proactive.
If user is tired, offer to [REDUCE_LOAD: 20] (cuts 20%).
If user asks about evolution, check requirements vs current stats and explain the gap.
If user wants to study writing, offer [PLAN_SPRINT: writing] (adds 7 days tasks).

Commands (append to response invisibly):
- [ADD: Task Name | HH:MM | category | xp]
- [EDIT: TaskID | new time or name]
- [COMPLETE: TaskID]
- [DELETE: TaskID]
- [REDUCE_LOAD: percentage] (e.g. 20)
- [PLAN_SPRINT: topic] (e.g. writing, reading)

Example:
User: "I'm exhausted."
AI: "I understand. Rest is productive too. I've lightened your schedule for today."
[REDUCE_LOAD: 30]

User: "Why isn't my dragon evolving?"
AI: "You're Level 12 (Target: 10 ✅), but your Band is 6.0 (Target: 6.5 ❌). You need to improve your IELTS score to evolve to Blaze Drake."`;

        try {
            const r = await ai([...messages, { role: "user", content: msg }], sys);

            // Parse Commands
            const cmdRegex = /\[(ADD|EDIT|COMPLETE|DELETE|REDUCE_LOAD|PLAN_SPRINT):.*?\]/g;
            const matches = r.match(cmdRegex);
            let displayMsg = r.replace(cmdRegex, "").trim();

            if (matches) {
                matches.forEach(cmdStr => {
                    const colonIdx = cmdStr.indexOf(":");
                    const action = cmdStr.substring(1, colonIdx);
                    // Remove opening [Action: and closing ]
                    const paramsStr = cmdStr.substring(colonIdx + 1, cmdStr.length - 1);
                    const p = paramsStr.split("|").map(s => s.trim());

                    if (action === "ADD") {
                        addTask({ id: Date.now() + Math.random(), name: p[0], time: p[1] || "09:00", cat: p[2] || "work", xp: parseInt(p[3]) || 20, done: false, hp: 15 });
                    } else if (action === "EDIT") {
                        const tid = parseInt(p[0]);
                        const update = {};
                        if (p[1].includes(":")) update.time = p[1];
                        else update.name = p[1];
                        editTask(tid, update);
                    } else if (action === "COMPLETE") {
                        completeTask(parseInt(p[0]), 20);
                    } else if (action === "REDUCE_LOAD") {
                        const pct = parseInt(p[0]) || 20;
                        tasks.forEach(t => {
                            if (!t.done) editTask(t.id, { xp: Math.max(5, Math.floor(t.xp * (1 - pct / 100))) });
                        });
                        displayMsg += ` (Tasks reduced by ${pct}%)`;
                    } else if (action === "PLAN_SPRINT") {
                        const topic = p[0].toLowerCase();
                        if (topic.includes("writing")) {
                            ["Task 1 Analysis", "Task 2 Essay", "Vocabulary Drill", "Grammar Review", "Full Mock Test", "Peer Review", "Rewrite Weak Essay"].forEach((name, i) => {
                                addTask({
                                    id: Date.now() + i,
                                    name: `Writing Sprint: ${name}`,
                                    time: "10:00",
                                    cat: "ielts",
                                    xp: 50,
                                    done: false,
                                    hp: 20
                                });
                            });
                            displayMsg += " (Added 7-day writing sprint)";
                        }
                    }
                });
            }

            setMessages(p => [...p, { role: "assistant", content: displayMsg }]);
        } catch (e) {
            setMessages(p => [...p, { role: "assistant", content: "Sorry, I lost connection to the server." }]);
        }
        setLoading(false);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "fixed", bottom: 84, right: 20,
                    width: 56, height: 56, borderRadius: "50%",
                    background: "var(--teal)", border: "none",
                    boxShadow: "0 4px 12px rgba(0,221,179,0.3)",
                    zIndex: 1000, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, transition: "transform 0.2s"
                }}
            >
                {isOpen ? "✕" : "🐉"}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: "fixed", bottom: 150, right: 20,
                    width: 340, height: 500, maxHeight: "60vh",
                    background: "#1e1e24", borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    zIndex: 1000, display: "flex", flexDirection: "column",
                    overflow: "hidden"
                }}>
                    <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>🐉</span> Nexus Assistant
                    </div>

                    <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                                background: m.role === "user" ? "var(--teal)" : "rgba(255,255,255,0.08)",
                                color: m.role === "user" ? "#000" : "var(--white)",
                                padding: "8px 12px", borderRadius: 12, fontSize: 13, maxWidth: "85%", lineHeight: 1.5
                            }}>
                                {m.content}
                            </div>
                        ))}
                        {loading && <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.08)", padding: "8px 12px", borderRadius: 12 }}><Loader text="" /></div>}
                        <div ref={bottomRef} />
                    </div>

                    <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8 }}>
                        <input
                            className="inp"
                            style={{ margin: 0, padding: "8px 12px", fontSize: 13 }}
                            placeholder="Type a command..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSend()}
                        />
                        <button className="btn btn-g" style={{ padding: "0 14px" }} onClick={handleSend}>➤</button>
                    </div>
                </div>
            )}
        </>
    );
}
