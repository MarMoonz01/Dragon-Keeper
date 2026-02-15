import React, { useState, useEffect, useRef } from 'react';
import { ai } from '../../utils/helpers';
import Loader from '../Loader';
import { useGame } from '../../context/GameContext';
import { useIELTS } from '../../context/IELTSContext';

export default function ListeningLab() {
    const { addXP } = useGame();

    // States
    const [status, setStatus] = useState("idle"); // idle, generating, playing, review
    const [script, setScript] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [rate, setRate] = useState(1);
    const [progress, setProgress] = useState(0);

    const synth = window.speechSynthesis;
    const utteranceRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        };
    }, []);

    const generateTest = async () => {
        setStatus("generating");
        setResults(null);
        setAnswers({});

        try {
            const prompt = `Generate an IELTS Listening Section 2 (Monologue).
Context: A guide giving a tour or explaining a facility.
Length: 300-400 words.

Structure:
1. Script (The spoken text)
2. 5 Questions: "Gap Fill" (Complete notes with 1 word/number)
3. 5 Questions: "Multiple Choice" (A, B, or C)

Return JSON ONLY:
{
  "title": "Tour of...",
  "script": "Full spoken text...",
  "gaps": [
    { "id": 1, "q": "The facility opens at [gap] every day.", "a": "9am", "hint": "Time" }
  ],
  "mcq": [
    { "id": 6, "q": "What is included in the ticket?", "opts": ["A) Lunch", "B) Guidebook", "C) Map"], "a": "B" }
  ]
}`;

            const r = await ai([{ role: "user", content: prompt }], "You are an IELTS exam creator.");
            const jsonStr = r.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            setScript(data);
            setQuestions([...data.gaps.map(g => ({ ...g, type: "gap" })), ...data.mcq.map(m => ({ ...m, type: "mcq" }))]);
            setStatus("ready");
            prepareAudio(data.script);
        } catch (e) {
            console.error(e);
            alert("Failed to generate test. Please try again.");
            setStatus("idle");
        }
    };

    const prepareAudio = (text) => {
        if (synth.speaking) synth.cancel();
        const u = new SpeechSynthesisUtterance(text);

        // Try to find a British voice
        const voices = synth.getVoices();
        const gbVoice = voices.find(v => v.lang.includes("GB") || v.name.includes("British"));
        if (gbVoice) u.voice = gbVoice;

        u.rate = rate; // 1 or 1.25
        u.pitch = 1;

        u.onend = () => {
            setIsPlaying(false);
            setProgress(100);
        };

        u.onboundary = (e) => {
            // Rough progress estimation based on char index
            const len = text.length;
            const p = (e.charIndex / len) * 100;
            setProgress(p);
        };

        utteranceRef.current = u;
    };

    const togglePlay = () => {
        if (!script) return;

        if (isPlaying) {
            synth.pause();
            setIsPlaying(false);
        } else {
            if (synth.paused) {
                synth.resume();
            } else {
                // Determine rate before playing
                utteranceRef.current.rate = rate;
                synth.speak(utteranceRef.current);
            }
            setIsPlaying(true);
            setStatus("playing");
        }
    };

    const changeSpeed = () => {
        const newRate = rate === 1 ? 1.2 : 1;
        setRate(newRate);
        if (utteranceRef.current) {
            // Need to cancel and restart to change rate mid-speech in some browsers, 
            // but for simplicity we'll just update state for next play or rely on dynamic update support
            synth.cancel();
            prepareAudio(script.script);
            setIsPlaying(false);
        }
    };

    const handleSubmit = () => {
        synth.cancel();
        setIsPlaying(false);

        let score = 0;
        let total = questions.length;
        const detailedResults = [];

        // Check Gaps
        script.gaps.forEach(q => {
            const userAns = (answers[q.id] || "").trim().toLowerCase();
            const correctAns = q.a.toLowerCase();
            const correct = userAns === correctAns;
            if (correct) score++;
            detailedResults.push({ ...q, userAns, correct, type: "gap" });
        });

        // Check MCQ
        script.mcq.forEach(q => {
            const userAns = (answers[q.id] || "").toUpperCase();
            const correctAns = q.a.toUpperCase(); // Expect "B" etc.
            const correct = userAns.startsWith(correctAns); // Handle "B) Guidebook" case if needed
            if (correct) score++;
            detailedResults.push({ ...q, userAns, correct, type: "mcq" });
        });

        setResults({ score, total, details: detailedResults });
        setStatus("review");
        addXP(score * 15);
    };

    return (
        <div className="listening-lab" style={{ height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
            {/* Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className="ct" style={{ margin: 0 }}>🎧 Listening Lab</div>

                {status === "idle" && <button className="btn btn-g" onClick={generateTest}>Generate Simulation</button>}

                {(status === "ready" || status === "playing") && (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button className="btn btn-gh" onClick={changeSpeed} style={{ width: 60 }}>{rate}x</button>
                        <button className={`btn ${isPlaying ? "btn-p" : "btn-g"}`} onClick={togglePlay} style={{ width: 100 }}>
                            {isPlaying ? "⏸ Pause" : "▶ Play"}
                        </button>
                    </div>
                )}

                {status === "playing" && <button className="btn btn-p" onClick={handleSubmit}>Submit</button>}
                {status === "review" && <button className="btn btn-gh" onClick={() => { setStatus("idle"); setScript(null); }}>New Test</button>}
            </div>

            {status === "generating" && <div style={{ padding: 40 }}><Loader text="Generating audio script..." /></div>}

            {/* Progress Bar */}
            {(status === "playing" || status === "ready") && (
                <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "var(--teal)", transition: "width 0.2s linear" }} />
                </div>
            )}

            {(status === "ready" || status === "playing" || status === "review") && script && (
                <div className="card" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                    <h2 style={{ fontSize: 16, marginBottom: 10, color: "var(--t2)" }}>{script.title}</h2>

                    {/* Gap Fill Section */}
                    <div style={{ marginBottom: 24 }}>
                        <div className="ct" style={{ fontSize: 14 }}>Questions 1-5: Complete the notes</div>
                        <div style={{ fontSize: 11, color: "var(--t2)", marginBottom: 10 }}>Write ONE WORD and/or A NUMBER for each answer.</div>

                        {script.gaps.map((q, i) => (
                            <div key={q.id} style={{ marginBottom: 12, display: "flex", alignItems: "baseline", gap: 8, fontSize: 13 }}>
                                <span style={{ fontWeight: 700, color: "var(--teal)" }}>{i + 1}.</span>
                                {q.q.split("[gap]").map((part, idx) => (
                                    <React.Fragment key={idx}>
                                        {part}
                                        {idx === 0 && (
                                            <input
                                                className="inp"
                                                style={{ width: 100, margin: "0 4px", padding: "2px 8px", display: "inline-block" }}
                                                placeholder={q.hint}
                                                value={answers[q.id] || ""}
                                                onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                                                disabled={status === "review"}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                                {status === "review" && (
                                    <span style={{ fontSize: 11, marginLeft: 8, color: results.details.find(d => d.id === q.id).correct ? "var(--teal)" : "var(--rose)" }}>
                                        {results.details.find(d => d.id === q.id).correct ? "✅" : `❌ ${q.a}`}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* MCQ Section */}
                    <div>
                        <div className="ct" style={{ fontSize: 14 }}>Questions 6-10: Choose the correct letter</div>

                        {script.mcq.map((q, i) => (
                            <div key={q.id} style={{ marginBottom: 16 }}>
                                <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                                    <span style={{ color: "var(--teal)", marginRight: 8 }}>{i + 6}.</span>{q.q}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 24 }}>
                                    {q.opts.map(opt => (
                                        <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", opacity: status === "review" && !opt.startsWith(q.a) && answers[q.id] !== opt.charAt(0) ? 0.5 : 1 }}>
                                            <input
                                                type="radio"
                                                name={`q${q.id}`}
                                                checked={answers[q.id] === opt.charAt(0)}
                                                onChange={() => status !== "review" && setAnswers({ ...answers, [q.id]: opt.charAt(0) })}
                                            />
                                            <span style={{
                                                color: status === "review" && opt.startsWith(q.a) ? "var(--teal)" :
                                                    status === "review" && answers[q.id] === opt.charAt(0) && !opt.startsWith(q.a) ? "var(--rose)" : "inherit"
                                            }}>
                                                {opt}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {status === "review" && (
                        <div style={{ marginTop: 30, padding: 20, background: "rgba(255,255,255,0.05)", borderRadius: 12 }}>
                            <div className="ct">Transcript Preview</div>
                            <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--t2)" }}>
                                {script.script}
                            </div>
                            <div style={{ marginTop: 14, textAlign: "center", fontSize: 18, fontWeight: 700 }}>
                                Score: {results.score} / {results.total}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
