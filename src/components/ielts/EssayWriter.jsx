import React, { useState, useEffect } from 'react';
import Loader from '../Loader';
import { ai, load, save } from '../../utils/helpers';
import { useGame } from '../../context/GameContext';
import { useIELTS } from '../../context/IELTSContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { loadWritingHistory, addWritingHistoryEntry } from '../../utils/supabaseSync';

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

    // Load History — Supabase first, localStorage fallback
    useEffect(() => {
        const hydrateHistory = async () => {
            const sbHistory = await loadWritingHistory();
            if (sbHistory && sbHistory.length > 0) {
                setHistory(sbHistory);
                localStorage.setItem('nx-writing-history', JSON.stringify(sbHistory));
            } else {
                setHistory(load("nx-writing-history") || []);
            }
        };
        hydrateHistory();
    }, [scores]); // Reload when new score added

    const scoreEssay = async () => {
        if (!essay.trim()) return;
        setScoring(true);
        const wc = essay.split(/\s+/).filter(w => w).length;
        const criteria = writingTask === 1 ? "Task Achievement" : "Task Response";
        const type = writingTask === 1 ? "Academic Writing Task 1 (Report)" : "Academic Writing Task 2 (Essay)";

        const systemPrompt = `You are an expert IELTS Writing Examiner (Band 9.0).
        Analyze the following ${type}.
        Score against the OFFICIAL IELTS Writing Band Descriptors below. Match the candidate to the band that BEST fits their performance in each criterion.

═══ ${criteria.toUpperCase()} (TR) ═══
Band 8: Sufficiently addresses all parts of the task. Presents a well-developed response to the question with relevant, extended and supported ideas.
Band 7: Addresses all parts of the task. Presents a clear position throughout the response. Presents, extends and supports main ideas, but there may be a tendency to over-generalise and/or supporting ideas may lack focus.
Band 6: Addresses all parts of the task although some parts may be more fully covered than others. Presents a relevant position although the conclusions may become unclear or repetitive. Presents relevant main ideas but some may be inadequately developed/unclear.
Band 5: Addresses the task only partially; the format may be inappropriate in places. Expresses a position but the development is not always clear and there may be no conclusions drawn. Presents some main ideas but these are limited and not sufficiently developed; there may be irrelevant detail.

═══ COHERENCE & COHESION (CC) ═══
Band 8: Sequences information and ideas logically. Manages all aspects of cohesion well. Uses paragraphing sufficiently and appropriately.
Band 7: Logically organises information and ideas; there is clear progression throughout. Uses a range of cohesive devices appropriately although there may be some under-/over-use. Presents a clear central topic within each paragraph.
Band 6: Arranges information and ideas coherently and there is a clear overall progression. Uses cohesive devices effectively, but cohesion within and/or between sentences may be faulty or mechanical. May not always use referencing clearly or appropriately.
Band 5: Presents information with some organisation but there may be a lack of overall progression. Makes inadequate, inaccurate or over-use of cohesive devices. May be repetitive because of lack of referencing and substitution.

═══ LEXICAL RESOURCE (LR) ═══
Band 8: Uses a wide range of vocabulary fluently and flexibly to convey precise meanings. Skilfully uses uncommon lexical items but there may be occasional inaccuracies in word choice and collocation. Produces rare errors in spelling and/or word formation.
Band 7: Uses a sufficient range of vocabulary to allow some flexibility and precision. Uses less common lexical items with some awareness of style and collocation. May produce occasional errors in word choice, spelling and/or word formation.
Band 6: Uses an adequate range of vocabulary for the task. Attempts to use less common vocabulary but with some inaccuracy. Makes some errors in spelling and/or word formation, but they do not impede communication.
Band 5: Uses a limited range of vocabulary, but this is minimally adequate for the task. May make noticeable errors in spelling and/or word formation that may cause some difficulty for the reader.

═══ GRAMMATICAL RANGE & ACCURACY (GRA) ═══
Band 8: Uses a wide range of structures. The majority of sentences are error-free. Makes only very occasional errors or inappropriacies.
Band 7: Uses a variety of complex structures. Produces frequent error-free sentences. Has good control of grammar and punctuation but may make a few errors.
Band 6: Uses a mix of simple and complex sentence forms. Makes some errors in grammar and punctuation but they rarely reduce communication.
Band 5: Uses only a limited range of structures. Attempts complex sentences but these tend to be less accurate than simple sentences. May make frequent grammatical errors and punctuation may be faulty; errors can cause some difficulty for the reader.

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
            addWritingHistoryEntry(result);
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
