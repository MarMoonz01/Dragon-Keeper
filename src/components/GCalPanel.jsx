import React from 'react';

export default function GCalPanel({ gcal, onConnect, onPush, pushing }) {
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
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-g btn-sm" onClick={onPush} disabled={pushing} style={{ flex: 1 }}>{pushing ? "⏳ Syncing..." : "📤 Push Tasks"}</button>
                    <button className="btn btn-gh btn-sm" style={{ flex: 1 }}>📥 Import</button>
                </div>
            ) : (
                <div className="ins" style={{ marginTop: 8 }}>
                    <span className="ins-ic">ℹ️</span>
                    <span>To enable real Google Calendar sync, add your OAuth 2.0 Client ID to the code and host on HTTPS.</span>
                </div>
            )}
        </div>
    );
}
