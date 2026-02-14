import React, { useState, useEffect } from 'react';
import { load } from '../utils/helpers';
import { ISKILLS } from '../data/constants';
import { supabase } from '../utils/supabaseClient';

import ScoreTracker from '../components/ielts/ScoreTracker';
import EssayWriter from '../components/ielts/EssayWriter';
import SpeakingDojo from '../components/ielts/SpeakingDojo';
import Notebook from '../components/ielts/Notebook';
import FlashcardDeck from '../components/ielts/FlashcardDeck';

export default function IELTSPage() {
    const [tab, setTab] = useState("tracker");
    const [notebook, setNotebook] = useState([]);
    const [realScores, setRealScores] = useState([]);
    const [practiceLogs, setPracticeLogs] = useState([]);
    const [showLogModal, setShowLogModal] = useState(false);
    const [newLog, setNewLog] = useState({ listening: "", reading: "", writing: "", speaking: "", note: "" });
    const [errorMsg, setErrorMsg] = useState("");
    const [ieltsTarget, setIeltsTarget] = useState("7.5");

    // Auto-dismiss error toast
    useEffect(() => {
        if (errorMsg) {
            const t = setTimeout(() => setErrorMsg(""), 5000);
            return () => clearTimeout(t);
        }
    }, [errorMsg]);

    // Load IELTS target from settings
    useEffect(() => {
        const s = load("nx-settings");
        if (s && s.ieltsTarget) setIeltsTarget(s.ieltsTarget);
    }, []);

    const latestScore = realScores.length > 0 ? realScores[0] : null;
    const band = latestScore ? latestScore.overall : "-";

    // Load data on mount
    useEffect(() => {
        if (!supabase) return;
        fetchScores();
        fetchNotebook();
        fetchPracticeLogs();
    }, [supabase]);

    const fetchScores = async () => {
        const { data, error } = await supabase.from('scores').select('*').order('created_at', { ascending: false });
        if (error) console.error("Error fetching scores:", error);
        else if (data) setRealScores(data);
    };

    const fetchNotebook = async () => {
        const { data, error } = await supabase.from('notebook').select('*').order('created_at', { ascending: false });
        if (error) console.error("Error fetching notebook:", error);
        else if (data) setNotebook(data);
    };

    const fetchPracticeLogs = async () => {
        const { data, error } = await supabase.from('practice_logs').select('*').order('created_at', { ascending: false });
        if (error) console.error("Error fetching practice logs:", error);
        else if (data) setPracticeLogs(data);
    };

    const togglePracticeLog = async (id, currentStatus) => {
        if (!supabase) return;
        const { error } = await supabase.from('practice_logs').update({ completed: !currentStatus }).eq('id', id);
        if (error) console.error("Error updating log:", error);
        else fetchPracticeLogs();
    };

    const addToNotebook = async (item) => {
        if (supabase) {
            const { error } = await supabase.from('notebook').insert([item]);
            if (error) { console.error("Error saving to notebook:", error); setErrorMsg("Failed to save to Supabase: " + error.message); }
            else fetchNotebook();
        } else {
            setNotebook(prev => [item, ...prev]);
        }
    };

    const handleSaveLog = async () => {
        if (!supabase) { setErrorMsg("Please configure Supabase in Settings first."); return; }
        const l = parseFloat(newLog.listening) || 0;
        const r = parseFloat(newLog.reading) || 0;
        const w = parseFloat(newLog.writing) || 0;
        const s = parseFloat(newLog.speaking) || 0;
        const overall = (Math.round((l + r + w + s) / 4 * 2) / 2).toFixed(1);

        const { error } = await supabase.from('scores').insert([{
            listening: l, reading: r, writing: w, speaking: s,
            overall: parseFloat(overall), note: newLog.note
        }]);

        if (error) {
            setErrorMsg("Error saving score: " + error.message);
        } else {
            setNewLog({ listening: "", reading: "", writing: "", speaking: "", note: "" });
            setShowLogModal(false);
            fetchScores();
        }
    };

    return (
        <div>
            <div className="ph"><div className="ph-title">IELTS Tracker</div><div className="ph-sub">Track · Practice · Master every band with AI coaching</div></div>
            {errorMsg && (
                <div style={{ background: "rgba(255,94,135,.12)", border: "1px solid rgba(255,94,135,.3)", borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn .3s" }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <span style={{ fontSize: 12, color: "var(--rose)", flex: 1 }}>{errorMsg}</span>
                    <button onClick={() => setErrorMsg("")} style={{ background: "none", border: "none", color: "var(--t2)", cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
            )}
            {/* Band Summary Header */}
            <div style={{ background: "linear-gradient(135deg,rgba(167,139,250,.12),rgba(0,221,179,.08))", border: "1px solid rgba(167,139,250,.2)", borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", gap: 22, marginBottom: 18, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t2)", letterSpacing: 2, marginBottom: 3 }}>OVERALL BAND</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 50, fontWeight: 700, color: "var(--teal)", lineHeight: 1, textShadow: "0 0 30px rgba(0,221,179,.4)" }}>{band}</div>
                    <span className="badge bt" style={{ marginTop: 6 }}>Target: {ieltsTarget}</span>
                    <button className="btn btn-gh btn-sm" style={{ marginTop: 12, width: "100%" }} onClick={() => setShowLogModal(true)}>
                        📝 Log Score
                    </button>
                    {!supabase && <div style={{ fontSize: 10, color: "var(--rose)", marginTop: 8 }}>⚠️ DB not connected</div>}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        {ISKILLS.map(s => {
                            const realVal = latestScore ? latestScore[s.name.toLowerCase()] : 0;
                            return (
                                <div key={s.name} className="isr">
                                    <div style={{ fontSize: 16, width: 22 }}>{s.ic}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, width: 68, flexShrink: 0 }}>{s.name}</div>
                                    <div className="ib"><div className="ibf" style={{ width: realVal / 9 * 100 + "%", background: s.color }} /></div>
                                    <div className="isc" style={{ color: s.color }}>{realVal || "-"}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Tabs */}
            <div className="tabs">
                {["tracker", "writing", "speaking", "notebook", "flashcards"].map(t => (
                    <button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</button>
                ))}
            </div>

            {tab === "tracker" && <ScoreTracker latestScore={latestScore} realScores={realScores} practiceLogs={practiceLogs} togglePracticeLog={togglePracticeLog} ieltsTarget={ieltsTarget} supabase={supabase} />}
            {tab === "writing" && <EssayWriter />}
            {tab === "speaking" && <SpeakingDojo setErrorMsg={setErrorMsg} />}
            {tab === "notebook" && <Notebook notebook={notebook} setNotebook={setNotebook} addToNotebook={addToNotebook} fetchNotebook={fetchNotebook} supabase={supabase} />}
            {tab === "flashcards" && <FlashcardDeck notebook={notebook} setNotebook={setNotebook} fetchNotebook={fetchNotebook} supabase={supabase} />}

            {/* Score Log Modal */}
            {showLogModal && (
                <div className="mo">
                    <div className="mc">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <div className="mc-t" style={{ margin: 0 }}>📝 Log IELTS Score</div>
                            <button className="btn btn-gh btn-sm" onClick={() => setShowLogModal(false)}>✕</button>
                        </div>
                        <div className="g2" style={{ marginBottom: 12 }}>
                            {["Listening", "Reading", "Writing", "Speaking"].map(s => (
                                <div key={s}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)" }}>{s}</label>
                                    <input className="inp" type="number" step="0.5" max="9"
                                        value={newLog[s.toLowerCase()]}
                                        onChange={e => setNewLog({ ...newLog, [s.toLowerCase()]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)" }}>Note (Optional)</label>
                        <input className="inp" style={{ marginBottom: 20 }} placeholder="e.g. British Council Mock..."
                            value={newLog.note} onChange={e => setNewLog({ ...newLog, note: e.target.value })}
                        />
                        <button className="btn btn-g" style={{ width: "100%" }} onClick={handleSaveLog}>Save Log</button>
                    </div>
                </div>
            )}
        </div>
    );
}
