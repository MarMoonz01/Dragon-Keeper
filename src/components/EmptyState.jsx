import React from 'react';

/**
 * Reusable empty state component with personality.
 * Shows emoji, title, subtitle, and optional CTA button.
 */
export default function EmptyState({ emoji = "✨", title, subtitle, action }) {
    return (
        <div style={{
            textAlign: "center",
            padding: "40px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8
        }}>
            <div style={{ fontSize: 48, marginBottom: 8, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}>
                {emoji}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)" }}>
                {title}
            </div>
            <div style={{ fontSize: 12, color: "var(--t2)", maxWidth: 280, lineHeight: 1.5 }}>
                {subtitle}
            </div>
            {action && (
                <button
                    className="btn btn-p"
                    style={{ marginTop: 12, padding: "10px 24px" }}
                    onClick={action.onClick}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
