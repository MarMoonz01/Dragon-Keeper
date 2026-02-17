import React, { useState, useEffect } from 'react';
import Loader from '../Loader';
import { ai } from '../../utils/helpers';
import { useGame } from '../../context/GameContext';

const TASK_XP = 25;

export default function DailyLesson() {
    const { addXP } = useGame();
    const todayStr = new Date().toISOString().split("T")[0];
    const cacheKey = "nx-ielts-daily-" + todayStr;
    const doneKey = "nx-ielts-daily-done-" + todayStr;

    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(() => {
        try { return JSON.parse(localStorage.getItem(doneKey)) || []; } catch { return []; }
    });

    useEffect(() => {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try { setLesson(JSON.parse(cached)); return; } catch { /* regenerate */ }
        }
        generateLesson();
    }, []);

    const generateLesson = async () => {
        setLoading(true);
        const dayNum = new Date().getDate();
        const taskType = dayNum % 2 === 0 ? "Task 2 (Essay)" : "Task 1 (Report)";
        try {
            const r = await ai([{
                role: "user",
                content: `Generate a daily IELTS mini-lesson with exactly 4 tasks. Return strict JSON only:
{
  "vocabulary": { "word": "...", "ipa": "/.../" , "definition": "...", "example": "..." },
  "writing": { "type": "${taskType}", "prompt": "..." },
  "reading": { "passage": "A 60-80 word paragraph on an academic topic.", "question": "One comprehension question about the passage.", "answer": "The correct answer." },
  "speaking": { "topic": "An IELTS Part 2 cue card topic." }
}`
            }], "You are an IELTS tutor. Return valid JSON only, no markdown.");

            const clean = r.replace(/```json|```/g, "").trim();
            const data = JSON.parse(clean);
            setLesson(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            console.error("Daily lesson generation failed", e);
        }
        setLoading(false);
    };

    const markDone = (taskId) => {
        if (done.includes(taskId)) return;
        const updated = [...done, taskId];
        setDone(updated);
        localStorage.setItem(doneKey, JSON.stringify(updated));
        addXP(TASK_XP);
    };

    const taskIds = ["vocabulary", "writing", "reading", "speaking"];
    const completedCount = done.length;

    if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader text="Generating today's lesson..." /></div>;

    if (!lesson) return (
        <div className="card" style={{ textAlign: "center", padding: 30 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📖</div>
            <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 14 }}>No lesson yet. Generate your daily IELTS lesson.</div>
            <button className="btn btn-g" onClick={generateLesson}>Generate Daily Lesson</button>
        </div>
    );

    return (
        <div>
            {/* Progress bar */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Today's Lesson</div>
                    <div style={{ fontSize: 12, color: completedCount === 4 ? "var(--teal)" : "var(--t2)" }}>
                        {completedCount}/4 completed
                    </div>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(completedCount / 4) * 100}%`, background: completedCount === 4 ? "var(--teal)" : "var(--violet)", borderRadius: 3, transition: "width 0.3s" }} />
                </div>
                {completedCount === 4 && <div style={{ marginTop: 8, fontSize: 11, color: "var(--teal)", fontWeight: 700, textAlign: "center" }}>All done! +{TASK_XP * 4} XP earned today</div>}
            </div>

            <div className="g2">
                {/* Vocabulary */}
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div className="ct" style={{ margin: 0 }}>📝 Vocabulary</div>
                        {done.includes("vocabulary") ? <span className="badge bt" style={{ fontSize: 9 }}>✓ Done</span> : <button className="btn btn-g btn-sm" onClick={() => markDone("vocabulary")}>Mark Done (+{TASK_XP} XP)</button>}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{lesson.vocabulary.word}</div>
                    <div style={{ fontSize: 12, color: "var(--violet)", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>{lesson.vocabulary.ipa}</div>
                    <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 6 }}>{lesson.vocabulary.definition}</div>
                    <div style={{ fontSize: 11, color: "var(--t3)", fontStyle: "italic", borderLeft: "2px solid var(--violet)", paddingLeft: 10 }}>{lesson.vocabulary.example}</div>
                </div>

                {/* Writing */}
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div className="ct" style={{ margin: 0 }}>✍️ Writing</div>
                        {done.includes("writing") ? <span className="badge bt" style={{ fontSize: 9 }}>✓ Done</span> : <button className="btn btn-g btn-sm" onClick={() => markDone("writing")}>Mark Done (+{TASK_XP} XP)</button>}
                    </div>
                    <div className="badge" style={{ marginBottom: 8, background: "rgba(167,139,250,0.12)", color: "var(--violet)" }}>{lesson.writing.type}</div>
                    <div style={{ fontSize: 12, color: "var(--t1)", lineHeight: 1.6 }}>{lesson.writing.prompt}</div>
                </div>

                {/* Reading */}
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div className="ct" style={{ margin: 0 }}>📖 Reading</div>
                        {done.includes("reading") ? <span className="badge bt" style={{ fontSize: 9 }}>✓ Done</span> : <button className="btn btn-g btn-sm" onClick={() => markDone("reading")}>Mark Done (+{TASK_XP} XP)</button>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--t1)", lineHeight: 1.7, marginBottom: 10, padding: 10, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>{lesson.reading.passage}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--gold)" }}>{lesson.reading.question}</div>
                    <details>
                        <summary style={{ fontSize: 11, cursor: "pointer", color: "var(--teal)" }}>Show Answer</summary>
                        <div style={{ marginTop: 6, fontSize: 12, color: "var(--t2)" }}>{lesson.reading.answer}</div>
                    </details>
                </div>

                {/* Speaking */}
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div className="ct" style={{ margin: 0 }}>🎤 Speaking</div>
                        {done.includes("speaking") ? <span className="badge bt" style={{ fontSize: 9 }}>✓ Done</span> : <button className="btn btn-g btn-sm" onClick={() => markDone("speaking")}>Mark Done (+{TASK_XP} XP)</button>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--t1)", lineHeight: 1.6 }}>{lesson.speaking.topic}</div>
                </div>
            </div>
        </div>
    );
}
