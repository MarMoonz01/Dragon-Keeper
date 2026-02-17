import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { ai, load, save } from '../utils/helpers';
import { loadGameState } from '../utils/supabaseSync';
import Loader from './Loader';

export default function WeeklyReviewModal({ onClose, forceShow = false }) {
    const [loading, setLoading] = useState(true);
    const [reviewData, setReviewData] = useState(null);
    const [aiInsight, setAiInsight] = useState("");
    const [goals, setGoals] = useState(["", "", ""]);
    const [step, setStep] = useState(1); // 1: Stats, 2: AI Insight, 3: Goals

    const onCloseRef = React.useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useEffect(() => {
        const checkAndLoad = async () => {
            const today = new Date();
            const isSunday = today.getDay() === 0;
            let lastReview = load("nx-last-review");
            const todayStr = today.toISOString().split('T')[0];

            // Try Supabase if localStorage is empty
            if (!lastReview) {
                const gs = await loadGameState();
                if (gs?.last_review) {
                    lastReview = gs.last_review;
                    localStorage.setItem('nx-last-review', JSON.stringify(lastReview));
                }
            }

            if (!forceShow) {
                if (!isSunday || lastReview === todayStr) {
                    setLoading(false);
                    return;
                }
            }

            // Fetch last 7 days summary
            try {
                if (supabase) {
                    const start = new Date();
                    start.setDate(today.getDate() - 7);
                    const { data, error } = await supabase.from('daily_summaries')
                        .select('*')
                        .gte('date', start.toISOString().split('T')[0])
                        .order('date', { ascending: true });

                    if (error) { console.error("Weekly review fetch error:", error); setLoading(false); return; }
                    if (data && data.length > 0) {
                        await processReview(data);
                    } else {
                        setLoading(false); // No data
                    }
                } else {
                    setLoading(false);
                }
            } catch (e) {
                console.error("Weekly review error:", e);
                setLoading(false);
            }
        };
        checkAndLoad();
    }, [forceShow]);

    const processReview = async (data) => {
        const totalScore = data.reduce((a, b) => a + (b.productivity_score || 0), 0);
        const avgScore = Math.round(totalScore / data.length) || 0;
        const totalTasks = data.reduce((a, b) => a + (b.completed_tasks?.length || 0), 0);

        // Mock simple analysis for immediate display
        setReviewData({
            avgScore,
            totalTasks,
            bestDay: data.reduce((a, b) => (a.productivity_score > b.productivity_score ? a : b), data[0] || {}),
            days: data
        });

        // Generate AI Insight
        try {
            const prompt = `Weekly Review Analysis.\nData: ${JSON.stringify(data.map(d => ({ date: d.date, score: d.productivity_score, mood: d.mood })))}.\nSummarize the week in 3 bullet points: 1. Key Strength, 2. Main Weakness, 3. Advice for next week. Keep it concise & motivating.`;
            const r = await ai([{ role: "user", content: prompt }], "You are a wise mentor.");
            setAiInsight(r);
        } catch (e) {
            console.error(e);
            setAiInsight("Unable to generate AI insights at the moment.");
        }
        setLoading(false);
    };

    const handleSave = async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        save("nx-last-review", todayStr);
        save("nx-weekly-goals", { weekStart: todayStr, goals: goals.filter(g => g.trim()) });

        if (supabase) {
            // Optional: save to a 'weekly_reviews' table if we had one, for now just local is fine for goals preference
            // Or log as a special daily summary note
        }
        onClose();
    };

    if (!reviewData && !loading) return null;

    return (
        <div className="mo">
            <div className="mc" style={{ maxWidth: 500 }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>
                        <Loader text="Compiling Weekly Report..." />
                    </div>
                ) : (
                    <>
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{ fontSize: 32 }}>📅</div>
                            <div className="mc-t">Weekly Review</div>
                            <div style={{ fontSize: 13, color: "var(--t2)" }}>Reflect on the past 7 days</div>
                        </div>

                        {step === 1 && (
                            <div className="g2" style={{ marginBottom: 20 }}>
                                <div className="card" style={{ textAlign: "center", padding: 16 }}>
                                    <div style={{ fontSize: 24, color: "var(--teal)", fontWeight: 700 }}>{reviewData.avgScore}%</div>
                                    <div style={{ fontSize: 11, color: "var(--t2)" }}>Avg Productivity</div>
                                </div>
                                <div className="card" style={{ textAlign: "center", padding: 16 }}>
                                    <div style={{ fontSize: 24, color: "var(--gold)", fontWeight: 700 }}>{reviewData.totalTasks}</div>
                                    <div style={{ fontSize: 11, color: "var(--t2)" }}>Tasks Crushed</div>
                                </div>
                                <div className="card" style={{ gridColumn: "span 2", padding: 16 }}>
                                    <div style={{ fontSize: 11, color: "var(--t2)", marginBottom: 6 }}>Best Day</div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontWeight: 600 }}>{new Date(reviewData.bestDay.date).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                                        <span className="badge" style={{ background: "rgba(52,211,153,0.1)", color: "var(--teal)" }}>{reviewData.bestDay.productivity_score}%</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="card" style={{ marginBottom: 20, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)" }}>
                                <div className="ct">🤖 AI Insights</div>
                                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                                    {aiInsight || <Loader text="Analyzing..." />}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div style={{ marginBottom: 20 }}>
                                <div className="ct">🎯 Goals for Next Week</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {goals.map((g, i) => (
                                        <input
                                            key={i}
                                            className="inp"
                                            placeholder={`Goal #${i + 1} (e.g. Complete 5 IELTS readings)`}
                                            value={g}
                                            onChange={e => {
                                                const n = [...goals];
                                                n[i] = e.target.value;
                                                setGoals(n);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mac" style={{ justifyContent: "space-between" }}>
                            {step > 1 ? (
                                <button className="btn btn-gh" onClick={() => setStep(s => s - 1)}>Back</button>
                            ) : (
                                <button className="btn btn-gh" onClick={onClose}>Skip</button>
                            )}

                            {step < 3 ? (
                                <button className="btn btn-p" onClick={() => setStep(s => s + 1)}>Next ➜</button>
                            ) : (
                                <button className="btn btn-g" onClick={handleSave}>Finish Review ✨</button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
