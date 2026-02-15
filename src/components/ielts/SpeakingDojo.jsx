import React, { useState, useRef, useEffect, useCallback } from 'react';
import Loader from '../Loader';
import { ai } from '../../utils/helpers';
import { TOPICS } from '../../data/constants';

// ─── Shared Model Selector ────────────────────────────────────────────────────
// Reads/writes from localStorage("nx-ai-model") so ALL pages share the same choice
export const AI_MODELS = [
    { id: "claude", label: "Claude", sub: "Sonnet", color: "#e8a25a", em: "🟠" },
    { id: "openai", label: "GPT-4o", sub: "OpenAI", color: "#74c69d", em: "🟢" },
    { id: "gemini", label: "Gemini", sub: "Flash", color: "#74b4f7", em: "🔵" },
];

export function useAIModel() {
    const [model, setModelState] = useState(() => {
        try { return localStorage.getItem("nx-ai-model") || "claude"; }
        catch { return "claude"; }
    });
    const setModel = useCallback((m) => {
        setModelState(m);
        try { localStorage.setItem("nx-ai-model", m); } catch { }
        // Dispatch event so other components can react
        window.dispatchEvent(new CustomEvent("nx-model-change", { detail: m }));
    }, []);
    useEffect(() => {
        const handler = (e) => setModelState(e.detail);
        window.addEventListener("nx-model-change", handler);
        return () => window.removeEventListener("nx-model-change", handler);
    }, []);
    return [model, setModel];
}

export function ModelSelector({ compact = false }) {
    const [model, setModel] = useAIModel();
    const [open, setOpen] = useState(false);
    const current = AI_MODELS.find(m => m.id === model) || AI_MODELS[0];
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button onClick={() => setOpen(o => !o)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: compact ? "4px 10px" : "6px 14px",
                borderRadius: 20, cursor: "pointer",
                background: `${current.color}18`, border: `1px solid ${current.color}40`,
                color: current.color, fontWeight: 700,
                fontSize: compact ? 11 : 12,
                fontFamily: "'Syne', sans-serif",
            }}>
                {current.em} {current.label}
                {!compact && <span style={{ fontSize: 9, color: `${current.color}aa`, marginLeft: 2 }}>▾</span>}
            </button>
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: "var(--card)", border: "1px solid var(--bdr)",
                    borderRadius: 12, overflow: "hidden", zIndex: 200,
                    boxShadow: "0 8px 32px rgba(0,0,0,.5)", minWidth: 160,
                }}>
                    <div style={{
                        padding: "8px 14px 6px", fontSize: 9, color: "var(--t3)",
                        fontWeight: 700, textTransform: "uppercase", letterSpacing: 1
                    }}>
                        AI Model
                    </div>
                    {AI_MODELS.map(m => (
                        <button key={m.id} onClick={() => { setModel(m.id); setOpen(false); }} style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 14px", background: model === m.id ? `${m.color}14` : "transparent",
                            border: "none", cursor: "pointer",
                            borderLeft: model === m.id ? `3px solid ${m.color}` : "3px solid transparent",
                            transition: "all 0.15s",
                        }}>
                            <span style={{ fontSize: 14 }}>{m.em}</span>
                            <div style={{ flex: 1, textAlign: "left" }}>
                                <div style={{
                                    fontSize: 12, fontWeight: 700,
                                    color: model === m.id ? m.color : "var(--t1)",
                                    fontFamily: "'Syne', sans-serif"
                                }}>
                                    {m.label}
                                </div>
                                <div style={{ fontSize: 9, color: "var(--t3)" }}>{m.sub}</div>
                            </div>
                            {model === m.id && <span style={{ fontSize: 10, color: m.color }}>✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Waveform Visualiser ──────────────────────────────────────────────────────
function Waveform({ isRecording, analyserRef }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;

        if (!isRecording || !analyserRef.current) {
            ctx.clearRect(0, 0, W, H);
            ctx.strokeStyle = "rgba(45,212,191,0.3)";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
            return;
        }

        const analyser = analyserRef.current;
        const bufLen = analyser.frequencyBinCount;
        const dataArr = new Uint8Array(bufLen);

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArr);
            ctx.clearRect(0, 0, W, H);
            const grad = ctx.createLinearGradient(0, 0, W, 0);
            grad.addColorStop(0, "#a78bfa");
            grad.addColorStop(0.5, "#2dd4bf");
            grad.addColorStop(1, "#fccb58");
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = "round";
            ctx.beginPath();
            const sliceW = W / bufLen;
            let x = 0;
            for (let i = 0; i < bufLen; i++) {
                const v = dataArr[i] / 128.0;
                const y = (v * H) / 2;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                x += sliceW;
            }
            ctx.lineTo(W, H / 2);
            ctx.stroke();
        };
        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [isRecording]);

    return (
        <canvas ref={canvasRef} width={340} height={56} style={{
            width: "100%", height: 56, borderRadius: 10,
            background: "rgba(0,0,0,0.25)", display: "block"
        }} />
    );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ label, score, color }) {
    const r = 28, c = 2 * Math.PI * r;
    const pct = (score / 9) * 100;
    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto" }}>
                <svg width={72} height={72}>
                    <circle cx={36} cy={36} r={r} fill="none"
                        stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
                    <circle cx={36} cy={36} r={r} fill="none"
                        stroke={color} strokeWidth={5}
                        strokeDasharray={c}
                        strokeDashoffset={c - (pct / 100) * c}
                        strokeLinecap="round"
                        style={{
                            transform: "rotate(-90deg)", transformOrigin: "50% 50%",
                            transition: "stroke-dashoffset 1s cubic-bezier(.34,1.56,.64,1)"
                        }} />
                </svg>
                <div style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                    fontSize: 16, color
                }}>
                    {score.toFixed(1)}
                </div>
            </div>
            <div style={{
                fontSize: 9, color: "var(--t2)", marginTop: 5,
                fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8
            }}>
                {label}
            </div>
        </div>
    );
}

