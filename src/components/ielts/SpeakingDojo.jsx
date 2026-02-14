import React, { useState, useRef, useEffect } from 'react';
import Loader from '../Loader';
import { ai } from '../../utils/helpers';
import { TOPICS } from '../../data/constants';

export default function SpeakingDojo({ setErrorMsg }) {
    const [topic, setTopic] = useState(null);
    const [answer, setAnswer] = useState("");
    const [speakFb, setSpeakFb] = useState("");
    const [speakLoading, setSpeakLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
    }, []);

    const toggleRecord = () => {
        if (isRecording) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsRecording(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { setErrorMsg("Browser does not support Speech Recognition."); return; }

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
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event) => { console.error(event.error); setIsRecording(false); };
    };

    const speakCoach = async () => {
        if (!answer.trim() || !topic) return;
        setSpeakLoading(true);
        const r = await ai([{ role: "user", content: "IELTS Speaking evaluation.\nTopic: \"" + topic + "\"\nTranscript: \"" + answer + "\"\n\nEvaluate:\n• Fluency & Coherence: [band + 1 tip]\n• Lexical Resource: [band + 1 tip]\n• Grammar: [band + 1 tip]\n• Pronunciation: [band + comment on clarity/flow based on text]\n• Overall: [band]\n• Next step: [1 specific action]" }],
            "You are an experienced IELTS Speaking examiner. Give fair, specific, constructive feedback.");
        setSpeakFb(r); setSpeakLoading(false);
    };

    return (
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
    );
}
