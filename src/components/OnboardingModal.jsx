import React, { useState } from 'react';
import { load, save } from '../utils/helpers';

export default function OnboardingModal({ onComplete }) {
    const [step, setStep] = useState(0);
    const [apiKey, setApiKey] = useState("");
    const [target, setTarget] = useState("7.5");

    const finish = () => {
        if (apiKey) {
            load("nx-settings").then(s => {
                const settings = s || {};
                settings.claudeKey = apiKey;
                settings.ieltsTarget = target;
                save("nx-settings", settings);
            });
        }
        save("nx-onboarded", true);
        onComplete();
    };

    const steps = [
        // Step 0: Welcome
        <div key={0} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🐉</div>
            <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 20, color: "var(--gold)", marginBottom: 8 }}>Welcome to NEXUS</div>
            <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.8, marginBottom: 20 }}>
                Your AI Life Secretary — combining IELTS prep, health tracking, and gamification into one powerful system.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, textAlign: "left", marginBottom: 20 }}>
                {[
                    { ic: "📊", t: "AI Dashboard", d: "Daily briefings & schedule" },
                    { ic: "📚", t: "IELTS Tracker", d: "Scores, essays, flashcards" },
                    { ic: "🐉", t: "Dragon Hatchery", d: "Gamified progression" },
                    { ic: "❤️", t: "Health Monitor", d: "Sleep, steps, hydration" }
                ].map((f, i) => (
                    <div key={i} style={{ background: "var(--card2)", borderRadius: 10, padding: 12, border: "1px solid var(--bdr)" }}>
                        <div style={{ fontSize: 20 }}>{f.ic}</div>
                        <div style={{ fontWeight: 700, fontSize: 12, marginTop: 4 }}>{f.t}</div>
                        <div style={{ fontSize: 10, color: "var(--t3)" }}>{f.d}</div>
                    </div>
                ))}
            </div>
        </div>,
        // Step 1: API Key
        <div key={1}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Connect AI Provider</div>
                <div style={{ fontSize: 12, color: "var(--t2)" }}>An API key powers AI briefings, schedule generation, and IELTS scoring.</div>
            </div>
            <div className="fr">
                <label>Claude API Key (Anthropic)</label>
                <input className="inp" type="password" placeholder="sk-ant-..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
                <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 4 }}>You can change this later in Settings. The app works without it, but AI features will be disabled.</div>
            </div>
        </div>,
        // Step 2: IELTS Target
        <div key={2}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Set Your Goal</div>
                <div style={{ fontSize: 12, color: "var(--t2)" }}>What IELTS band score are you targeting?</div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                {["6.5", "7.0", "7.5", "8.0", "8.5"].map(b => (
                    <button key={b} className={"btn " + (target === b ? "btn-g" : "btn-gh")} style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700 }} onClick={() => setTarget(b)}>
                        {b}
                    </button>
                ))}
            </div>
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--t2)" }}>
                AI will tailor your study plans and analysis to reach Band {target}.
            </div>
        </div>
    ];

    return (
        <div className="mo">
            <div className="mc" style={{ maxWidth: 480 }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
                    {steps.map((_, i) => (
                        <div key={i} style={{ width: 40, height: 3, borderRadius: 3, background: i <= step ? "var(--teal)" : "var(--bdr)" }} />
                    ))}
                </div>
                {steps[step]}
                <div className="mac">
                    {step > 0 && <button className="btn btn-gh" onClick={() => setStep(s => s - 1)}>← Back</button>}
                    {step < steps.length - 1 ? (
                        <button className="btn btn-g" onClick={() => setStep(s => s + 1)}>Continue →</button>
                    ) : (
                        <button className="btn btn-g" onClick={finish}>🚀 Launch NEXUS</button>
                    )}
                </div>
            </div>
        </div>
    );
}
