import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Loader from '../Loader';
import { ai, load, save } from '../../utils/helpers';
import { ISKILLS } from '../../data/constants';

const SKILL_COLORS = {
    listening: '#2dd4bf', // teal
    reading: '#a78bfa',   // violet
    writing: '#fccb58',   // gold
    speaking: '#fb7185',  // rose
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "var(--card)", border: "1px solid var(--bdr)",
            borderRadius: 8, padding: "8px 12px", fontSize: 11,
            boxShadow: "0 4px 12px rgba(0,0,0,.3)"
        }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--t1)" }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                    <span style={{ color: "var(--t2)" }}>{p.dataKey}:</span>
                    <span style={{ fontWeight: 700, color: p.color, fontFamily: "'JetBrains Mono',monospace" }}>{p.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function ScoreTracker({ latestScore, realScores, practiceLogs, togglePracticeLog, ieltsTarget, supabase }) {
    const [ieltsAnalysis, setIeltsAnalysis] = useState("");
    const [analysisLoading, setAnalysisLoading] = useState(false);

    // Prepare chart data — reverse so oldest is first (left to right)
    const chartData = realScores.slice(0, 12).reverse().map(s => ({
        date: new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        Listening: s.listening || 0,
        Reading: s.reading || 0,
        Writing: s.writing || 0,
        Speaking: s.speaking || 0,
    }));

    return (
        <div className="g2">
            {/* Score Trend Chart */}
            <div className="card cs2">
                <div className="ct">📈 Score Trend</div>
                {chartData.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--t3)", fontSize: 12 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                        Log your first IELTS score to see your progress trend!
                    </div>
                ) : (
                    <div style={{ width: "100%", height: 240 }}>
                        <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: "var(--t3)" }}
                                    axisLine={{ stroke: "var(--bdr)" }}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[3, 9]}
                                    ticks={[4, 5, 6, 7, 8, 9]}
                                    tick={{ fontSize: 10, fill: "var(--t3)" }}
                                    axisLine={{ stroke: "var(--bdr)" }}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                                    iconSize={8}
                                    iconType="circle"
                                />
                                {/* Target line */}
                                {ieltsTarget && (
                                    <Line
                                        type="linear"
                                        dataKey={() => parseFloat(ieltsTarget)}
                                        name={`Target (${ieltsTarget})`}
                                        stroke="var(--t3)"
                                        strokeDasharray="5 5"
                                        strokeWidth={1}
                                        dot={false}
                                        activeDot={false}
                                    />
                                )}
                                <Line type="monotone" dataKey="Listening" stroke={SKILL_COLORS.listening} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                <Line type="monotone" dataKey="Reading" stroke={SKILL_COLORS.reading} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                <Line type="monotone" dataKey="Writing" stroke={SKILL_COLORS.writing} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                <Line type="monotone" dataKey="Speaking" stroke={SKILL_COLORS.speaking} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Practice Log */}
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

            {/* AI Target Analysis */}
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