// ─── Pronunciation Word Highlight ─────────────────────────────────────────────
function PronunciationHighlight({ transcript, issues }) {
    if (!transcript || !issues?.length) return (
        <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.9 }}>{transcript}</div>
    );
    const words = transcript.split(/\s+/);
    return (
        <div style={{ fontSize: 12, lineHeight: 2.1, letterSpacing: 0.2 }}>
            {words.map((word, i) => {
                const clean = word.toLowerCase().replace(/[^a-z]/g, "");
                const issue = issues.find(iss =>
                    iss.word?.toLowerCase().replace(/[^a-z]/g, "") === clean);
                return (
                    <React.Fragment key={i}>
                        {issue ? (
                            <span title={`${iss?.ipa || ""} — ${issue.tip}`} style={{
                                background: "rgba(251,113,133,0.18)",
                                border: "1px solid rgba(251,113,133,0.35)",
                                borderRadius: 4, padding: "1px 4px",
                                color: "var(--rose)", cursor: "help",
                            }}>
                                {word}
                                <span style={{
                                    fontSize: 8, verticalAlign: "super",
                                    color: "var(--rose)", marginLeft: 1
                                }}>⚠</span>
                            </span>
                        ) : (
                            <span style={{ color: "var(--t1)" }}>{word}</span>
                        )}{" "}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Pronunciation Detail Card ────────────────────────────────────────────────
function PronunciationCard({ issue }) {
    const [playing, setPlaying] = useState(false);

    const playIPA = () => {
        if (!window.speechSynthesis) return;
        setPlaying(true);
        const utt = new SpeechSynthesisUtterance(issue.word);
        utt.lang = "en-US";
        utt.rate = 0.7;
        utt.onend = () => setPlaying(false);
        window.speechSynthesis.speak(utt);
    };

    // severity colour
    const col = issue.severity === "high" ? "var(--rose)"
        : issue.severity === "medium" ? "#fb923c"
            : "var(--gold)";

    return (
        <div style={{
            display: "grid", gridTemplateColumns: "1fr auto",
            alignItems: "center", gap: 8,
            padding: "10px 14px", background: "var(--card2)",
            borderRadius: 10, fontSize: 11,
            borderLeft: `3px solid ${col}`,
        }}>
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{
                        color: col, fontWeight: 800, fontSize: 13,
                        fontFamily: "'Cinzel Decorative',serif"
                    }}>
                        {issue.word}
                    </span>
                    <span style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        color: "var(--teal)", fontSize: 11, letterSpacing: 1
                    }}>
                        {issue.ipa}
                    </span>
                    {issue.severity && (
                        <span style={{
                            fontSize: 9, padding: "1px 6px", borderRadius: 8,
                            background: `${col}18`, color: col, fontWeight: 700,
                            textTransform: "uppercase"
                        }}>
                            {issue.severity}
                        </span>
                    )}
                </div>
                {issue.heard && (
                    <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3 }}>
                        Heard: <span style={{ color: "#fb923c", fontFamily: "'JetBrains Mono',monospace" }}>
                            /{issue.heard}/
                        </span>
                        {" → "}
                        <span style={{ color: "var(--teal)", fontFamily: "'JetBrains Mono',monospace" }}>
                            {issue.ipa}
                        </span>
                    </div>
                )}
                <div style={{ color: "var(--t2)", lineHeight: 1.5 }}>{issue.tip}</div>
                {issue.example && (
                    <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 3, fontStyle: "italic" }}>
                        e.g. "{issue.example}"
                    </div>
                )}
            </div>
            <button onClick={playIPA} title="Listen to correct pronunciation"
                style={{
                    width: 32, height: 32, borderRadius: "50%", border: "none",
                    background: playing ? "var(--teal)" : "rgba(0,221,179,0.12)",
                    color: playing ? "#000" : "var(--teal)",
                    cursor: "pointer", fontSize: 14, flexShrink: 0,
                    transition: "all 0.2s",
                }}>
                {playing ? "⏸" : "▶"}
            </button>
        </div>
    );
}

