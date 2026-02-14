import React from 'react';
import { DRAGONS } from '../data/constants';

export default function Sidebar({ page, setPage, dragon, onSettings }) {
    const stage = DRAGONS.reduce((s, st) => dragon.level >= st.lv ? st : s, DRAGONS[0]);
    const nav = [
        { id: "dashboard", ic: "⚡", label: "Dashboard" },
        { id: "analysis", ic: "📊", label: "Analysis" },
        { id: "hatchery", ic: "🐉", label: "Hatchery" },
        { id: "worldmap", ic: "🗺️", label: "World Map" },
        { id: "ielts", ic: "📚", label: "IELTS Tracker" },
        { id: "health", ic: "❤️", label: "Health" },
    ];

    return (
        <nav className="sb">
            <div className="sb-logo">
                <div className="sb-logo-main">NEXUS</div>
                <div className="sb-logo-sub">AI Life Secretary</div>
            </div>
            <div className="sb-nav">
                <div style={{ fontSize: 9, color: "var(--t3)", letterSpacing: 2, padding: "10px 8px 3px", fontWeight: 700, textTransform: "uppercase" }}>Core</div>
                {nav.map(n => (
                    <div key={n.id} className={"ni" + (page === n.id ? " on" : "")} onClick={() => setPage(n.id)}>
                        <span className="ni-ic">{n.ic}</span>{n.label}
                        {n.id === "hatchery" && <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--gold)" }}>Lv{dragon.level}</span>}
                    </div>
                ))}
            </div>
            <div className="sb-user">
                <div className="sb-av">{stage.em}</div>
                <div>
                    <div className="sb-un">{stage.name}</div>
                    <div className="sb-xp">{dragon.xp} XP · Lv{dragon.level}</div>
                </div>
                <button className="btn btn-gh btn-sm" style={{ marginLeft: "auto", padding: "6px" }} onClick={onSettings}>⚙️</button>
            </div>
        </nav>
    );
}
