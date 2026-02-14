import React, { useState, useEffect } from 'react';

export default function GCalPanel({ gcal, onConnect, onPush, pushing }) {
    const [showNotice, setShowNotice] = useState(false);

    useEffect(() => {
        if (showNotice) {
            const t = setTimeout(() => setShowNotice(false), 4000);
            return () => clearTimeout(t);
        }
    }, [showNotice]);

    return (
        <div className="card">
            <div className="ct">📅 Google Calendar</div>
            <div className="gcal-s">
                <div className={"gcal-dot" + (gcal.connected ? " conn" : " dc")} />
                <div className="gcal-info">
                    <div className="gcal-nm">{gcal.connected ? "Connected — syncing active" : "Not Connected"}</div>
                    <div className="gcal-sub">{gcal.connected ? "Last sync: " + (gcal.lastSync || "now") : "Connect to auto-sync your schedule"}</div>
                </div>
                {!gcal.connected && <button className="btn btn-t btn-sm" onClick={onConnect}>Connect</button>}
            </div>
            {gcal.connected ? (
                <>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-g btn-sm" onClick={onPush} disabled={pushing} style={{ flex: 1 }}>{pushing ? "⏳ Syncing..." : "📤 Push Tasks"}</button>
                        <button className="btn btn-gh btn-sm" style={{ flex: 1 }} onClick={() => setShowNotice(true)}>📥 Import</button>
                    </div>
                    {showNotice && (
                        <div className="ins" style={{ marginTop: 8, background: "rgba(167,139,250,.1)", border: "1px solid rgba(167,139,250,.25)", borderRadius: 10, animation: "fadeIn .3s" }}>
                            <span className="ins-ic">ℹ️</span>
                            <span>Google Calendar import requires OAuth setup. See <strong>Settings</strong> for details.</span>
                        </div>
                    )}
                </>
            ) : (
                <div className="ins" style={{ marginTop: 8 }}>
                    <span className="ins-ic">ℹ️</span>
                    <span>To enable real Google Calendar sync, add your OAuth 2.0 Client ID to the code and host on HTTPS.</span>
                </div>
            )}
        </div>
    );
}
