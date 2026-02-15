import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useTasks } from '../../context/TaskContext';
import { ai } from '../../utils/helpers';
import { supabase } from '../../utils/supabaseClient';
import { CC } from '../../data/constants';
import Loader from '../Loader';

export default function AIScheduler() {
    const { dragon } = useGame();
    const { tasks, addTask: onAdd, showToast } = useTasks();

    const [genLoading, setGenLoading] = useState(false);
    const [aiSched, setAiSched] = useState("");
    const [parsedSchedTasks, setParsedSchedTasks] = useState([]);

    const done = tasks.filter(t => t.done).length;
    const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;

    // Parse AI schedule text into structured tasks
    const parseScheduleText = (text) => {
        const lines = text.split('\n').filter(l => l.trim());
        const parsed = [];
        for (const line of lines) {
            // Match: • HH:MM — Task [cat] +XXxp  (flexible with variations)
            const m = line.match(/•?\s*(\d{1,2}:\d{2})\s*[—–-]\s*(.+?)\s*\[(\w+)\]\s*\+(\d+)\s*xp/i);
            if (m) {
                const cat = m[3].toLowerCase();
                parsed.push({
                    id: Date.now() + parsed.length,
                    time: m[1].padStart(5, '0'),
                    name: m[2].trim(),
                    cat: ['health', 'work', 'ielts', 'mind', 'social'].includes(cat) ? cat : 'work',
                    xp: Math.max(10, Math.min(60, parseInt(m[4]) || 20)),
                    done: false,
                    calSync: true,
                    hp: Math.max(8, Math.min(50, parseInt(m[4]) || 15)),
                });
            }
        }
        return parsed;
    };

    const genSchedule = async () => {
        setGenLoading(true);
        setParsedSchedTasks([]);
        const dn = tasks.filter(t => t.done).map(t => t.name).join(", ") || "none";
        const pn = tasks.filter(t => !t.done).map(t => t.name).join(", ");

        let patternCtx = "";
        if (supabase) {
            try {
                const { getWeeklyPatterns } = await import('../../utils/patternAnalysis');
                patternCtx = await getWeeklyPatterns(supabase);
            } catch (e) { console.error("Pattern analysis failed", e); }
        }

        try {
            const r = await ai([{ role: "user", content: "Generate tomorrow's optimised schedule.\nCompleted today: " + dn + "\nPending: " + pn + "\nRate: " + pct + "%, Dragon Lv." + dragon.level + ".\n" + (patternCtx ? "Patterns: " + patternCtx + "\n" : "") + "Create 9 tasks with times (HH:MM), categories (health/work/ielts/mind), XP (10-60). Front-load IELTS before noon. Format: • HH:MM — Task [cat] +XXxp" }],
                "You are NEXUS AI Life Secretary. Generate practical, motivating schedules. Use EXACTLY the format: • HH:MM — Task Name [category] +XXxp");
            setAiSched(r);
            const parsed = parseScheduleText(r);
            setParsedSchedTasks(parsed);
        } catch (e) {
            showToast("❌", "AI Error", "Failed to generate schedule.");
        }
        setGenLoading(false);
    };

    const removeSchedTask = (idx) => {
        setParsedSchedTasks(prev => prev.filter((_, i) => i !== idx));
    };

    const importAllTasks = () => {
        if (parsedSchedTasks.length === 0) return;
        parsedSchedTasks.forEach(t => onAdd(t));
        showToast("🚀", "Tasks Imported!", parsedSchedTasks.length + " tasks added to your schedule");
        setParsedSchedTasks([]);
        setAiSched("");
    };

    return (
        <div className="card">
            <div className="ct">🤖 AI Schedule Generator</div>
            <button className="btn btn-v" style={{ width: "100%", justifyContent: "center", padding: "12px 18px" }} onClick={genSchedule} disabled={genLoading}>
                <span style={{ fontSize: 16 }}>🤖</span>
                {genLoading ? "Generating with AI..." : "Generate Tomorrow's Schedule"}
            </button>
            {genLoading && <div style={{ marginTop: 10 }}><Loader text="AI is building your personalised plan..." /></div>}
            {aiSched && <div className="aibx" style={{ marginTop: 12 }}>{aiSched}</div>}
            {parsedSchedTasks.length > 0 && (
                <div className="import-preview" style={{ marginTop: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)" }}>📋 {parsedSchedTasks.length} tasks parsed</div>
                        <button className="btn btn-g btn-sm" onClick={importAllTasks} style={{ padding: "6px 14px" }}>
                            🚀 Import All as Tasks
                        </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {parsedSchedTasks.map((t, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--card)", borderRadius: 8, fontSize: 11 }}>
                                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--teal)", fontWeight: 700, minWidth: 40 }}>{t.time}</span>
                                <span style={{ flex: 1, color: "var(--t1)" }}>{t.name}</span>
                                <span className="cat-badge" style={{ background: `${CC[t.cat]}22`, color: CC[t.cat], padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{t.cat}</span>
                                <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 10 }}>+{t.xp}xp</span>
                                <button onClick={() => removeSchedTask(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", fontSize: 12, padding: "0 2px" }} title="Remove">✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {!aiSched && !genLoading && (
                <div className="ins" style={{ marginTop: 10 }}>
                    <span className="ins-ic">💡</span>
                    <span>AI analyses today's performance and generates a schedule optimised for your IELTS goals, health patterns, and productivity rhythms.</span>
                </div>
            )}
        </div>
    );
}