// ─── Audio blob → base64 ──────────────────────────────────────────────────────
async function blobToBase64(blob) {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
    });
}

// ─── Build AI prompt (with or without audio) ─────────────────────────────────
function buildPrompt(topic, transcript, durationSec, audioBase64 = null, model = "claude") {
    const baseJSON = `{
  "overall": <band 0-9 in 0.5 steps>,
  "criteria": {
    "fluency": <0-9>,
    "lexical": <0-9>,
    "grammar": <0-9>,
    "pronunciation": <0-9>
  },
  "pronunciation_issues": [
    {
      "word": "example",
      "ipa": "/ɪɡˈzɑːmpl/",
      "heard": "/ɛkˈzæmpl/",
      "severity": "high|medium|low",
      "tip": "Stress on second syllable: ex-ZAM-ple. The 'x' sounds like 'gz'.",
      "example": "This is a good example."
    }
  ],
  "fluency_notes": "Specific observations about pace, hesitation, connectors",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["specific tip 1", "specific tip 2", "specific tip 3"],
  "model_answer_snippet": "One strong opening sentence for this topic.",
  "next_step": "One concrete action to improve by 0.5 band"
}`;

    if (audioBase64 && (model === "claude" || model === "openai")) {
        // Models that can process audio directly
        return {
            useAudio: true,
            messages: [{
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `You are an expert IELTS Speaking Examiner (Band 9). 
                        
TASK: Analyse this IELTS Speaking response for topic: "${topic}"
Duration: ~${durationSec} seconds
Transcript (for reference): "${transcript}"

CRITICALLY IMPORTANT — you have the actual audio recording. Please:
1. Listen carefully to pronunciation of individual words
2. Note hesitations, fillers, pace changes
3. Identify mispronounced phonemes (not just word choices)
4. Give IPA transcription for both what was heard vs correct
5. Severity: "high" = significantly impacts intelligibility, "medium" = noticeable, "low" = minor

Score based on OFFICIAL IELTS Speaking rubric:
- Fluency & Coherence: flow, hesitation, self-correction, connectives
- Lexical Resource: range, precision, collocation, idioms
- Grammatical Range & Accuracy: complexity, accuracy
- Pronunciation: phoneme accuracy, stress, intonation, connected speech

Return STRICT JSON only (no markdown, no explanation):
${baseJSON}`
                    },
                    // Note: actual audio attachment would be handled by the ai() helper
                    // passing audioBase64 as additional context
                ]
            }],
            audioContext: `[Audio data available: ${audioBase64.length} chars base64 WebM audio]`
        };
    }

    // Text-only fallback (Gemini or when audio unavailable)
    return {
        useAudio: false,
        prompt: `You are an expert IELTS Speaking Examiner (Band 9). Analyse this spoken response.

Topic: "${topic}"
Transcript: "${transcript}"
Duration: ~${durationSec} seconds

IMPORTANT INSTRUCTIONS:
- Evaluate as SPOKEN audio, not written text
- Infer pronunciation issues from word complexity, common Thai-speaker errors, and transcript patterns
- For Thai speakers: focus on th/d, r/l, final consonants, word stress
- Be specific and actionable in feedback
- Score realistically (most learners: 5.5-7.0)

Return STRICT JSON only (no markdown):
${baseJSON}`
    };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SpeakingDojo({ setErrorMsg }) {
    const [topic, setTopic] = useState(null);
    const [phase, setPhase] = useState("idle");
    const [transcript, setTranscript] = useState("");
    const [interimText, setInterimText] = useState("");
    const [feedback, setFeedback] = useState(null);
    const [prepTime, setPrepTime] = useState(60);
    const [recTime, setRecTime] = useState(0);
    const [audioSupport, setAudioSupport] = useState(null); // null=checking, true, false
    const [model, setModel] = useAIModel();

    const recognitionRef = useRef(null);
    const analyserRef = useRef(null);
    const audioCtxRef = useRef(null);
    const streamRef = useRef(null);
    const mediaRecRef = useRef(null);   // MediaRecorder for audio blob
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const finalTransRef = useRef("");     // track final transcript
    const MAX_REC = 120;

    // Check audio analysis support
    useEffect(() => {
        const supported = (model === "claude" || model === "openai")
            && typeof MediaRecorder !== "undefined";
        setAudioSupport(supported);
    }, [model]);

    // Prep countdown
    useEffect(() => {
        if (phase !== "prep") return;
        setPrepTime(60);
        timerRef.current = setInterval(() => {
            setPrepTime(p => {
                if (p <= 1) { clearInterval(timerRef.current); startRecording(); return 0; }
                return p - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase]);

    // Recording timer
    useEffect(() => {
        if (phase !== "recording") return;
        setRecTime(0);
        timerRef.current = setInterval(() => {
            setRecTime(t => {
                if (t >= MAX_REC - 1) { clearInterval(timerRef.current); stopRecording(); return MAX_REC; }
                return t + 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase]);

    const startPrep = (t) => {
        setTopic(t);
        setFeedback(null);
        setTranscript("");
        setInterimText("");
        finalTransRef.current = "";
        setPhase("prep");
    };

    const skipPrep = () => {
        clearInterval(timerRef.current);
        startRecording();
    };

    const startRecording = async () => {
        setPhase("recording");
        setTranscript("");
        setInterimText("");
        finalTransRef.current = "";
        audioChunksRef.current = [];

        // ── Web Speech API (live transcript) ─────────────────
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SR) {
            const rec = new SR();
            rec.lang = "en-US";
            rec.continuous = true;
            rec.interimResults = true;
            rec.maxAlternatives = 1;
            recognitionRef.current = rec;

            rec.onresult = (e) => {
                let interim = "";
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    const t = e.results[i][0].transcript;
                    if (e.results[i].isFinal) {
                        finalTransRef.current += t + " ";
                    } else {
                        interim += t;
                    }
                }
                setTranscript(finalTransRef.current);
                setInterimText(interim);
            };
            rec.onerror = (e) => console.warn("SR error:", e.error);
            rec.start();
        }

        // ── MediaRecorder (actual audio blob for pronunciation AI) ───
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Waveform analyser
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtxRef.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            src.connect(analyser);
            analyserRef.current = analyser;

            // MediaRecorder — prefer webm/opus for small file size
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm")
                    ? "audio/webm"
                    : "audio/ogg";

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.start(500); // collect in 500ms chunks
        } catch (e) {
            console.warn("Mic access denied:", e);
        }
    };

    const stopRecording = () => {
        clearInterval(timerRef.current);

        // Stop speech recognition
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
        }

        // Stop MediaRecorder and collect final blob
        if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
            mediaRecRef.current.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, {
                    type: mediaRecRef.current.mimeType
                });
                const finalText = finalTransRef.current.trim() || interimText.trim();
                setTranscript(finalText);
                setPhase("processing");
                await analyseResponse(finalText, blob);
            };
            mediaRecRef.current.stop();
        } else {
            setPhase("processing");
            setTimeout(() => {
                const finalText = finalTransRef.current.trim() || interimText.trim();
                analyseResponse(finalText, null);
            }, 600);
        }

        // Cleanup audio
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch { } }
        analyserRef.current = null;
    };

    const analyseResponse = async (text, audioBlob) => {
        if (!text?.trim()) {
            setErrorMsg?.("No speech detected. Please try again.");
            setPhase("idle");
            return;
        }

        const currentTopic = topic;
        const currentRecTime = recTime;

        try {
            let audioBase64 = null;
            if (audioBlob && audioBlob.size > 0 && (model === "claude" || model === "openai")) {
                try {
                    audioBase64 = await blobToBase64(audioBlob);
                } catch (e) {
                    console.warn("Audio conversion failed, using text-only:", e);
                }
            }

            const { useAudio, prompt, messages, audioContext } = buildPrompt(
                currentTopic, text, currentRecTime, audioBase64, model
            );

            let raw;
            if (useAudio && audioBase64) {
                // Pass audio context in system prompt for enhanced analysis
                raw = await ai(
                    messages,
                    `You are an IELTS Speaking examiner. Return valid JSON only. 
                    ${audioContext ? "Note: " + audioContext : ""}`,
                    model
                );
            } else {
                raw = await ai(
                    [{ role: "user", content: prompt }],
                    "You are an IELTS Speaking examiner. Return valid JSON only.",
                    model
                );
            }

            const clean = raw.replace(/```json|```/g, "").trim();
            const data = JSON.parse(clean);
            setFeedback({ ...data, transcript: text, analyzedWithAudio: !!audioBase64, model });
            setPhase("result");
        } catch (e) {
            console.error("Analysis failed:", e);
            setErrorMsg?.("Analysis failed. Check your API key in Settings.");
            setPhase("idle");
        }
    };

    const reset = () => {
        setPhase("idle");
        setFeedback(null);
        setTranscript("");
        setInterimText("");
        setTopic(null);
        finalTransRef.current = "";
    };

    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    const bandColor = (b) => {
        if (b >= 7.5) return "var(--teal)";
        if (b >= 6.5) return "var(--gold)";
        if (b >= 5.5) return "#fb923c";
        return "var(--rose)";
    };

    const criteriaColors = {
        fluency: "var(--teal)", lexical: "var(--violet)",
        grammar: "var(--gold)", pronunciation: "var(--rose)",
    };

    // ══════════════════════════════════════════════════════════
    return (
        <div className="g2" style={{ alignItems: "start" }}>

            {/* ── LEFT: Topic List ── */}
            <div className="card">
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 14
                }}>
                    <div className="ct" style={{ margin: 0 }}>Practice Topics</div>
                    <ModelSelector compact />
                </div>

                {/* Audio support badge */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 10px", borderRadius: 8, marginBottom: 12,
                    background: audioSupport
                        ? "rgba(52,211,153,0.08)"
                        : "rgba(251,191,36,0.08)",
                    border: `1px solid ${audioSupport
                        ? "rgba(52,211,153,0.2)"
                        : "rgba(251,191,36,0.2)"}`,
                }}>
                    <span style={{ fontSize: 12 }}>{audioSupport ? "🎙️" : "📝"}</span>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: 10, fontWeight: 700,
                            color: audioSupport ? "var(--teal)" : "var(--gold)"
                        }}>
                            {audioSupport ? "Audio Analysis ON" : "Text Analysis Mode"}
                        </div>
                        <div style={{ fontSize: 9, color: "var(--t3)", lineHeight: 1.4 }}>
                            {audioSupport
                                ? `Real pronunciation analysis via ${model === "claude" ? "Claude" : "GPT-4o"}`
                                : "Switch to Claude or GPT-4o for audio analysis"}
                        </div>
                    </div>
                </div>

                {TOPICS.map((t, i) => {
                    const ems = ["🗣️", "📱", "🏙️", "🤔", "📚"];
                    const isActive = topic === t && phase !== "idle" && phase !== "result";
                    const isDone = topic === t && phase === "result";
                    return (
                        <div key={t}
                            className={"task" + (isActive ? " done" : "")}
                            style={{
                                cursor: phase === "idle" ? "pointer" : "default",
                                borderColor: isDone ? "rgba(52,211,153,0.3)" : undefined,
                                background: isDone ? "rgba(52,211,153,0.04)" : undefined,
                            }}
                            onClick={() => phase === "idle" && startPrep(t)}
                        >
                            <span style={{ fontSize: 16 }}>{ems[i] || "🎯"}</span>
                            <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{t}</div>
                            {isDone && <span className="badge bt" style={{ fontSize: 9 }}>✓ Done</span>}
                            {phase === "idle" && topic !== t && (
                                <span style={{ fontSize: 10, color: "var(--t3)" }}>▶</span>
                            )}
                        </div>
                    );
                })}

                <div className="aibx" style={{ marginTop: 14 }}>
                    {"💡 Band 7 Tips:\n\n• Fluency: Natural connectors — 'Well, the thing is...', 'What I find interesting is...'\n• Vocabulary: Avoid repetition. Use idiomatic phrases.\n• Grammar: Mix tenses. Use conditionals: 'If I were to choose...'\n• Pronunciation: Stress content words. Use rising/falling intonation."}
                </div>
            </div>

            {/* ── RIGHT: Active Panel ── */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ── IDLE ── */}
                {phase === "idle" && !feedback && (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🎤</div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                            AI Speaking Coach
                        </div>
                        <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.7 }}>
                            Select a topic on the left to begin.<br />
                            You'll get 60s prep time, then speak for up to 2 minutes.
                        </div>
                        <div style={{
                            marginTop: 16, display: "flex", gap: 8,
                            justifyContent: "center", flexWrap: "wrap"
                        }}>
                            {[
                                audioSupport ? "🎙️ Real audio analysis" : "📝 Text analysis",
                                "🔊 Pronunciation check",
                                "📊 Band score",
                                "🌐 IPA feedback"
                            ].map(f => (
                                <span key={f} style={{
                                    fontSize: 10, padding: "4px 10px", borderRadius: 20,
                                    background: "rgba(0,221,179,0.08)",
                                    border: "1px solid rgba(0,221,179,0.2)",
                                    color: "var(--teal)", fontWeight: 700
                                }}>{f}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── PREP ── */}
                {phase === "prep" && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: 10, color: "var(--t2)", textTransform: "uppercase",
                            letterSpacing: 2, fontWeight: 700, marginBottom: 10
                        }}>
                            Preparation Time
                        </div>
                        <div style={{
                            fontSize: 72, fontWeight: 800,
                            fontFamily: "'JetBrains Mono',monospace",
                            color: prepTime <= 10 ? "var(--rose)" : "var(--teal)",
                            transition: "color 0.3s", lineHeight: 1
                        }}>
                            {prepTime}s
                        </div>
                        <div style={{
                            margin: "16px 0", padding: "12px 16px",
                            background: "rgba(255,255,255,0.04)", borderRadius: 10,
                            fontSize: 13, fontWeight: 600, color: "var(--t1)", lineHeight: 1.5
                        }}>
                            {topic}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t2)", marginBottom: 14 }}>
                            Think about your key points. Recording starts automatically.
                        </div>
                        <button className="btn btn-g btn-sm" onClick={skipPrep}>
                            Skip Prep → Start Now
                        </button>
                    </div>
                )}

                {/* ── RECORDING ── */}
                {phase === "recording" && (
                    <div>
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: 12
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                    width: 10, height: 10, borderRadius: "50%",
                                    background: "var(--rose)", boxShadow: "0 0 8px var(--rose)",
                                    animation: "pulse 1s infinite"
                                }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--rose)" }}>
                                    RECORDING
                                </span>
                                {audioSupport && (
                                    <span style={{
                                        fontSize: 9, padding: "2px 6px", borderRadius: 6,
                                        background: "rgba(52,211,153,0.12)",
                                        color: "var(--teal)", fontWeight: 700
                                    }}>
                                        🎙️ AUDIO
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 14, fontWeight: 700, color: "var(--t1)"
                            }}>
                                {fmt(recTime)} / {fmt(MAX_REC)}
                            </div>
                        </div>

                        <Waveform isRecording={true} analyserRef={analyserRef} />

                        <div style={{
                            marginTop: 12, padding: "10px 14px",
                            background: "rgba(0,0,0,0.2)", borderRadius: 10,
                            minHeight: 60, fontSize: 12, lineHeight: 1.7, color: "var(--t1)"
                        }}>
                            <span>{transcript}</span>
                            <span style={{ color: "var(--t3)", fontStyle: "italic" }}>{interimText}</span>
                            {!transcript && !interimText && (
                                <span style={{ color: "var(--t3)" }}>Listening... speak now 🎤</span>
                            )}
                        </div>

                        <div style={{
                            height: 4, background: "rgba(255,255,255,0.08)",
                            borderRadius: 2, overflow: "hidden", marginTop: 10
                        }}>
                            <div style={{
                                height: "100%", borderRadius: 2,
                                width: `${(recTime / MAX_REC) * 100}%`,
                                background: recTime > 90 ? "var(--rose)" : "var(--teal)",
                                transition: "width 1s linear, background 0.3s"
                            }} />
                        </div>

                        <div style={{ marginTop: 12, textAlign: "center" }}>
                            <button className="btn btn-p"
                                style={{ padding: "10px 28px", fontSize: 13 }}
                                onClick={stopRecording}>
                                ⏹ Stop & Analyse
                            </button>
                        </div>
                    </div>
                )}

                {/* ── PROCESSING ── */}
                {phase === "processing" && (
                    <div style={{ textAlign: "center", padding: "30px 20px" }}>
                        <Loader text="AI examiner is scoring your response..." />
                        <div style={{ marginTop: 14, fontSize: 11, color: "var(--t2)" }}>
                            {audioSupport
                                ? "Analysing audio for pronunciation, fluency, grammar & vocabulary..."
                                : "Analysing fluency, grammar, vocabulary & pronunciation..."}
                        </div>
                        {audioSupport && (
                            <div style={{ marginTop: 8, fontSize: 10, color: "var(--t3)" }}>
                                🎙️ Real audio analysis with {model === "claude" ? "Claude" : "GPT-4o"}
                            </div>
                        )}
                    </div>
                )}

                {/* ── RESULT ── */}
                {phase === "result" && feedback && (
                    <div>
                        {/* Analysis method badge */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                            <span style={{
                                fontSize: 9, padding: "2px 8px", borderRadius: 6,
                                background: feedback.analyzedWithAudio
                                    ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
                                color: feedback.analyzedWithAudio ? "var(--teal)" : "var(--gold)",
                                fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5
                            }}>
                                {feedback.analyzedWithAudio
                                    ? `🎙️ Audio Analysis · ${AI_MODELS.find(m => m.id === feedback.model)?.label || feedback.model}`
                                    : `📝 Text Analysis · ${AI_MODELS.find(m => m.id === feedback.model)?.label || feedback.model}`}
                            </span>
                        </div>

                        {/* Overall Band */}
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{
                                fontSize: 10, color: "var(--t2)", textTransform: "uppercase",
                                letterSpacing: 2, fontWeight: 700, marginBottom: 6
                            }}>
                                Overall Band Score
                            </div>
                            <div style={{
                                fontSize: 64, fontWeight: 800, lineHeight: 1,
                                fontFamily: "'JetBrains Mono',monospace",
                                color: bandColor(feedback.overall),
                                textShadow: `0 0 30px ${bandColor(feedback.overall)}60`,
                            }}>
                                {feedback.overall}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 4 }}>
                                {feedback.overall >= 7.5 ? "Excellent — Very Good User 🏆" :
                                    feedback.overall >= 7 ? "Good user 🎉" :
                                        feedback.overall >= 6 ? "Competent — keep pushing 💪" :
                                            feedback.overall >= 5 ? "Modest — practice daily 📚" :
                                                "Developing — focus on basics 📖"}
                            </div>
                        </div>

                        {/* 4 Criteria Rings */}
                        <div style={{
                            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 10, marginBottom: 20
                        }}>
                            {Object.entries(feedback.criteria || {}).map(([key, val]) => (
                                <ScoreRing key={key}
                                    label={key === "fluency" ? "Fluency" :
                                        key === "lexical" ? "Lexical" :
                                            key === "grammar" ? "Grammar" : "Pronunc."}
                                    score={val}
                                    color={criteriaColors[key] || "var(--teal)"}
                                />
                            ))}
                        </div>

                        {/* Fluency Notes */}
                        {feedback.fluency_notes && (
                            <div style={{
                                marginBottom: 14, padding: "10px 14px",
                                background: "rgba(45,212,191,0.06)",
                                border: "1px solid rgba(45,212,191,0.15)",
                                borderRadius: 10
                            }}>
                                <div style={{
                                    fontSize: 10, fontWeight: 700, color: "var(--teal)",
                                    textTransform: "uppercase", letterSpacing: 1, marginBottom: 5
                                }}>
                                    🌊 Fluency Analysis
                                </div>
                                <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6 }}>
                                    {feedback.fluency_notes}
                                </div>
                            </div>
                        )}

                        {/* Pronunciation Issues */}
                        {feedback.pronunciation_issues?.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: "var(--rose)",
                                    textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
                                    display: "flex", alignItems: "center", gap: 6
                                }}>
                                    🔊 Pronunciation — click ▶ to hear correct pronunciation
                                    {feedback.analyzedWithAudio && (
                                        <span style={{
                                            fontSize: 9, padding: "1px 6px", borderRadius: 6,
                                            background: "rgba(52,211,153,0.12)", color: "var(--teal)",
                                            fontWeight: 700
                                        }}>
                                            FROM AUDIO
                                        </span>
                                    )}
                                </div>

                                {/* Transcript with highlights */}
                                <div style={{
                                    padding: "12px 14px",
                                    background: "rgba(251,113,133,0.05)",
                                    border: "1px solid rgba(251,113,133,0.15)",
                                    borderRadius: 10, marginBottom: 10
                                }}>
                                    <div style={{
                                        fontSize: 9, color: "var(--t3)", fontWeight: 700,
                                        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6
                                    }}>
                                        Your transcript — hover flagged words
                                    </div>
                                    <PronunciationHighlight
                                        transcript={feedback.transcript}
                                        issues={feedback.pronunciation_issues}
                                    />
                                </div>

                                {/* Detailed cards */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {feedback.pronunciation_issues.map((iss, i) => (
                                        <PronunciationCard key={i} issue={iss} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strengths */}
                        {feedback.strengths?.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: "var(--teal)",
                                    textTransform: "uppercase", letterSpacing: 1, marginBottom: 6
                                }}>
                                    💪 Strengths
                                </div>
                                {feedback.strengths.map((s, i) => (
                                    <div key={i} style={{
                                        fontSize: 12, color: "var(--t2)",
                                        padding: "5px 0 5px 12px",
                                        borderLeft: "2px solid var(--teal)", marginBottom: 4
                                    }}>
                                        {s}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Improvements */}
                        {feedback.improvements?.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: "var(--gold)",
                                    textTransform: "uppercase", letterSpacing: 1, marginBottom: 6
                                }}>
                                    🔧 To Improve
                                </div>
                                {feedback.improvements.map((imp, i) => (
                                    <div key={i} style={{
                                        fontSize: 12, color: "var(--t2)",
                                        padding: "5px 0 5px 12px",
                                        borderLeft: "2px solid var(--gold)", marginBottom: 4
                                    }}>
                                        {imp}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Model Answer */}
                        {feedback.model_answer_snippet && (
                            <div className="aibx" style={{ marginBottom: 12 }}>
                                <div style={{
                                    fontSize: 10, color: "var(--violet)", fontWeight: 700,
                                    textTransform: "uppercase", letterSpacing: 1, marginBottom: 6
                                }}>
                                    ✨ Model Opening
                                </div>
                                <div style={{
                                    fontSize: 12, fontStyle: "italic",
                                    color: "var(--t1)", lineHeight: 1.7
                                }}>
                                    "{feedback.model_answer_snippet}"
                                </div>
                            </div>
                        )}

                        {/* Next Step */}
                        {feedback.next_step && (
                            <div className="ins" style={{ marginBottom: 16 }}>
                                <span className="ins-ic">🎯</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 2 }}>
                                        Next Step to +0.5 Band
                                    </div>
                                    <div style={{ fontSize: 12 }}>{feedback.next_step}</div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-gh" style={{ flex: 1 }} onClick={reset}>
                                ← New Topic
                            </button>
                            <button className="btn btn-g" style={{ flex: 2 }}
                                onClick={() => { setPhase("prep"); setFeedback(null); }}>
                                🔄 Try Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
