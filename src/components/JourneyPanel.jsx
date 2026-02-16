import React, { useMemo } from 'react';
import { useIELTS } from '../context/IELTSContext';
import { useGame } from '../context/GameContext';
import { DRAGON_SKILLS } from '../data/constants';

export default function JourneyPanel() {
    const { ieltsTarget, scores, realScores } = useIELTS();
    const { dragonSkill } = useGame();

    const target = parseFloat(ieltsTarget) || 7.5;

    // Calculate current average band from scores
    const currentBand = useMemo(() => {
        if (scores && typeof scores.overall === "number") return scores.overall;
        // Fallback: calculate from writing history
        try {
            const history = JSON.parse(localStorage.getItem("nx-writing-history") || "[]");
            if (history.length > 0) {
                const avg = history.slice(0, 5).reduce((s, h) => s + (h.band || 0), 0) / Math.min(history.length, 5);
                return Math.round(avg * 2) / 2; // Round to nearest 0.5
            }
        } catch (e) { /* ignore */ }
        return 5.0; // Default starting band
    }, [scores]);

    // Generate milestones from current to target
    const milestones = useMemo(() => {
        const ms = [];
        const start = Math.floor(currentBand * 2) / 2; // Round down to 0.5
        for (let b = start; b <= target + 0.01; b += 0.5) {
            const band = Math.round(b * 2) / 2;
            const skill = DRAGON_SKILLS.reduce((best, s) => band >= s.band ? s : best, DRAGON_SKILLS[0]);
            ms.push({ band, skill, reached: currentBand >= band });
        }
        return ms;
    }, [currentBand, target]);

    // Progress percentage
    const range = Math.max(target - 4.0, 0.5); // Full scale from 4.0, min 0.5 to prevent division by zero
    const progress = Math.min(100, Math.max(0, ((currentBand - 4.0) / range) * 100));
    const targetPct = 100; // Target is always at the end

    // Predict days to target based on improvement rate
    const prediction = useMemo(() => {
        try {
            const history = JSON.parse(localStorage.getItem("nx-writing-history") || "[]");
            if (history.length < 3) return null;

            // Calculate improvement rate (bands per week)
            const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const days = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24));
            const improvement = (last.band - first.band);
            const ratePerWeek = (improvement / days) * 7;

            if (ratePerWeek <= 0) return { text: "Keep practising to build momentum!", days: null };

            const bandsToGo = target - currentBand;
            if (bandsToGo <= 0) return { text: "🎉 Target reached!", days: 0 };

            const weeksNeeded = bandsToGo / ratePerWeek;
            const daysNeeded = Math.round(weeksNeeded * 7);

            const predictedDate = new Date();
            predictedDate.setDate(predictedDate.getDate() + daysNeeded);
            const dateStr = predictedDate.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });

            return { text: `~${daysNeeded} days (${dateStr})`, days: daysNeeded };
        } catch (e) {
            return null;
        }
    }, [currentBand, target]);

    return (
        <div className="card" style={{ position: "relative", overflow: "hidden" }}>
            {/* Header */}
            <div className="ct" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                🗺️ Your Journey
                {dragonSkill && dragonSkill.xpMultiplier > 1 && (
                    <span style={{
                        fontSize: 9, fontWeight: 700,
                        background: "rgba(52,211,153,.15)", color: "var(--teal)",
                        padding: "2px 8px", borderRadius: 20, letterSpacing: 1
                    }}>
                        {dragonSkill.em} {dragonSkill.skill} Active
                    </span>
                )}
            </div>

            {/* Band Display */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
                <div>
                    <div style={{ fontSize: 9, color: "var(--t3)", letterSpacing: 2, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>CURRENT BAND</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "var(--teal)", fontFamily: "'JetBrains Mono',monospace" }}>{currentBand.toFixed(1)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "var(--t3)", letterSpacing: 2, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>GAP</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: target - currentBand > 0 ? "var(--gold)" : "var(--teal)", fontFamily: "'JetBrains Mono',monospace" }}>
                        {target - currentBand > 0 ? `+${(target - currentBand).toFixed(1)}` : "✅"}
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "var(--t3)", letterSpacing: 2, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>TARGET BAND</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "var(--violet)", fontFamily: "'JetBrains Mono',monospace" }}>{target.toFixed(1)}</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ position: "relative", height: 28, background: "var(--bg2)", borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
                <div style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, var(--teal), var(--violet))",
                    borderRadius: 14,
                    transition: "width 0.5s ease",
                    position: "relative"
                }}>
                    <span style={{
                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                        fontSize: 10, fontWeight: 700, color: "#fff",
                        fontFamily: "'JetBrains Mono',monospace"
                    }}>
                        {currentBand.toFixed(1)}
                    </span>
                </div>
            </div>

            {/* Milestone Markers */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                {milestones.map((m, i) => (
                    <div key={i} style={{ textAlign: "center", flex: 1 }}>
                        <div style={{
                            fontSize: 14,
                            opacity: m.reached ? 1 : 0.35,
                            filter: m.reached ? "none" : "grayscale(1)"
                        }}>
                            {m.skill.em}
                        </div>
                        <div style={{
                            fontSize: 9,
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono',monospace",
                            color: m.reached ? "var(--teal)" : "var(--t3)"
                        }}>
                            {m.band.toFixed(1)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Dragon Skill Info */}
            {dragonSkill && (
                <div style={{
                    display: "flex", gap: 10, alignItems: "center",
                    background: "var(--bg2)", borderRadius: 10, padding: "8px 12px", marginBottom: 10
                }}>
                    <div style={{ fontSize: 22 }}>{dragonSkill.em}</div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t1)" }}>{dragonSkill.skill}</div>
                        <div style={{ fontSize: 9, color: "var(--t3)" }}>
                            {dragonSkill.desc} · <span style={{ color: "var(--teal)" }}>×{dragonSkill.xpMultiplier} XP</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Prediction */}
            {prediction && (
                <div className="ins" style={{ background: "rgba(167,139,250,.06)", border: "1px solid rgba(167,139,250,.15)" }}>
                    <span className="ins-ic">🔮</span>
                    <span>
                        <strong>Predicted time to Band {target.toFixed(1)}:</strong> {prediction.text}
                    </span>
                </div>
            )}

            {!prediction && (
                <div className="ins">
                    <span className="ins-ic">💡</span>
                    <span>Complete 3+ writing practices to unlock journey predictions.</span>
                </div>
            )}
        </div>
    );
}
