import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DRAGONS } from '../data/constants';
import { useSettings } from '../context/SettingsContext';
import { useGame } from '../context/GameContext';
import { supabase } from '../utils/supabaseClient';

export default function Sidebar({ isOpen, onShowWeeklyReview }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme, setShowSettings } = useSettings();
    const { dragon, dragonSkill } = useGame();

    const activePage = location.pathname.substring(1) || 'dashboard';
    const stage = DRAGONS.reduce((s, st) => dragon.level >= st.lv ? st : s, DRAGONS[0]);

    const nav = [
        { id: "dashboard", ic: "⚡", label: "Dashboard" },
        { id: "analysis", ic: "📊", label: "Analysis" },
        { id: "hatchery", ic: "🐉", label: "Hatchery" },
        { id: "worldmap", ic: "🗺️", label: "World Map" },
        { id: "library", ic: "📜", label: "Archives" },
        { id: "ielts", ic: "📚", label: "IELTS Tracker" },
        { id: "health", ic: "❤️", label: "Health" },
    ];

    return (
        <nav className={`sb${isOpen ? " open" : ""}`}>
            <div className="sb-logo">
                <div className="sb-logo-main">NEXUS</div>
                <div className="sb-logo-sub">AI Life Secretary</div>
                <div style={{ fontSize: 9, color: "var(--t3)", letterSpacing: 1, textTransform: "uppercase", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: supabase ? "var(--teal)" : "var(--t3)", display: "inline-block", boxShadow: supabase ? "0 0 6px var(--teal)" : "none" }} />
                    {supabase ? "Cloud Sync" : "Local Only"}
                </div>
            </div>
            <div className="sb-nav">
                <div style={{ fontSize: 9, color: "var(--t3)", letterSpacing: 2, padding: "10px 8px 3px", fontWeight: 700, textTransform: "uppercase" }}>Core</div>
                {nav.map(n => (
                    <div key={n.id} className={"ni" + (activePage === n.id ? " on" : "")} onClick={() => navigate('/' + n.id)}>
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
                    {dragonSkill && dragonSkill.xpMultiplier > 1 && (
                        <div style={{ fontSize: 9, color: "var(--teal)", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
                            {dragonSkill.em} {dragonSkill.skill} (×{dragonSkill.xpMultiplier} XP)
                        </div>
                    )}
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button className="btn btn-gh btn-sm" style={{ padding: "6px" }} onClick={toggleTheme} title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}>
                        {theme === "light" ? "🌙" : "☀️"}
                    </button>
                    {onShowWeeklyReview && (
                        <button className="btn btn-gh btn-sm" style={{ padding: "6px" }} onClick={onShowWeeklyReview} title="Weekly Review">📅</button>
                    )}
                    <button className="btn btn-gh btn-sm" style={{ padding: "6px" }} onClick={() => setShowSettings(true)}>⚙️</button>
                </div>
            </div>
        </nav>
    );
}
