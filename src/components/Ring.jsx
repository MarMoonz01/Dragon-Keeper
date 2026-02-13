import React from 'react';

export default function Ring({ size = 72, stroke = 5, pct = 0, color = "#00ddb3", children }) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return (
        <div className="ring" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                    strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} strokeLinecap="round"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset .8s ease" }} />
            </svg>
            <div className="ring-in">{children}</div>
        </div>
    );
}
