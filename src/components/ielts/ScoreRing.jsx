import React from 'react';

export default function ScoreRing({ label, score, color }) {
    const r = 28, c = 2 * Math.PI * r;
    const pct = (score / 9) * 100;
    return (
        <div className="score-ring-container">
            <div className="score-ring-wrapper">
                <svg width={72} height={72}>
                    <circle cx={36} cy={36} r={r} fill="none"
                        stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
                    <circle cx={36} cy={36} r={r} fill="none"
                        stroke={color} strokeWidth={5}
                        strokeDasharray={c}
                        strokeDashoffset={c - (pct / 100) * c}
                        strokeLinecap="round"
                        className="score-ring-progress" />
                </svg>
                <div className="score-ring-value" style={{ color }}>
                    {score.toFixed(1)}
                </div>
            </div>
            <div className="score-ring-label">
                {label}
            </div>
        </div>
    );
}
