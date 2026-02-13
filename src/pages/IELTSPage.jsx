import React, { useState, useRef, useEffect } from 'react';
import Loader from '../components/Loader';
import { ai } from '../utils/helpers';
import { ISKILLS, TOPICS } from '../data/constants';


import { supabase } from '../utils/supabaseClient';

export default function IELTSPage() {
    const [tab, setTab] = useState("tracker");
    const [notebook, setNotebook] = useState([]);
    const [nbTab, setNbTab] = useState("vocab");
    const [genNb, setGenNb] = useState(false);
    const [nbInput, setNbInput] = useState("");
    const [genVocab, setGenVocab] = useState(false);
    const [writingTask, setWritingTask] = useState(2); // 1 or 2
    const [essay, setEssay] = useState("");
    const [scores, setScores] = useState(null);
    const [scoring, setScoring] = useState(false);
    const [topic, setTopic] = useState(null);
    const [answer, setAnswer] = useState("");
    const [speakFb, setSpeakFb] = useState("");
    const [speakLoading, setSpeakLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);

    // Cleanup speech recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);
    const [fcIdx, setFcIdx] = useState(0);
    const [fcFlip, setFcFlip] = useState(false);
    const [realScores, setRealScores] = useState([]);
    const [showLogModal, setShowLogModal] = useState(false);
    const [newLog, setNewLog] = useState({ listening: "", reading: "", writing: "", speaking: "", note: "" });
    const [practiceLogs, setPracticeLogs] = useState([]);


    const latestScore = realScores.length > 0 ? realScores[0] : null;
    const band = latestScore ? latestScore.overall : "-";

    // Load notebook and scores on mount

    React.useEffect(() => {
        if (!supabase) return;
        fetchScores();
        fetchNotebook();
        fetchPracticeLogs();
    }, [supabase]); // Re-fetch if supabase client becomes available (e.g. key added)

    const fetchScores = async () => {
        const { data, error } = await supabase.from('scores').select('*').order('created_at', { ascending: false });
        if (error) console.error("Error fetching scores:", error);
        else if (data) setRealScores(data);
    };

    const fetchNotebook = async () => {
        const { data, error } = await supabase.from('notebook').select('*').order('created_at', { ascending: false });
        if (error) console.error("Error fetching notebook:", error);
        else if (data) setNotebook(data);
    };

    const fetchPracticeLogs = async () => {
        const { data, error } = await supabase.from('practice_logs').select('*').order('created_at', { ascending: false });
        if (error) console.error("Error fetching practice logs:", error);
        else if (data) setPracticeLogs(data);
    };

    const togglePracticeLog = async (id, currentStatus) => {
        if (!supabase) return;
        const { error } = await supabase.from('practice_logs').update({ completed: !currentStatus }).eq('id', id);
        if (error) console.error("Error updating log:", error);
        else fetchPracticeLogs();
    };



    const handleSaveLog = async () => {
        if (!supabase) return alert("Please configure Supabase in Settings first.");

        const l = parseFloat(newLog.listening) || 0;
        const r = parseFloat(newLog.reading) || 0;
        const w = parseFloat(newLog.writing) || 0;
        const s = parseFloat(newLog.speaking) || 0;
        const overall = (Math.round((l + r + w + s) / 4 * 2) / 2).toFixed(1); // Standard IELTS Rounding (nearest 0.5)

        const { error } = await supabase
            .from('scores')
            .insert([{
                listening: l, reading: r, writing: w, speaking: s,
                overall: parseFloat(overall), note: newLog.note
            }]);

        if (error) {
            alert("Error saving score: " + error.message);
        } else {
            setNewLog({ listening: "", reading: "", writing: "", speaking: "", note: "" });
            setShowLogModal(false);
            fetchScores();
        }
    };

    const addToNotebook = async (item) => {
        if (supabase) {
            const { error } = await supabase.from('notebook').insert([item]);
            if (error) {
                console.error("Error saving to notebook:", error);
                alert("Failed to save to Supabase: " + error.message);
            } else {
                fetchNotebook();
            }
        } else {
            // Fallback to local state ONLY if no supabase (but we want to avoid this ideally)
            setNotebook([item, ...notebook]);
        }
    };

    const generateKnowledge = async () => {
        if (!nbInput.trim()) return;
        setGenNb(true);
        let prompt = "";
        let sys = "You are an expert language tutor.";

        if (nbTab === "vocab") {
            prompt = `Analyze the word/phrase: "${nbInput}".
Respond in this EXACT format:
WORD: ${nbInput}
PHONETIC: [IPA]
TYPE: [part of speech]
DEF: [definition]
EXAMPLE: [sentence]
MASTERY: 1`;
        } else if (nbTab === "conv") {
            prompt = `Create a short conversation usage for: "${nbInput}".
Respond in this EXACT format:
TOPIC: ${nbInput}
CONTEXT: [situation]
A: [Speaker A line]
B: [Speaker B line]
NUANCE: [explanation of usage/tone]`;
        } else {
            prompt = `Explain the grammar rule/concept: "${nbInput}".
Respond in this EXACT format:
RULE: ${nbInput}
EXPLAIN: [simple explanation]
STRUCTURE: [formula/pattern]
EXAMPLE: [correct sentence]
INCORRECT: [common mistake]`;
        }

        try {
            const r = await ai([{ role: "user", content: prompt }], sys);
            const get = k => { const m = r.match(new RegExp(k + ":\\s*(.+)")); return m ? m[1].trim() : ""; };

            let newItem = { category: nbTab, created_at: new Date().toISOString(), original: nbInput };

            if (nbTab === "vocab") {
                newItem = { ...newItem, word: get("WORD") || nbInput, phonetic: get("PHONETIC"), type: get("TYPE"), def: get("DEF"), example: get("EXAMPLE"), mastery: 1 };
            } else if (nbTab === "conv") {
                newItem = { ...newItem, topic: get("TOPIC"), context: get("CONTEXT"), a: get("A"), b: get("B"), nuance: get("NUANCE") };
            } else {
                newItem = { ...newItem, rule: get("RULE"), explain: get("EXPLAIN"), structure: get("STRUCTURE"), example: get("EXAMPLE"), incorrect: get("INCORRECT") };
            }

            addToNotebook(newItem);
            setNbInput("");
        } catch (e) {
            console.error(e);
        }
        setGenNb(false);
    };

    const generateDailyVocab = async () => {
        setGenVocab(true);
        const r = await ai([{ role: "user", content: "Generate 5 advanced IELTS vocabulary words (C1/C2 level) that are useful for high-scoring essays/speaking.\n\nRespond in this EXACT format for each word (separated by '---'):\nWORD: [word]\nPHONETIC: [IPA]\nTYPE: [noun/verb/adj/etc.]\nDEF: [short definition]\nEXAMPLE: [sentence using the word]\nMASTERY: 1" }],
            "You are an IELTS expert tutor.");

        const newWords = r.split("---").map(chunk => {
            const get = k => { const m = chunk.match(new RegExp(k + ":\\s*(.+)")); return m ? m[1].trim() : ""; };
            if (!get("WORD")) return null;
            return {
                word: get("WORD"),
                phonetic: get("PHONETIC"),
                type: get("TYPE"),
                def: get("DEF"),
                example: get("EXAMPLE"),
                mastery: 1,
                category: 'vocab',
                created_at: new Date().toISOString()
            };
        }).filter(w => w);

        if (newWords.length > 0) {
            if (supabase) {
                const { error } = await supabase.from('notebook').insert(newWords);
                if (error) console.error("Error saving batch notebook:", error);
                else fetchNotebook();
            } else {
                setNotebook([...newWords, ...notebook]);
            }
        }
        setGenVocab(false);
    };

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

    const toggleRecord = () => {
        if (isRecording) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsRecording(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("Browser does not support Speech Recognition.");

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setAnswer(prev => (prev ? prev + " " : "") + transcript);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (event) => {
            console.error(event.error);
            setIsRecording(false);
        };
    };

    const speakCoach = async () => {
        if (!answer.trim() || !topic) return;
        setSpeakLoading(true);
        const r = await ai([{ role: "user", content: "IELTS Speaking evaluation.\nTopic: \"" + topic + "\"\nTranscript: \"" + answer + "\"\n\nEvaluate:\n• Fluency & Coherence: [band + 1 tip]\n• Lexical Resource: [band + 1 tip]\n• Grammar: [band + 1 tip]\n• Pronunciation: [band + comment on clarity/flow based on text]\n• Overall: [band]\n• Next step: [1 specific action]" }],
            "You are an experienced IELTS Speaking examiner. Give fair, specific, constructive feedback.");
        setSpeakFb(r); setSpeakLoading(false);
    };

    return (
        <div>
            <div className="ph"><div className="ph-title">IELTS Tracker</div><div className="ph-sub">Track · Practice · Master every band with AI coaching</div></div>
            <div style={{ background: "linear-gradient(135deg,rgba(167,139,250,.12),rgba(0,221,179,.08))", border: "1px solid rgba(167,139,250,.2)", borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", gap: 22, marginBottom: 18, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t2)", letterSpacing: 2, marginBottom: 3 }}>OVERALL BAND</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 50, fontWeight: 700, color: "var(--teal)", lineHeight: 1, textShadow: "0 0 30px rgba(0,221,179,.4)" }}>{band}</div>
                    <span className="badge bt" style={{ marginTop: 6 }}>Target: 7.5</span>
                    <button className="btn btn-gh btn-sm" style={{ marginTop: 12, width: "100%" }} onClick={() => setShowLogModal(true)}>
                        📝 Log Score
                    </button>
                    {!supabase && <div style={{ fontSize: 10, color: "var(--rose)", marginTop: 8 }}>⚠️ DB not connected</div>}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        {ISKILLS.map((s, idx) => {
                            const skillKey = s.name.toLowerCase();
                            const realVal = latestScore ? latestScore[skillKey] : 0;
                            return (
                                <div key={s.name} className="isr">
                                    <div style={{ fontSize: 16, width: 22 }}>{s.ic}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, width: 68, flexShrink: 0 }}>{s.name}</div>
                                    <div className="ib"><div className="ibf" style={{ width: realVal / 9 * 100 + "%", background: s.color }} /></div>
                                    <div className="isc" style={{ color: s.color }}>{realVal || "-"}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="tabs">
                {["tracker", "writing", "speaking", "notebook", "flashcards"].map(t => (
                    <button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</button>
                ))}
            </div>

            {tab === "tracker" && (
                <div className="g2">
                    <div className="card">
                        <div className="ct">Practice Log</div>
                        <div className="tl">
                            <div className="tl">
                                {practiceLogs.length === 0 && (
                                    <div style={{ fontSize: 12, color: "var(--t2)", textAlign: "center", padding: 20 }}>
                                        {supabase ? "No practice logs found. Add data manually to DB for now." : "⚠️ Connect Supabase to see logs"}
                                    </div>
                                )}
                                {practiceLogs.map((e) => (
                                    <div key={e.id} className="tli" onClick={() => togglePracticeLog(e.id, e.completed)} style={{ cursor: "pointer" }}>
                                        <div className={"tld" + (e.completed ? " y" : "")} />
                                        <div className="tlt">{e.time}</div><div className="tln">{e.title}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="ct">Score History</div>
                        {ISKILLS.map(s => (
                            <div key={s.name} style={{ marginBottom: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700 }}>{s.ic} {s.name}</span>
                                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: s.color }}>{s.sc}</span>
                                </div>
                                <div style={{ display: "flex", gap: 5 }}>
                                    {s.hist.map((h, i) => (
                                        <div key={i} style={{ flex: 1, background: "rgba(255,255,255,.05)", borderRadius: 6, padding: "5px 3px", textAlign: "center" }}>
                                            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: i === s.hist.length - 1 ? s.color : "var(--t2)" }}>
                                                {(realScores[i] && realScores[i][s.name.toLowerCase()]) || "-"}
                                            </div>
                                            <div style={{ fontSize: 9, color: "var(--t3)" }}>
                                                {realScores[i] ? new Date(realScores[i].created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : "-"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card cs2">
                        <div className="ct">🤖 AI Target Analysis</div>
                        <div className="aibx">{"🎯 Reaching Band 7.5 (current: " + band + "):\n\n• Writing (+1.5 needed): Biggest gap. Practice 1 Task 2 daily. Fully address all prompt parts & expand vocabulary range.\n• Reading (+1.0): Cap each passage at 18 min. Practice True/False/Not Given question type separately.\n• Listening (at 7.0): Focus on Section 4 monologues. Predict answers before audio plays.\n• Speaking (+1.0): Extend Part 2 to full 2 minutes. Use discourse markers: 'What's more...', 'In contrast...'\n\n📅 Projected Timeline: Band 7.5 achievable in 10–12 weeks at current pace."}</div>
                    </div>
                </div>
            )}

            {tab === "writing" && (
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
            )}

            {tab === "speaking" && (
                <div className="g2">
                    <div className="card">
                        <div className="ct">Practice Topics</div>
                        {TOPICS.map((t, i) => (
                            <div key={t} className={"task" + (topic === t ? " done" : "")} style={{ cursor: "pointer" }} onClick={() => { setTopic(t); setSpeakFb(""); setAnswer(""); }}>
                                <span style={{ fontSize: 14 }}>{"🗣️📱🏙️🤔📚"[i]}</span>
                                <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{t}</div>
                                {topic === t && <span className="badge bt">Active</span>}
                            </div>
                        ))}
                    </div>
                    <div className="card">
                        <div className="ct">🎤 AI Speaking Coach</div>
                        {topic ? (
                            <>
                                <div className="ins" style={{ marginBottom: 12 }}>
                                    <span className="ins-ic">🎯</span><span><strong>Topic:</strong> {topic}</span>
                                </div>
                                <textarea className="inp" placeholder="Type answer OR click Mic to record..." value={answer} onChange={e => setAnswer(e.target.value)} rows={5} />
                                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                                    <button className={"btn " + (isRecording ? "btn-rose" : "btn-gh")} onClick={toggleRecord} style={{ width: 50, justifyContent: "center" }}>
                                        {isRecording ? "⬛" : "🎤"}
                                    </button>
                                    <button className="btn btn-g" style={{ flex: 1, justifyContent: "center" }} onClick={speakCoach} disabled={speakLoading || !answer.trim()}>
                                        {speakLoading ? "🤖 Analysing..." : "🤖 Get Claude Feedback"}
                                    </button>
                                </div>
                                {speakLoading && <div style={{ marginTop: 10 }}><Loader text="Claude is analysing your response..." /></div>}
                                {speakFb && <div className="aibx" style={{ marginTop: 12 }}>{speakFb}</div>}
                            </>
                        ) : (
                            <div style={{ fontSize: 12, color: "var(--t3)", textAlign: "center", padding: "28px 0" }}>Select a topic from the left to start</div>
                        )}
                        <div className="aibx" style={{ marginTop: 14 }}>{"💡 Band 7 Tips:\n\n• Fluency: Use natural connectors — 'Well, the thing is...', 'What I find interesting is...'\n• Vocabulary: Avoid repeating words. Use idiomatic phrases.\n• Grammar: Mix tenses. Use conditionals: 'If I were to choose...'\n• Pronunciation: Stress content words. Use rising/falling intonation."}</div>
                    </div>
                </div>
            )}

            {tab === "notebook" && (
                <div>
                    <div className="card" style={{ marginBottom: 16, background: "var(--card2)", border: "1px solid var(--teal)" }}>
                        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                            {["vocab", "conv", "grammar"].map(t => (
                                <button key={t} onClick={() => setNbTab(t)} style={{
                                    padding: "6px 12px", borderRadius: 20, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                                    background: nbTab === t ? "var(--teal)" : "rgba(255,255,255,0.05)",
                                    color: nbTab === t ? "#000" : "var(--t2)"
                                }}>
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <input
                                className="inp"
                                placeholder={nbTab === "vocab" ? "Enter word (e.g. Serendipity)..." : nbTab === "conv" ? "Enter topic (e.g. Checking into hotel)..." : "Enter grammar rule (e.g. Past Perfect)..."}
                                value={nbInput}
                                onChange={e => setNbInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && generateKnowledge()}
                            />
                            <button className="btn btn-g" onClick={generateKnowledge} disabled={genNb || !nbInput.trim()}>
                                {genNb ? "✨ Magic..." : "✨ Add + AI Explain"}
                            </button>
                            {nbTab === "vocab" && (
                                <button className="btn btn-gh" onClick={generateDailyVocab} disabled={genVocab}>
                                    {genVocab ? "..." : "📅 Daily 3"}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="g2">
                        {notebook.filter(i => i.category === nbTab).map((v, i) => (
                            <div key={i} className="vc" style={{ cursor: "default" }}>
                                {v.category === "vocab" && (
                                    <>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <div className="vw">{v.word}</div>
                                            <div className="vph">{v.phonetic}</div>
                                        </div>
                                        <div className="vt">{v.type}</div>
                                        <div className="vd">{v.def}</div>
                                        <div className="ve">"{v.example}"</div>
                                    </>
                                )}
                                {v.category === "conv" && (
                                    <>
                                        <div className="vw" style={{ fontSize: 13 }}>💬 {v.topic}</div>
                                        <div style={{ fontSize: 10, color: "var(--t2)", marginBottom: 8 }}>{v.context}</div>
                                        <div style={{ background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6, marginBottom: 6 }}>
                                            <div style={{ fontSize: 11, color: "var(--teal)" }}>A: {v.a}</div>
                                            <div style={{ fontSize: 11, color: "var(--gold)" }}>B: {v.b}</div>
                                        </div>
                                        <div style={{ fontSize: 10, fontStyle: "italic", color: "var(--t2)" }}>💡 {v.nuance}</div>
                                    </>
                                )}
                                {v.category === "grammar" && (
                                    <>
                                        <div className="vw" style={{ fontSize: 14 }}>📐 {v.rule}</div>
                                        <div className="vd" style={{ marginBottom: 6 }}>{v.explain}</div>
                                        <div style={{ fontFamily: "monospace", fontSize: 10, background: "rgba(167,139,250,0.1)", color: "var(--violet)", padding: 4, borderRadius: 4, marginBottom: 6 }}>{v.structure}</div>
                                        <div className="ve">✅ {v.example}</div>
                                        <div className="ve" style={{ borderLeftColor: "var(--rose)", color: "var(--rose)" }}>❌ {v.incorrect}</div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    {notebook.filter(i => i.category === nbTab).length === 0 && (
                        <div style={{ textAlign: "center", padding: 40, color: "var(--t2)", fontSize: 12 }}>
                            No items yet. Try adding one above!
                        </div>
                    )}
                </div>
            )}

            {tab === "flashcards" && (
                <div>
                    {notebook.filter(i => i.category === 'vocab').length === 0 ? (
                        <div className="card" style={{ textAlign: "center", padding: 40 }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>No Flashcards Yet</div>
                            <div style={{ fontSize: 12, color: "var(--t2)" }}>Head to the <strong>Notebook</strong> tab and add some vocabulary first!</div>
                        </div>
                    ) : (
                        <>
                            <div style={{ textAlign: "center", marginBottom: 14 }}>
                                <span style={{ fontSize: 11, color: "var(--t2)" }}>Card {fcIdx + 1} of {notebook.filter(i => i.category === 'vocab').length} · Tap to reveal</span>
                            </div>
                            <div className="fc" onClick={() => setFcFlip(f => !f)}>
                                {!fcFlip ? (
                                    <>
                                        <div className="fcw">{notebook.filter(i => i.category === 'vocab')[fcIdx]?.word}</div>
                                        <div className="fcp">{notebook.filter(i => i.category === 'vocab')[fcIdx]?.phonetic}</div>
                                        <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 14 }}>Tap to reveal ↓</div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontSize: 11, color: "var(--violet)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{notebook.filter(i => i.category === 'vocab')[fcIdx]?.type}</div>
                                        <div style={{ fontSize: 15, color: "var(--t1)", fontWeight: 700, marginBottom: 8 }}>{notebook.filter(i => i.category === 'vocab')[fcIdx]?.def}</div>
                                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontStyle: "italic", borderLeft: "2px solid var(--violet)", paddingLeft: 10 }}>"{notebook.filter(i => i.category === 'vocab')[fcIdx]?.example}"</div>
                                    </>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
                                <button className="btn btn-gh" onClick={() => { setFcFlip(false); setFcIdx(i => Math.max(0, i - 1)) }}>← Prev</button>
                                {fcFlip && (
                                    <>
                                        <button className="btn btn-sm" style={{ background: "rgba(255,94,135,.18)", color: "var(--rose)", border: "1px solid rgba(255,94,135,.3)" }} onClick={() => { const len = notebook.filter(n => n.category === 'vocab').length; setFcFlip(false); setFcIdx(i => len > 0 ? (i + 1) % len : 0) }}>😐 Hard</button>
                                        <button className="btn btn-sm" style={{ background: "rgba(52,211,153,.18)", color: "var(--green)", border: "1px solid rgba(52,211,153,.3)" }} onClick={() => { const len = notebook.filter(n => n.category === 'vocab').length; setFcFlip(false); setFcIdx(i => len > 0 ? (i + 1) % len : 0) }}>✓ Got it</button>
                                    </>
                                )}
                                <button className="btn btn-gh" onClick={() => { const len = notebook.filter(n => n.category === 'vocab').length; setFcFlip(false); setFcIdx(i => len > 0 ? (i + 1) % len : 0) }}>Next →</button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {showLogModal && (
                <div className="mo">
                    <div className="mc">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <div className="mc-t" style={{ margin: 0 }}>📝 Log IELTS Score</div>
                            <button className="btn btn-gh btn-sm" onClick={() => setShowLogModal(false)}>✕</button>
                        </div>
                        <div className="g2" style={{ marginBottom: 12 }}>
                            {["Listening", "Reading", "Writing", "Speaking"].map(s => (
                                <div key={s}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)" }}>{s}</label>
                                    <input className="inp" type="number" step="0.5" max="9"
                                        value={newLog[s.toLowerCase()]}
                                        onChange={e => setNewLog({ ...newLog, [s.toLowerCase()]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)" }}>Note (Optional)</label>
                        <input className="inp" style={{ marginBottom: 20 }} placeholder="e.g. British Council Mock..."
                            value={newLog.note} onChange={e => setNewLog({ ...newLog, note: e.target.value })}
                        />
                        <button className="btn btn-g" style={{ width: "100%" }} onClick={handleSaveLog}>Save Log</button>
                    </div>
                </div>
            )}
        </div>
    );
}
