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

        const r = await ai([{
            role: "user", content: `Score this IELTS ${type} (${wc} words).
        
ESSAY:
${essay}

Respond in this EXACT format only:
TA: [0-9 score] (Score for ${criteria})
CC: [0-9 score]
LR: [0-9 score]
GR: [0-9 score]
OVERALL: [0-9 score]
STRENGTHS: [one line]
IMPROVE: [two bullet points]` }],
            "You are a certified IELTS examiner. Score accurately on the 9-band scale. Be specific and constructive.");

        const get = k => { const m = r.match(new RegExp(k + ":\\s*([\\d.]+)")); return m ? parseFloat(m[1]) : 6.0; };
        const getS = k => { const m = r.match(new RegExp(k + ":\\s*(.+)")); return m ? m[1].trim() : ""; };
        setScores({ ta: get("TA"), cc: get("CC"), lr: get("LR"), gr: get("GR"), overall: get("OVERALL"), strengths: getS("STRENGTHS"), improve: getS("IMPROVE") });
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
                <div className="ct">✍️ AI Writing Evaluator (Claude)</div>
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
                {scoring && <div style={{ marginTop: 12 }}><Loader text="Claude is evaluating your essay..." /></div>}
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
