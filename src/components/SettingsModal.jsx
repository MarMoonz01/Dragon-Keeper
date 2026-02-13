import React, { useState, useEffect } from 'react';
import { load, save } from '../utils/helpers';

export default function SettingsModal({ onClose, onReset }) {
    const [provider, setProvider] = useState("claude");
    const [keys, setKeys] = useState({ claudeKey: "", openaiKey: "", geminiKey: "" });

    useEffect(() => {
        load("nx-settings").then(s => {
            if (s) {
                setProvider(s.provider || "claude");
                setKeys({
                    claudeKey: s.claudeKey || "",
                    openaiKey: s.openaiKey || "",
                    geminiKey: s.geminiKey || "",
                    supabaseUrl: s.supabaseUrl || "",
                    supabaseKey: s.supabaseKey || ""
                });
            }
        });
    }, []);

    const handleSave = () => {
        save("nx-settings", { provider, ...keys });
        onClose();
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
                        <option value="claude">Anthropic (Claude 5 Opus - 2026)</option>
                        <option value="openai">OpenAI (GPT-6 Turbo)</option>
                        <option value="gemini">Google (Gemini 3.0 Ultra)</option>
                    </select>
                </div>

                <div className="fr">
                    <label>API Configuration</label>
                    <div style={{ fontSize: 11, color: "var(--t2)", marginBottom: 10 }}>
                        Connect your personal "AI Brain" here. The API Key allows the system
                        to communicate with advanced 2026 models like Claude 5 or GPT-6.
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
