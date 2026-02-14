import React, { useState } from 'react';
import Loader from '../Loader';
import { ai } from '../../utils/helpers';

export default function EssayWriter() {
    const [writingTask, setWritingTask] = useState(2);
    const [essay, setEssay] = useState("");
    const [scores, setScores] = useState(null);
    const [scoring, setScoring] = useState(false);

    const scoreEssay = async () => {
        if (!essay.trim()) return;
        setScoring(true);
        const wc = essay.split(/\s+/).filter(w => w).length;
        const criteria = writingTask === 1 ? "Task Achievement" : "Task Response";
        const type = writingTask === 1 ? "Academic Writing Task 1 (Report)" : "Academic Writing Task 2 (Essay)";

        const systemPrompt = `You are an expert IELTS Examiner (Band 9.0). 
        Analyze the following ${type}.
        Provide a strict evaluation based on: 
        1. ${criteria}
        2. Coherence & Cohesion
        3. Lexical Resource
        4. Grammatical Range & Accuracy.
        
        Return JSON format only: 
        { "band": number, "breakdown": { "tr": number, "cc": number, "lr": number, "gra": number }, "feedback": "string (strengths)", "corrections": ["improvement point 1", "improvement point 2"] }`;

        try {
            const r = await ai([{ role: "user", content: `Topic: ${type}\n\nEssay (${wc} words):\n${essay}` }], systemPrompt);

            // Clean up code blocks if present
            const jsonStr = r.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            setScores({
                ta: data.breakdown.tr,
                cc: data.breakdown.cc,
                lr: data.breakdown.lr,
                gr: data.breakdown.gra,
                overall: data.band,
                strengths: data.feedback,
                improve: data.corrections.join("\n")
            });
        } catch (e) {
            console.error("Scoring failed", e);
            alert("Scoring failed. Please try again.");
        }
        setScoring(false);
    };

    return (
        <div>
            <div className="g2" style={{ marginBottom: 16 }}>
                {[{ t: "Task 1: Academic Graph / Chart", ic: "📊", d: "Describe data, trends, or processes" }, { t: "Task 2: Opinion / Discussion Essay", ic: "📝", d: "Argue, discuss, or evaluate a position" }].map((item, i) => (
                    <div key={i} className="card" style={{ cursor: "pointer" }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{item.ic}</div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{item.t}</div>
                        <div style={{ fontSize: 11, color: "var(--t2)" }}>{item.d}</div>
                    </div>
                ))}
            </div>
            <div className="card">
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <button className={"btn " + (writingTask === 1 ? "btn-p" : "btn-gh")} onClick={() => setWritingTask(1)}>Task 1 (Report)</button>
                    <button className={"btn " + (writingTask === 2 ? "btn-p" : "btn-gh")} onClick={() => setWritingTask(2)}>Task 2 (Essay)</button>
                </div>
                <div className="ct">✍️ AI Writing Evaluator (Gemini 1.5 Pro)</div>
                <div className="ins" style={{ marginBottom: 14 }}>
                    <span className="ins-ic">📋</span>
                    <span>
                        <strong>{writingTask === 1 ? "Task 1:" : "Task 2:"}</strong> {writingTask === 1
                            ? "The chart below shows global energy consumption by source. Summarise the info..."
                            : "\"Technology has made modern life more complex rather than easier. To what extent do you agree?\""}
                    </span>
                </div>
                <textarea className="inp" placeholder={writingTask === 1 ? "Describe trends, compare data..." : "Write your essay here..."} value={essay} onChange={e => setEssay(e.target.value)} rows={9} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "var(--t2)" }}>
                        {essay.split(/\s+/).filter(w => w).length} words
                    </span>
                    <button className="btn btn-g" onClick={scoreEssay} disabled={scoring || !essay.trim()}>
                        {scoring ? "🤖 Scoring..." : "🤖 AI Score Essay"}
                    </button>
                </div>
                {scoring && <div style={{ marginTop: 12 }}><Loader text="Gemini is evaluating your essay..." /></div>}
                {scores && !scoring && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ textAlign: "center", marginBottom: 14 }}>
                            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t2)", letterSpacing: 2 }}>ESTIMATED BAND</div>
                            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 44, fontWeight: 700, color: "var(--teal)" }}>{scores.overall}</div>
                        </div>
                        <div className="sb2">
                            {[[writingTask === 1 ? "Task Achievement" : "Task Response", scores.ta], ["Coherence & Cohesion", scores.cc], ["Lexical Resource", scores.lr], ["Grammar Range", scores.gr]].map(([l, v]) => (
                                <div key={l} className="si"><div className="siv">{v}</div><div className="sil">{l}</div></div>
                            ))}
                        </div>
                        <div className="aibx" style={{ marginTop: 12 }}>
                            {scores.strengths && "💪 Strengths: " + scores.strengths + "\n\n"}
                            {scores.improve && "🔧 Improve:\n" + scores.improve}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
