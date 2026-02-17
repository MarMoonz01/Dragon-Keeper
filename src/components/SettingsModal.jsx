import React, { useState, useEffect } from 'react';
import { load, save } from '../utils/helpers';
import { useSettings } from '../context/SettingsContext';

const STATUS_OPTIONS = [
    { id: "student_hs", label: "High School Student" },
    { id: "student_uni", label: "University Student" },
    { id: "working_ft", label: "Full-time Worker" },
    { id: "working_pt", label: "Part-time Worker" },
    { id: "freelancer", label: "Freelancer" },
    { id: "gap_year", label: "Gap Year / Unemployed" }
];

const TARGET_BAND_OPTIONS = ["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

export default function SettingsModal() {
    const { showSettings, setShowSettings: onClose, resetGame: onReset } = useSettings();
    const [provider, setProvider] = useState("claude");
    const [keys, setKeys] = useState({ claudeKey: "", openaiKey: "", geminiKey: "", supabaseUrl: "", supabaseKey: "" });
    const [goals, setGoals] = useState({ ieltsTarget: "7.5", studyHours: "3", targetSleep: "8", exerciseDays: "5" });
    const [initialSupabase, setInitialSupabase] = useState({ url: "", key: "" });
    const [profile, setProfile] = useState({ name: "", age: "", status: "", wakeTime: "07:00", sleepTime: "23:00", freeSlots: "afternoon", currentBand: "", exerciseDays: "3", targetListening: "7.0", targetReading: "7.0", targetWriting: "6.5", targetSpeaking: "7.0" });
    const [profileOpen, setProfileOpen] = useState(true);

    useEffect(() => {
        const s = load("nx-settings");
        const storedModel = localStorage.getItem("nx-ai-model");
        if (s) {
            setProvider(storedModel || s.provider || "claude");
            const k = {
                claudeKey: s.claudeKey || "",
                openaiKey: s.openaiKey || "",
                geminiKey: s.geminiKey || "",
                supabaseUrl: s.supabaseUrl || "",
                supabaseKey: s.supabaseKey || ""
            };
            setKeys(k);
            setInitialSupabase({ url: k.supabaseUrl, key: k.supabaseKey });
            setGoals({
                ieltsTarget: s.ieltsTarget || "7.5",
                studyHours: s.studyHours || "3",
                targetSleep: s.targetSleep || "8",
                exerciseDays: s.exerciseDays || "5"
            });
        }
        const p = load("nx-profile");
        if (p) {
            setProfile({
                name: p.name || "",
                age: p.age ? String(p.age) : "",
                status: p.status || "",
                wakeTime: p.wakeTime || "07:00",
                sleepTime: p.sleepTime || "23:00",
                freeSlots: p.freeSlots || "afternoon",
                currentBand: p.currentBand || "",
                exerciseDays: p.exerciseDays ? String(p.exerciseDays) : "3",
                targetListening: p.targetListening || "7.0",
                targetReading: p.targetReading || "7.0",
                targetWriting: p.targetWriting || "6.5",
                targetSpeaking: p.targetSpeaking || "7.0"
            });
        }
    }, []);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!showSettings) return null;

    const handleSave = () => {
        // Calculate overall target from per-skill targets
        const vals = [profile.targetListening, profile.targetReading, profile.targetWriting, profile.targetSpeaking].map(Number).filter(v => !isNaN(v) && v > 0);
        const overallTarget = vals.length > 0 ? (Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2).toFixed(1) : goals.ieltsTarget;

        save("nx-settings", { provider, ...keys, ...goals, ieltsTarget: overallTarget });
        const existing = load("nx-profile") || {};
        save("nx-profile", {
            ...existing, ...profile,
            age: +profile.age || existing.age,
            exerciseDays: +profile.exerciseDays || existing.exerciseDays
        });
        try { localStorage.setItem("nx-ai-model", provider); } catch { } // Sync with SpeakingDojo
        window.dispatchEvent(new CustomEvent("nx-model-change", { detail: provider })); // Notify listeners
        const supabaseChanged = keys.supabaseUrl !== initialSupabase.url || keys.supabaseKey !== initialSupabase.key;
        if (supabaseChanged) {
            window.location.reload();
        } else {
            onClose();
        }
    };

    return (
        <div className="mo">
            <div className="mc" role="dialog" aria-modal="true" aria-label="System settings">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div className="mc-t" style={{ margin: 0 }}>⚙️ System Settings</div>
                    <button className="btn btn-gh btn-sm" onClick={onClose}>✕</button>
                </div>

                <div className="fr">
                    <label>AI Provider</label>
                    <div style={{ fontSize: 10, color: "var(--t2)", marginBottom: 6 }}>
                        Select which AI model to use for generating content.
                    </div>
                    <select className="inp" value={provider} onChange={e => setProvider(e.target.value)}>
                        <option value="claude">Anthropic (Claude Sonnet 4.5)</option>
                        <option value="openai">OpenAI (GPT-4o)</option>
                        <option value="gemini">Google (Gemini 3 Flash)</option>
                    </select>
                </div>

                <div className="fr">
                    <label>API Configuration</label>
                    {/* Security notice */}
                    <div style={{ background: "rgba(255,94,135,.08)", border: "1px solid rgba(255,94,135,.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 10, color: "var(--rose)", display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                        <span><strong>Security:</strong> API keys are stored in your browser's localStorage and visible in DevTools. This is acceptable for personal/local use only. For production, use a backend proxy.</span>
                    </div>

                    {provider === "claude" && (
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--t2)" }}>Claude API Key</div>
                            <input className="inp" type="password" placeholder="sk-ant-..." value={keys.claudeKey}
                                onChange={e => setKeys({ ...keys, claudeKey: e.target.value })} />
                        </div>
                    )}
                    {provider === "openai" && (
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--t2)" }}>OpenAI API Key</div>
                            <input className="inp" type="password" placeholder="sk-..." value={keys.openaiKey}
                                onChange={e => setKeys({ ...keys, openaiKey: e.target.value })} />
                        </div>
                    )}
                    {provider === "gemini" && (
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--t2)" }}>Gemini API Key</div>
                            <input className="inp" type="password" placeholder="AIzaSy..." value={keys.geminiKey}
                                onChange={e => setKeys({ ...keys, geminiKey: e.target.value })} />
                        </div>
                    )}

                    <div style={{ borderTop: "1px solid var(--bdr)", margin: "12px 0", paddingTop: 12 }}>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--t2)" }}>Supabase (Optional)</label>
                        <input className="inp" placeholder="Supabase URL (https://...)" value={keys.supabaseUrl || ""} onChange={e => setKeys({ ...keys, supabaseUrl: e.target.value })} style={{ marginBottom: 8 }} />
                        <input className="inp" placeholder="Supabase Anon Key" type="password" value={keys.supabaseKey || ""} onChange={e => setKeys({ ...keys, supabaseKey: e.target.value })} />
                    </div>
                </div>

                {/* Collapsible Profile */}
                <div className="fr">
                    <label
                        onClick={() => setProfileOpen(p => !p)}
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, userSelect: "none" }}
                    >
                        <span style={{ fontSize: 10, transition: "transform .2s", transform: profileOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>▸</span>
                        Profile
                    </label>
                    <div style={{
                        maxHeight: profileOpen ? 600 : 0,
                        overflow: "hidden",
                        transition: "max-height .35s ease",
                    }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 4 }}>
                            <div>
                                <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>👤 Name</div>
                                <input className="inp" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>🎂 Age</div>
                                <input className="inp" type="number" min={10} max={99} value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>💼 Status</div>
                                <select className="inp" value={profile.status} onChange={e => setProfile({ ...profile, status: e.target.value })}>
                                    <option value="">Select...</option>
                                    {STATUS_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>📊 Current Band</div>
                                <select className="inp" value={profile.currentBand} onChange={e => setProfile({ ...profile, currentBand: e.target.value })}>
                                    <option value="">Not tested</option>
                                    {["4.0","4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0"].map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>⏰ Wake Time</div>
                                <input className="inp" type="time" value={profile.wakeTime} onChange={e => setProfile({ ...profile, wakeTime: e.target.value })} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>🌙 Sleep Time</div>
                                <input className="inp" type="time" value={profile.sleepTime} onChange={e => setProfile({ ...profile, sleepTime: e.target.value })} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>📅 Free Slots</div>
                                <select className="inp" value={profile.freeSlots} onChange={e => setProfile({ ...profile, freeSlots: e.target.value })}>
                                    <option value="morning">Morning</option>
                                    <option value="afternoon">Afternoon</option>
                                    <option value="evening">Evening</option>
                                    <option value="flexible">Flexible</option>
                                </select>
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>🏃 Exercise Days/Wk</div>
                                <input className="inp" type="number" min={0} max={7} value={profile.exerciseDays} onChange={e => setProfile({ ...profile, exerciseDays: e.target.value })} />
                            </div>
                        </div>

                        {/* Per-skill IELTS targets */}
                        <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--card2)", borderRadius: 10, border: "1px solid var(--bdr)" }}>
                            <div style={{ fontSize: 10, color: "var(--t2)", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
                                IELTS Target Bands
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <div>
                                    <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>🎧 Listening</div>
                                    <select className="inp" value={profile.targetListening} onChange={e => setProfile({ ...profile, targetListening: e.target.value })}>
                                        {TARGET_BAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>📖 Reading</div>
                                    <select className="inp" value={profile.targetReading} onChange={e => setProfile({ ...profile, targetReading: e.target.value })}>
                                        {TARGET_BAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>✍️ Writing</div>
                                    <select className="inp" value={profile.targetWriting} onChange={e => setProfile({ ...profile, targetWriting: e.target.value })}>
                                        {TARGET_BAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>🎤 Speaking</div>
                                    <select className="inp" value={profile.targetSpeaking} onChange={e => setProfile({ ...profile, targetSpeaking: e.target.value })}>
                                        {TARGET_BAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: 6, fontSize: 11, color: "var(--teal)", fontWeight: 700, textAlign: "center" }}>
                                Overall: {(() => {
                                    const vals = [profile.targetListening, profile.targetReading, profile.targetWriting, profile.targetSpeaking].map(Number).filter(v => !isNaN(v) && v > 0);
                                    return vals.length > 0 ? (Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2).toFixed(1) : "—";
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Goals */}
                <div className="fr">
                    <label>Goals & Targets</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                            <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>📚 Study Hours/Day</div>
                            <input className="inp" type="number" min={1} max={12} value={goals.studyHours} onChange={e => setGoals({ ...goals, studyHours: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>💤 Target Sleep (hrs)</div>
                            <input className="inp" type="number" min={5} max={12} step={0.5} value={goals.targetSleep} onChange={e => setGoals({ ...goals, targetSleep: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>🏃 Exercise Days/Week</div>
                            <input className="inp" type="number" min={0} max={7} value={goals.exerciseDays} onChange={e => setGoals({ ...goals, exerciseDays: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="mac">
                    <button className="btn btn-g" onClick={handleSave}>Save Configuration</button>
                </div>

                {onReset && (
                    <div style={{ marginTop: 24, borderTop: "1px solid var(--bdr)", paddingTop: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--rose)", marginBottom: 8 }}>Danger Zone</div>
                        <div style={{ fontSize: 11, color: "var(--t2)", marginBottom: 12 }}>
                            This action cannot be undone. All progress, scores, and logs will be permanently deleted.
                        </div>
                        <button className="btn btn-sm"
                            style={{ background: "rgba(255,94,135,.1)", color: "var(--rose)", border: "1px solid var(--rose)", padding: "8px 16px" }}
                            onClick={() => {
                                if (window.confirm("Are you absolutely sure?\nThis will WIPE ALL DATA.")) {
                                    if (window.confirm("Really? Last chance to cancel.")) {
                                        onReset();
                                    }
                                }
                            }}>
                            💣 Reset Game (Wipe All Data)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
