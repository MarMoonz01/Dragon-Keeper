import React from 'react';

const NODE_SIZE = 56;
const BOSS_SIZE = 72;

function formatDate(d) {
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function daysFromNow(d) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const target = new Date(d); target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

const MapNode = React.memo(({ node, status, score, animating, onClick }) => {
    const isBoss = node.type === "boss";
    const size = isBoss ? BOSS_SIZE : NODE_SIZE;
    const isAnimatingThis = animating === node.id;
    const dueDays = daysFromNow(node.dueDate);
    const isOverdue = status !== "cleared" && dueDays < 0;
    const isDueSoon = status !== "cleared" && dueDays >= 0 && dueDays <= 2;

    return (
        <div
            className={`wm-node ${status}${isBoss ? " boss" : ""}${isAnimatingThis ? " clearing" : ""}${isOverdue ? " overdue" : ""}`}
            style={{
                left: `${node.x}%`, top: `${node.y}%`,
                width: size, height: size,
                transform: "translate(-50%, -50%)"
            }}
            onClick={() => onClick(node)}
        >
            <div className="wm-node-em">{status === "locked" ? "❓" : node.em}</div>
            {status === "cleared" && <div className="wm-node-check">✓</div>}
            {status === "active" && <div className="wm-node-pulse" />}
            {isBoss && status !== "locked" && <div className="wm-node-boss-label">BOSS</div>}
            {score && <div className="wm-node-score">{"⭐".repeat(score)}</div>}
            <div className={`wm-node-due${isOverdue ? " overdue" : ""}${isDueSoon ? " soon" : ""}`}>
                {status === "cleared" ? node.title : (isOverdue ? `⚠️ OVERDUE` : `${formatDate(node.dueDate)}`)}
            </div>
        </div>
    );
});

export default MapNode;
