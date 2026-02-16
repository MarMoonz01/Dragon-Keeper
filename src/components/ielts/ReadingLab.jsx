import React, { useState, useEffect, useRef } from 'react';
import { ai } from '../../utils/helpers';
import Loader from '../Loader';
import { useGame } from '../../context/GameContext';
import { useIELTS } from '../../context/IELTSContext';

export default function ReadingLab() {
    const { addXP } = useGame();
    const { addScore } = useIELTS();

    // States
    const [status, setStatus] = useState("idle"); // idle, generating, reading, review
    const [passage, setPassage] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState(null);
    const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 mins
    const [topic, setTopic] = useState("Technology");

    // Timer
    useEffect(() => {
        let timer;
        if (status === "reading" && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && status === "reading") {
            handleSubmit();
        }
        return () => clearInterval(timer);
    }, [status, timeLeft]);

    const generateTest = async () => {
        setStatus("generating");
        setResults(null);
        setAnswers({});
        setTimeLeft(20 * 60);

        try {
            const prompt = `Generate an IELTS Reading Test (Academic).
Topic: ${topic}
Passage Length: 500-600 words.
Difficulty: Band 8-9.

Structure:
1. Title
2. Passage content (paragraphs A, B, C, D, E)
3. 5 Questions: "True / False / Not Given" (based on specific details)
4. 4 Questions: "Matching Headings" (Match List of Headings i-viii to Paragraphs A-D)

Return JSON ONLY:
{
  "title": "string",
  "text": "Full passage text with [Paragraph A] markers...",
  "tfng": [
    { "id": 1, "q": "Question text", "a": "TRUE|FALSE|NOT GIVEN", "explanation": "Why..." }
  ],
  "matching": [
    { "id": 6, "para": "A", "a": "iv", "explanation": "Why..." }
  ],
  "headings": [
    { "id": "i", "text": "Heading text" }, ... (8 headings total)
  ]
}`;

            const r = await ai([{ role: "user", content: prompt }], "You are an IELTS exam creator.");
            const jsonStr = r.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            setPassage(data);
            setQuestions([...data.tfng, ...data.matching.map(m => ({ ...m, type: "match" }))]);
            setStatus("reading");
        } catch (e) {
            console.error(e);
            alert("Failed to generate test. Please try again.");
            setStatus("idle");
        }
    };

    const handleSubmit = React.useCallback(() => {
        if (!passage) return;

        let score = 0;
        let total = questions.length; // Should be 9
        const detailedResults = [];

        // Check TFNG
        passage.tfng.forEach(q => {
            const userAns = (answers[q.id] || "").toUpperCase();
            const correct = userAns === q.a.toUpperCase();
            if (correct) score++;
            detailedResults.push({ ...q, userAns, correct });
        });

        // Check Matching
        passage.matching.forEach(q => {
            const userAns = (answers[q.id] || "").toLowerCase();
            const correct = userAns === q.a.toLowerCase();
            if (correct) score++;
            detailedResults.push({ ...q, userAns, correct, type: "match" });
        });

        const band = calculateBand(score, total);
        setResults({ score, total, band, details: detailedResults });
        setStatus("review");

        // Awards
        addXP(score * 15);
        // Save to IELTS logs could go here
    }, [passage, questions, answers, addXP]);

    const calculateBand = (score, total) => {
        const pct = score / total;
        if (pct >= 0.9) return 9;
        if (pct >= 0.8) return 8;
        if (pct >= 0.7) return 7;
        if (pct >= 0.6) return 6;
        if (pct >= 0.5) return 5;
        return 4;
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <div className="reading-lab" style={{ height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
            {/* Header / Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div className="ct" style={{ margin: 0 }}>📖 Reading Lab</div>
                    {status === "reading" && <div className="badge" style={{ background: timeLeft < 300 ? "var(--rose)" : "var(--card)", color: "#fff" }}>⏱️ {formatTime(timeLeft)}</div>}
                </div>
                {status === "idle" && (
                    <div style={{ display: "flex", gap: 10 }}>
                        <select className="inp" style={{ width: 140, margin: 0 }} value={topic} onChange={e => setTopic(e.target.value)}>
                            {["Technology", "Environment", "Education", "Health", "Society", "Space"].map(t => <option key={t}>{t}</option>)}
                        </select>
                        <button className="btn btn-g" onClick={generateTest}>Generate Test</button>
                    </div>
                )}
                {status === "reading" && <button className="btn btn-p" onClick={handleSubmit}>Submit Answers</button>}
                {status === "review" && <button className="btn btn-gh" onClick={() => setStatus("idle")}>New Test</button>}
            </div>

            {status === "generating" && <div style={{ padding: 40 }}><Loader text="Writing passage & questions..." /></div>}

            {(status === "reading" || status === "review") && passage && (
                <div style={{ display: "flex", gap: 20, flex: 1, overflow: "hidden" }}>
                    {/* Passage Pane */}
                    <div className="card" style={{ flex: 1, overflowY: "auto", fontSize: 13, lineHeight: 1.7, padding: 20 }}>
                        <h2 style={{ fontSize: 18, marginBottom: 10 }}>{passage.title}</h2>
                        <div style={{ whiteSpace: "pre-wrap" }}>{passage.text}</div>
                    </div>

                    {/* Questions Pane */}
                    <div className="card" style={{ flex: 1, overflowY: "auto", padding: 20, background: "var(--card2)" }}>
                        {/* Matching Headings */}
                        <div style={{ marginBottom: 20 }}>
                            <div className="ct" style={{ fontSize: 14 }}>Questions 1-4: Matching Headings</div>
                            <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 10 }}>Choose the correct heading (i-viii) for each paragraph.</div>

                            <div style={{ background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 8, marginBottom: 14 }}>
                                {passage.headings.map(h => (
                                    <div key={h.id} style={{ fontSize: 11, marginBottom: 4 }}>
                                        <b style={{ color: "var(--teal)", marginRight: 6 }}>{h.id}</b> {h.text}
                                    </div>
                                ))}
                            </div>

                            {passage.matching.map((q, i) => (
                                <div key={q.id} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>{i + 1}. Paragraph {q.para}</span>
                                    <select
                                        className="inp"
                                        style={{ width: 80, margin: 0, padding: 4 }}
                                        value={answers[q.id] || ""}
                                        onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                                        disabled={status === "review"}
                                    >
                                        <option value="">-</option>
                                        {passage.headings.map(h => <option key={h.id} value={h.id}>{h.id}</option>)}
                                    </select>
                                    {status === "review" && (
                                        <span style={{ fontSize: 11, color: results.details.find(d => d.id === q.id)?.correct ? "var(--teal)" : "var(--rose)" }}>
                                            {results.details.find(d => d.id === q.id)?.correct ? "✅" : `❌ (Ans: ${q.a})`}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* TFNG */}
                        <div>
                            <div className="ct" style={{ fontSize: 14 }}>Questions 5-9: True / False / Not Given</div>
                            {passage.tfng.map((q, i) => (
                                <div key={q.id} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                                        <span style={{ fontWeight: 700, minWidth: 20 }}>{i + 5}.</span>
                                        <span>{q.q}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, marginLeft: 28 }}>
                                        {["TRUE", "FALSE", "NOT GIVEN"].map(opt => (
                                            <button
                                                key={opt}
                                                className={`btn btn-sm ${answers[q.id] === opt ? "btn-p" : "btn-gh"}`}
                                                style={{ opacity: status === "review" && answers[q.id] !== opt ? 0.5 : 1 }}
                                                onClick={() => status !== "review" && setAnswers({ ...answers, [q.id]: opt })}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    {status === "review" && (
                                        <div style={{ marginLeft: 28, marginTop: 8, fontSize: 11 }}>
                                            {results.details.find(d => d.id === q.id)?.correct
                                                ? <span style={{ color: "var(--teal)" }}>✅ Correct</span>
                                                : <span style={{ color: "var(--rose)" }}>❌ Correct: {q.a}</span>
                                            }
                                            <div style={{ color: "var(--t2)", marginTop: 4 }}>💡 {q.explanation}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {status === "review" && (
                            <div style={{ marginTop: 20, textAlign: "center", padding: 20, background: "rgba(0,221,179,0.1)", borderRadius: 12 }}>
                                <div style={{ fontSize: 12, color: "var(--t2)" }}>ESTIMATED BAND</div>
                                <div style={{ fontSize: 32, fontWeight: 700, color: "var(--teal)" }}>{results.band}.0</div>
                                <div style={{ fontSize: 14 }}>Score: {results.score} / {results.total}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
