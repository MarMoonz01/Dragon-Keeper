import React, { useState } from 'react';
import Loader from '../Loader';
import { ai, load, save } from '../../utils/helpers';
import { ISKILLS } from '../../data/constants';

export default function ScoreTracker({ latestScore, realScores, practiceLogs, togglePracticeLog, ieltsTarget, supabase }) {
    const [ieltsAnalysis, setIeltsAnalysis] = useState("");
    const [analysisLoading, setAnalysisLoading] = useState(false);

    return (
        <div className="g2">
            <div className="card">
                <div className="ct">Practice Log</div>
                <div className="tl">
                    <div className="tl">
                        {practiceLogs.length === 0 && (
                            <div style={{ fontSize: 12, color: "var(--t2)", textAlign: "center", padding: 20 }}>
                                {supabase ? "No practice logs found. Add data manually to DB for now." : "⚠️ Connect Supabase to see logs"}
                            </div>
                        )}
                        {practiceLogs.map((e) => (
                            <div key={e.id} className="tli" onClick={() => togglePracticeLog(e.id, e.completed)} style={{ cursor: "pointer" }}>
                                <div className={"tld" + (e.completed ? " y" : "")} />
                                <div className="tlt">{e.time}</div><div className="tln">{e.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="ct">Score History</div>
                {ISKILLS.map(s => {
                    const displayScores = realScores.slice(0, 8).reverse();
                    const latestIdx = displayScores.length - 1;
                    return (
                        <div key={s.name} style={{ marginBottom: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={{ fontSize: 11, fontWeight: 700 }}>{s.ic} {s.name}</span>
                                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: s.color }}>
                                    {latestScore ? latestScore[s.name.toLowerCase()] : s.sc}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: 5, overflowX: "auto" }}>
                                {displayScores.length === 0 ? (
                                    <div style={{ flex: 1, fontSize: 11, color: "var(--t3)", textAlign: "center", padding: "8px 0" }}>No scores logged yet</div>
                                ) : displayScores.map((entry, i) => (
                                    <div key={entry.id || i} style={{ flex: 1, minWidth: 44, background: "rgba(255,255,255,.05)", borderRadius: 6, padding: "5px 3px", textAlign: "center" }}>
                                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: i === latestIdx ? s.color : "var(--t2)" }}>
                                            {entry[s.name.toLowerCase()] || "-"}
                                        </div>
                                        <div style={{ fontSize: 9, color: "var(--t3)" }}>
                                            {new Date(entry.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="card cs2">
                <div className="ct">🤖 AI Target Analysis</div>
                {!ieltsAnalysis && !analysisLoading && (
                    <button className="btn btn-v btn-sm" style={{ marginBottom: 10 }} onClick={async () => {
                        setAnalysisLoading(true);
                        const cacheKey = "ielts_analysis_" + new Date().toDateString();
                        const cached = load(cacheKey);
                        if (cached) { setIeltsAnalysis(cached); setAnalysisLoading(false); return; }
                        const scoreInfo = latestScore
                            ? `Listening: ${latestScore.listening}, Reading: ${latestScore.reading}, Writing: ${latestScore.writing}, Speaking: ${latestScore.speaking}, Overall: ${latestScore.overall}`
                            : "No scores logged yet";
                        const r = await ai([{ role: "user", content: `IELTS Target Analysis. Current scores: ${scoreInfo}. Target: ${ieltsTarget}. Total attempts: ${realScores.length}.\n\nAnalyse which skills need most work, give specific improvement tips for each, and estimate timeline. Max 120 words.` }],
                            "You are an IELTS expert tutor. Be specific and data-driven.");
                        setIeltsAnalysis(r); save(cacheKey, r);
                        setAnalysisLoading(false);
                    }}>Generate AI Analysis</button>
                )}
                {analysisLoading && <Loader text="Analysing your IELTS profile..." />}
                {ieltsAnalysis && <div className="aibx">{ieltsAnalysis}</div>}
            </div>
        </div>
    );
}
