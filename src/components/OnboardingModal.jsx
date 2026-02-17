import React, { useState } from 'react';
import { load, save } from '../utils/helpers';

const GOAL_OPTIONS = [
    { id: "ielts", ic: "📚", label: "IELTS Preparation" },
    { id: "health", ic: "💪", label: "Health & Fitness" },
    { id: "productivity", ic: "🚀", label: "Work Productivity" },
    { id: "habits", ic: "🔄", label: "Build New Habits" },
    { id: "study", ic: "🎓", label: "Academic Study" },
    { id: "mindfulness", ic: "🧘", label: "Mindfulness & Balance" }
];

const STATUS_OPTIONS = [
    { id: "student_hs", label: "High School Student" },
    { id: "student_uni", label: "University Student" },
    { id: "working_ft", label: "Full-time Worker" },
    { id: "working_pt", label: "Part-time Worker" },
    { id: "freelancer", label: "Freelancer" },
    { id: "gap_year", label: "Gap Year / Unemployed" }
];

const BAND_OPTIONS = ["4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];
const TARGET_BAND_OPTIONS = ["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

function calcOverall(tL, tR, tW, tS) {
    const vals = [tL, tR, tW, tS].map(Number).filter(v => !isNaN(v) && v > 0);
    if (vals.length === 0) return "7.5";
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return (Math.round(avg * 2) / 2).toFixed(1);
}

export default function OnboardingPage({ onComplete }) {
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState("forward");

    // Profile data
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [status, setStatus] = useState("");
    const [goals, setGoals] = useState([]);
    const [wakeTime, setWakeTime] = useState("07:00");
    const [sleepTime, setSleepTime] = useState("23:00");
    const [freeSlots, setFreeSlots] = useState("afternoon");
    const [currentBand, setCurrentBand] = useState("");
    const [exerciseDays, setExerciseDays] = useState("3");

    // Per-skill targets
    const [targetListening, setTargetListening] = useState("7.0");
    const [targetReading, setTargetReading] = useState("7.0");
    const [targetWriting, setTargetWriting] = useState("6.5");
    const [targetSpeaking, setTargetSpeaking] = useState("7.0");

    // Settings data
    const [apiKey, setApiKey] = useState("");

    const overallTarget = calcOverall(targetListening, targetReading, targetWriting, targetSpeaking);

    const toggleGoal = (id) => setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);

    const goForward = () => { setDirection("forward"); setStep(s => s + 1); };
    const goBack = () => { setDirection("back"); setStep(s => s - 1); };

    const finish = () => {
        const profile = {
            name, age: +age, status, goals, wakeTime, sleepTime, freeSlots,
            currentBand: currentBand || null,
            exerciseDays: +exerciseDays,
            targetListening, targetReading, targetWriting, targetSpeaking,
            createdAt: new Date().toISOString()
        };
        save("nx-profile", profile);

        const s = load("nx-settings") || {};
        if (apiKey) s.claudeKey = apiKey;
        s.ieltsTarget = overallTarget;
        s.studyHours = goals.includes("ielts") ? "4" : "2";
        s.targetSleep = sleepTime <= "22:00" ? "8" : "7";
        s.exerciseDays = exerciseDays;
        save("nx-settings", s);

        save("nx-onboarded", true);
        onComplete();
    };

    const chipStyle = (active) => ({
        padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
        border: active ? "2px solid var(--teal)" : "1px solid var(--bdr)",
        background: active ? "rgba(0,221,179,.1)" : "var(--card2)",
        color: active ? "var(--teal)" : "var(--t2)",
        transition: "all .2s"
    });

    const skillSelectStyle = { display: "flex", flexDirection: "column", gap: 4 };
    const skillLabel = { fontSize: 10, color: "var(--t3)", marginBottom: 2, fontWeight: 600 };

    const totalSteps = 5;

    const stepContent = () => {
        switch (step) {
            case 0: return (
                // Step 0: Welcome
                <div style={{ textAlign: "center" }}>
                    <div className="ob-dragon-float">🐉</div>
                    <div className="ob-brand">NEXUS</div>
                    <div className="ob-subtitle">Your AI Life Operating System</div>
                    <div className="ob-tagline">IELTS prep · Health tracking · Gamification · AI planning — all in one place.</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left", marginTop: 32 }}>
                        {[
                            { ic: "📊", t: "AI Dashboard", d: "Daily briefings & smart schedule" },
                            { ic: "📚", t: "IELTS Tracker", d: "Scores, essays, flashcards" },
                            { ic: "🐉", t: "Dragon Hatchery", d: "Gamified progression system" },
                            { ic: "🗺️", t: "World Map", d: "Quest milestones & deadlines" }
                        ].map((f, i) => (
                            <div key={i} className="ob-feature-card">
                                <div style={{ fontSize: 24 }}>{f.ic}</div>
                                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 6 }}>{f.t}</div>
                                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3 }}>{f.d}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 1: return (
                // Step 1: Identity
                <div>
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
                        <div className="ob-step-title">Who Are You?</div>
                        <div className="ob-step-desc">Help NEXUS understand your situation for smarter AI planning.</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div className="fr">
                            <label>What should we call you?</label>
                            <input className="inp ob-inp" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div className="fr">
                                <label>Age</label>
                                <input className="inp ob-inp" type="number" min={10} max={80} placeholder="25" value={age} onChange={e => setAge(e.target.value)} />
                            </div>
                            <div className="fr">
                                <label>Status</label>
                                <select className="inp ob-inp" value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="">Select...</option>
                                    {STATUS_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 2: return (
                // Step 2: Goals
                <div>
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>🎯</div>
                        <div className="ob-step-title">What brings you here?</div>
                        <div className="ob-step-desc">Select all that apply — this shapes your dashboard experience.</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                        {GOAL_OPTIONS.map(g => (
                            <button key={g.id} style={chipStyle(goals.includes(g.id))} onClick={() => toggleGoal(g.id)}>
                                <span style={{ marginRight: 8 }}>{g.ic}</span>{g.label}
                            </button>
                        ))}
                    </div>

                    {goals.includes("ielts") && (
                        <div style={{ marginTop: 8 }}>
                            {/* Current Band */}
                            <div className="fr">
                                <label>Current IELTS Band (Overall)</label>
                                <select className="inp ob-inp" value={currentBand} onChange={e => setCurrentBand(e.target.value)}>
                                    <option value="">Haven't taken</option>
                                    {BAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>

                            {/* Per-skill Targets */}
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 10, color: "var(--t2)", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
                                    Target Band Scores
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    <div style={skillSelectStyle}>
                                        <div style={skillLabel}>🎧 Listening</div>
                                        <select className="inp ob-inp" value={targetListening} onChange={e => setTargetListening(e.target.value)}>
                                            {TARGET_BAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div style={skillSelectStyle}>
                                        <div style={skillLabel}>📖 Reading</div>
                                        <select className="inp ob-inp" value={targetReading} onChange={e => setTargetReading(e.target.value)}>
                                            {TARGET_BAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div style={skillSelectStyle}>
                                        <div style={skillLabel}>✍️ Writing</div>
                                        <select className="inp ob-inp" value={targetWriting} onChange={e => setTargetWriting(e.target.value)}>
                                            {TARGET_BAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div style={skillSelectStyle}>
                                        <div style={skillLabel}>🎤 Speaking</div>
                                        <select className="inp ob-inp" value={targetSpeaking} onChange={e => setTargetSpeaking(e.target.value)}>
                                            {TARGET_BAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(0,221,179,.06)", borderRadius: 10, fontSize: 12, color: "var(--teal)", fontWeight: 700, textAlign: "center" }}>
                                    Overall Target: {overallTarget}
                                </div>
                            </div>
                        </div>
                    )}

                    {goals.includes("health") && (
                        <div className="fr" style={{ marginTop: 8 }}>
                            <label>Days/week you exercise currently?</label>
                            <div style={{ display: "flex", gap: 4 }}>
                                {["0", "1", "2", "3", "4", "5", "6", "7"].map(d => (
                                    <button key={d} className={"btn btn-sm " + (exerciseDays === d ? "btn-g" : "btn-gh")}
                                        style={{ flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 700 }}
                                        onClick={() => setExerciseDays(d)}>{d}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
            case 3: return (
                // Step 3: Lifestyle
                <div>
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>🕐</div>
                        <div className="ob-step-title">Your Daily Rhythm</div>
                        <div className="ob-step-desc">So AI won't schedule tasks while you're sleeping.</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                        <div className="fr">
                            <label>⏰ Wake Up</label>
                            <input className="inp ob-inp" type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
                        </div>
                        <div className="fr">
                            <label>🌙 Bedtime</label>
                            <input className="inp ob-inp" type="time" value={sleepTime} onChange={e => setSleepTime(e.target.value)} />
                        </div>
                    </div>
                    <div className="fr">
                        <label>When is your most productive free time?</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {[
                                { id: "morning", ic: "🌅", label: "Morning (6-12)" },
                                { id: "afternoon", ic: "☀️", label: "Afternoon (12-17)" },
                                { id: "evening", ic: "🌆", label: "Evening (17-21)" },
                                { id: "night", ic: "🌙", label: "Night (21+)" }
                            ].map(s => (
                                <button key={s.id} style={chipStyle(freeSlots === s.id)} onClick={() => setFreeSlots(s.id)}>
                                    <span style={{ marginRight: 6 }}>{s.ic}</span>{s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
            case 4: return (
                // Step 4: API Key + Summary
                <div>
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>🔑</div>
                        <div className="ob-step-title">Power Up with AI</div>
                        <div className="ob-step-desc">An API key enables daily briefings, smart scheduling, and IELTS scoring.</div>
                    </div>
                    <div className="fr" style={{ marginBottom: 20 }}>
                        <label>Claude API Key (Anthropic)</label>
                        <input className="inp ob-inp" type="password" placeholder="sk-ant-..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
                        <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 4 }}>You can change this later in Settings. The app works without it, but AI features will be disabled.</div>
                    </div>

                    {/* Profile summary card */}
                    <div className="ob-summary">
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--teal)", marginBottom: 10 }}>✨ Your NEXUS Profile</div>
                        <div className="ob-summary-grid">
                            {name && <div>👤 {name}{age ? `, ${age}` : ""}</div>}
                            {status && <div>💼 {STATUS_OPTIONS.find(s => s.id === status)?.label}</div>}
                            {goals.length > 0 && <div>🎯 {goals.map(g => GOAL_OPTIONS.find(o => o.id === g)?.label).join(", ")}</div>}
                            <div>⏰ {wakeTime} → {sleepTime}</div>
                            {goals.includes("ielts") && (
                                <>
                                    <div>📊 Current Band: {currentBand || "—"}</div>
                                    <div>🎯 Targets: L {targetListening} · R {targetReading} · W {targetWriting} · S {targetSpeaking}</div>
                                    <div>📚 Overall Target: {overallTarget}</div>
                                </>
                            )}
                            <div>🌤️ Free time: {freeSlots}</div>
                        </div>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    const animClass = direction === "forward" ? "ob-slide-right" : "ob-slide-left";

    return (
        <div className="ob-page">
            {/* Decorative background */}
            <div className="ob-bg" />

            <div className="ob-container">
                {/* Progress bar */}
                <div className="ob-progress">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div key={i} className="ob-progress-segment">
                            <div className={`ob-progress-fill${i <= step ? " active" : ""}`} />
                        </div>
                    ))}
                    <div className="ob-progress-label">Step {step + 1} of {totalSteps}</div>
                </div>

                {/* Content with slide animation */}
                <div className="ob-content">
                    <div key={step} className={animClass}>
                        {stepContent()}
                    </div>
                </div>

                {/* Navigation */}
                <div className="ob-nav">
                    {step > 0 ? (
                        <button className="btn btn-gh ob-btn" onClick={goBack}>← Back</button>
                    ) : <div />}
                    {step < totalSteps - 1 ? (
                        <button className="btn btn-g ob-btn" onClick={goForward}>Continue →</button>
                    ) : (
                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn btn-gh ob-btn" onClick={finish} style={{ flex: 1 }}>Skip Setup</button>
                            <button className="btn btn-g ob-btn ob-launch" onClick={finish} style={{ flex: 2 }}>🚀 Launch NEXUS</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
