import React, { useState, useEffect } from 'react';
import { load, save } from '../utils/helpers';

export default function SettingsModal({ onClose, onReset }) {
    const [provider, setProvider] = useState("claude");
    const [keys, setKeys] = useState({ claudeKey: "", openaiKey: "", geminiKey: "", supabaseUrl: "", supabaseKey: "" });
    const [goals, setGoals] = useState({ ieltsTarget: "7.5", studyHours: "3", targetSleep: "8", exerciseDays: "5" });
    const [initialSupabase, setInitialSupabase] = useState({ url: "", key: "" });

    useEffect(() => {
        const s = load("nx-settings");
        if (s) {
            setProvider(s.provider || "claude");
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
    }, []);

    const handleSave = () => {
        save("nx-settings", { provider, ...keys, ...goals });
        const supabaseChanged = keys.supabaseUrl !== initialSupabase.url || keys.supabaseKey !== initialSupabase.key;
        if (supabaseChanged) {
            window.location.reload();
        } else {
            onClose();
        }
    };

    return (
        <div className="mo">
            <div className="mc">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div className="mc-t" style={{ margin: 0 }}>⚙️ System Settings</div>
                    <button className="btn btn-gh btn-sm" onClick={onClose}>✕</button>
                </div>

                <div className="fr">
                    <label>AI Provider</label>
                    <select className="inp" value={provider} onChange={e => setProvider(e.target.value)}>
                        <option value="claude">Anthropic (Claude Sonnet 4)</option>
                        <option value="openai">OpenAI (GPT-4o)</option>
                        <option value="gemini">Google (Gemini 1.5 Pro)</option>
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
                        <input className="inp" type="password" placeholder="sk-ant-..." value={keys.claudeKey}
                            onChange={e => setKeys({ ...keys, claudeKey: e.target.value })} />
                    )}
                    {provider === "openai" && (
                        <input className="inp" type="password" placeholder="sk-..." value={keys.openaiKey}
                            onChange={e => setKeys({ ...keys, openaiKey: e.target.value })} />
                    )}
                    {provider === "gemini" && (
                        <input className="inp" type="password" placeholder="AIzaSy..." value={keys.geminiKey}
                            onChange={e => setKeys({ ...keys, geminiKey: e.target.value })} />
                    )}

                    <div style={{ borderTop: "1px solid var(--bdr)", margin: "12px 0", paddingTop: 12 }}>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--t2)" }}>Supabase (Optional)</label>
                        <input className="inp" placeholder="Supabase URL (https://...)" value={keys.supabaseUrl || ""} onChange={e => setKeys({ ...keys, supabaseUrl: e.target.value })} style={{ marginBottom: 8 }} />
                        <input className="inp" placeholder="Supabase Anon Key" type="password" value={keys.supabaseKey || ""} onChange={e => setKeys({ ...keys, supabaseKey: e.target.value })} />
                    </div>
                </div>

                {/* User Goals */}
                <div className="fr">
                    <label>Goals & Targets</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                            <div style={{ fontSize: 10, color: "var(--t3)", marginBottom: 3, fontWeight: 600 }}>🎯 IELTS Target</div>
                            <select className="inp" value={goals.ieltsTarget} onChange={e => setGoals({ ...goals, ieltsTarget: e.target.value })}>
                                {["6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
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
