import React, { useState, useEffect } from 'react';
import Loader from '../Loader';
import { ai, load, save } from '../../utils/helpers';
import { useGame } from '../../context/GameContext';
import { useIELTS } from '../../context/IELTSContext';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function EssayWriter() {
    const { refreshSkill } = useGame();
    const { addScore } = useIELTS();

    const [subTab, setSubTab] = useState("write"); // write, history
    const [writingTask, setWritingTask] = useState(2);
    const [essay, setEssay] = useState("");
    const [scores, setScores] = useState(null);
    const [scoring, setScoring] = useState(false);
    const [history, setHistory] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [patternAnalysis, setPatternAnalysis] = useState("");

    // Load History
    useEffect(() => {
        const h = load("nx-writing-history") || [];
        setHistory(h);
    }, [scores]); // Reload when new score added

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

            const result = {
                date: new Date().toISOString().split("T")[0],
                taskId: Date.now(),
                taskType: writingTask,
                text: essay,
                wc,
                band: data.band,
                ta: data.breakdown.tr, // Normalize key
                cc: data.breakdown.cc,
                lr: data.breakdown.lr,
                gra: data.breakdown.gra,
                strengths: data.feedback,
                improve: data.corrections.join("\n")
            };

            setScores(result);

            // Persist
            const newHistory = [result, ...history].slice(0, 50);
            save("nx-writing-history", newHistory);
            setHistory(newHistory);
            refreshSkill();

            // Also log to IELTSContext tracker
            addScore({
                writing: data.band,
                overall: data.band,
                note: `Task ${writingTask} Essay (${wc} words)`
            });

        } catch (e) {
            console.error("Scoring failed", e);
            alert("Scoring failed. Please try again.");
        }
        setScoring(false);
    };

    const analyzePatterns = async () => {
        if (history.length < 3) return;
        setAnalyzing(true);
        const recent = history.slice(0, 5).map(h => `Band ${h.band}: ${h.improve}`).join("\n---\n");
        const prompt = `Analyze these recent IELTS essay feedbacks. Identify 3 recurring weaknesses or error patterns (e.g. "Consistently struggles with article usage", "Task Response often lacks development").\n\nFeedbacks:\n${recent}\n\nReturn 3 bullet points.`;

        try {
            const r = await ai([{ role: "user", content: prompt }], "You are an IELTS Coach.");
            setPatternAnalysis(r);
        } catch (e) { console.error(e); }
        setAnalyzing(false);
    };

    // Prepare Chart Data
    const chartData = history.slice(0, 10).reverse().map(h => ({
        date: h.date.slice(5), // MM-DD
        band: h.band,
        ta: h.ta, cc: h.cc, lr: h.lr, gra: h.gra
    }));

    return (
        <div>
            <div className="tabs" style={{ justifyContent: "flex-start", gap: 10, marginBottom: 16 }}>
                <button className={`btn btn-sm ${subTab === "write" ? "btn-p" : "btn-gh"}`} onClick={() => setSubTab("write")}>✍️ Write & Score</button>
                <button className={`btn btn-sm ${subTab === "history" ? "btn-p" : "btn-gh"}`} onClick={() => setSubTab("history")}>📜 History & Trends</button>
            </div>

            {subTab === "write" && (
                <div className="card">
                    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                        <button className={"btn " + (writingTask === 1 ? "btn-p" : "btn-gh")} onClick={() => setWritingTask(1)}>Task 1 (Report)</button>
                        <button className={"btn " + (writingTask === 2 ? "btn-p" : "btn-gh")} onClick={() => setWritingTask(2)}>Task 2 (Essay)</button>
                    </div>
                    <div className="ins" style={{ marginBottom: 14 }}>
                        <span className="ins-ic">📋</span>
                        <span>
                            <strong>{writingTask === 1 ? "Task 1:" : "Task 2:"}</strong> {writingTask === 1
                                ? "The chart below shows global energy consumption by source. Summarise the info..."
                                : "\"Technology has made modern life more complex rather than easier. To what extent do you agree?\""}
                        </span>
                    </div>
                    <textarea className="inp" placeholder={writingTask === 1 ? "Describe trends, compare data..." : "Write your essay here..."} value={essay} onChange={e => setEssay(e.target.value)} rows={12} style={{ fontFamily: "serif", fontSize: 16, lineHeight: 1.6 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "var(--t2)" }}>
                            {essay.split(/\s+/).filter(w => w).length} words
                        </span>
                        <button className="btn btn-g" onClick={scoreEssay} disabled={scoring || !essay.trim()}>
                            {scoring ? "🤖 Scoring..." : "🤖 AI Score Essay"}
                        </button>
                    </div>
                    {scoring && <div style={{ marginTop: 12 }}><Loader text="AI is evaluating your essay..." /></div>}

                    {scores && !scoring && (
                        <div style={{ marginTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--t2)", letterSpacing: 1 }}>OVERALL BAND</div>
                                    <div style={{ fontSize: 40, fontWeight: 700, color: "var(--teal)" }}>{scores.band}</div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {[["TA/TR", scores.ta], ["CC", scores.cc], ["LR", scores.lr], ["GRA", scores.gra]].map(([k, v]) => (
                                        <div key={k} style={{ background: "rgba(255,255,255,0.05)", padding: "6px 10px", borderRadius: 8, textAlign: "center" }}>
                                            <div style={{ fontSize: 10, color: "var(--t2)" }}>{k}</div>
                                            <div style={{ fontWeight: 700, color: v >= 7 ? "var(--teal)" : v <= 5.5 ? "var(--rose)" : "var(--gold)" }}>{v}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="aibx">
                                {scores.strengths && <div style={{ marginBottom: 10 }}><b style={{ color: "var(--teal)" }}>💪 Strengths:</b> {scores.strengths}</div>}
                                <div><b style={{ color: "var(--rose)" }}>🔧 To Improve:</b><pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: "6px 0 0 0", color: "var(--t1)" }}>{scores.improve}</pre></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {subTab === "history" && (
                <div className="g2">
                    <div className="card" style={{ gridColumn: "span 2" }}>
                        <div className="ct">📈 Band Score Trend</div>
                        <div style={{ height: 200, width: "100%" }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData}>
                                    <XAxis dataKey="date" stroke="var(--t2)" fontSize={10} />
                                    <YAxis domain={[0, 9]} stroke="var(--t2)" fontSize={10} />
                                    <Tooltip contentStyle={{ background: "#1e1e24", border: "1px solid #333" }} />
                                    <Line type="monotone" dataKey="band" stroke="var(--teal)" strokeWidth={2} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="lr" stroke="var(--rose)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                                    <Line type="monotone" dataKey="gra" stroke="var(--gold)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 10, fontSize: 10 }}>
                            <span style={{ color: "var(--teal)" }}>● Overall</span>
                            <span style={{ color: "var(--rose)" }}>- - Lexical</span>
                            <span style={{ color: "var(--gold)" }}>- - Grammar</span>
                        </div>
                    </div>

                    <div className="card" style={{ gridColumn: "span 2" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div className="ct" style={{ margin: 0 }}>🧠 Error Pattern Analysis</div>
                            <button className="btn btn-gh btn-sm" onClick={analyzePatterns} disabled={analyzing || history.length < 3}>
                                {analyzing ? "Analyzing..." : "Analyze Last 5 Essays"}
                            </button>
                        </div>
                        {patternAnalysis ? (
                            <div className="aibx" style={{ whiteSpace: "pre-wrap" }}>{patternAnalysis}</div>
                        ) : (
                            <div style={{ fontSize: 12, color: "var(--t2)", textAlign: "center", padding: 20 }}>
                                {history.length < 3 ? "Write at least 3 essays to unlock pattern analysis." : "Click analyze to find recurring weaknesses."}
                            </div>
                        )}
                    </div>

                    {history.map(h => (
                        <div key={h.taskId} className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span className="badge" style={{ background: "rgba(255,255,255,0.05)" }}>{h.date}</span>
                                <span className="badge" style={{ background: h.band >= 7 ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)", color: h.band >= 7 ? "var(--teal)" : "var(--gold)" }}>Band {h.band}</span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Task {h.taskType} ({h.wc} words)</div>
                            <div style={{ fontSize: 11, color: "var(--t2)", display: "flex", gap: 8, marginBottom: 10 }}>
                                <span>TA: {h.ta}</span><span>CC: {h.cc}</span><span>LR: {h.lr}</span><span>GRA: {h.gra}</span>
                            </div>
                            <details>
                                <summary style={{ fontSize: 11, cursor: "pointer", color: "var(--teal)" }}>Show Feedback</summary>
                                <div style={{ marginTop: 8, fontSize: 11, whiteSpace: "pre-wrap", color: "var(--t2)" }}>
                                    {h.improve}
                                </div>
                            </details>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
