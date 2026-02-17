import React, { useState, useEffect } from 'react';
import { load, save, ai } from '../utils/helpers';

export default function BriefingCard({ dragon, streak }) {
    const [briefing, setBriefing] = useState("");
    const [briefLoading, setBriefLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const profile = load("nx-profile") || {};
        const settings = load("nx-settings") || {};
        const userName = profile.name || "Scholar";
        const currentBand = profile.currentBand || "unknown";
        const targetBand = settings.ieltsTarget || "7.5";
        const goals = (profile.goals || []).join(", ") || "IELTS prep, healthy habits";
        const key = "brief_" + new Date().toDateString() + "_lv" + dragon.level + "_s" + streak;
        const c = load(key);
        if (c) {
            setBriefing(c);
        } else {
            setBriefLoading(true);
            ai([{ role: "user", content: `Daily briefing for ${userName}. IELTS target ${targetBand} (current ${currentBand}). Goals: ${goals}. ${new Date().toDateString()}. Dragon Lv.${dragon.level}, streak ${streak} days. Give: 1 key priority, 1 IELTS tip, 1 motivational line. Max 90 words.` }])
                .then(r => { if (!isMounted) return; setBriefing(r); save(key, r); setBriefLoading(false); })
                .catch(() => { if (isMounted) setBriefLoading(false); });
        }
        return () => { isMounted = false; };
    }, [dragon.level, streak]);

    if (!briefLoading && !briefing) return null;

    return (
        <>
            {briefLoading && (
                <div className="brief" style={{ opacity: 0.5 }}>
                    <div className="brief-time" style={{ background: "rgba(255,255,255,.06)", width: "40%", height: 12, borderRadius: 4 }}>&nbsp;</div>
                    <div className="brief-head" style={{ background: "rgba(255,255,255,.06)", width: "60%", height: 16, borderRadius: 4, marginTop: 6 }}>&nbsp;</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                        <div style={{ background: "rgba(255,255,255,.04)", height: 10, borderRadius: 3, width: "100%" }}>&nbsp;</div>
                        <div style={{ background: "rgba(255,255,255,.04)", height: 10, borderRadius: 3, width: "85%" }}>&nbsp;</div>
                        <div style={{ background: "rgba(255,255,255,.04)", height: 10, borderRadius: 3, width: "70%" }}>&nbsp;</div>
                    </div>
                </div>
            )}
            {briefing && (
                <div className="brief">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div className="brief-time">🌅 DAILY BRIEFING — {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        <button className="btn btn-gh btn-sm" style={{ padding: "2px 6px", fontSize: 10 }} onClick={() => setCollapsed(!collapsed)}>
                            {collapsed ? "SHOW" : "HIDE"}
                        </button>
                    </div>
                    {!collapsed && (
                        <>
                            <div className="brief-head">Good morning, {(load("nx-profile") || {}).name || "Scholar"}</div>
                            <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.8 }}>{briefing}</div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
