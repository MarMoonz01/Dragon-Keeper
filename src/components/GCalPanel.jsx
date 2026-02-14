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
            <div className="ct" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                📅 Google Calendar
                <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(167,139,250,.2)", color: "var(--violet)", padding: "2px 8px", borderRadius: 20, letterSpacing: 1 }}>COMING SOON</span>
            </div>
            <div className="gcal-s">
                <div className={"gcal-dot dc"} />
                <div className="gcal-info">
                    <div className="gcal-nm">Google Calendar Integration</div>
                    <div className="gcal-sub">OAuth 2.0 integration is under development</div>
                </div>
            </div>
            <div className="ins" style={{ marginTop: 8, background: "rgba(167,139,250,.06)", border: "1px solid rgba(167,139,250,.15)" }}>
                <span className="ins-ic">🚧</span>
                <span>Auto-sync with Google Calendar is coming in a future update. Tasks will be pushed to your calendar automatically once OAuth 2.0 is configured.</span>
            </div>
        </div>
    );
}
