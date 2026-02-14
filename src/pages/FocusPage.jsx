import React, { useState, useEffect } from 'react';

export default function FocusPage({ task, onComplete, onExit }) {
    const DURATION = 25 * 60;
    const [timeLeft, setTimeLeft] = useState(DURATION);
    const [isActive, setIsActive] = useState(true);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        if (!task) {
            onExit();
            return;
        }
    }, [task, onExit]);

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsActive(false);
                    setFinished(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive]);

    const handleFinish = () => {
        onComplete(task.id);
        onExit();
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const liquidHeight = (timeLeft / DURATION) * 100;

    if (!task) return null;

    return (
        <div className="gm" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>

            {/* Coffee Animation */}
            <div style={{ position: "relative", width: 180, margin: "0 auto" }}>
                {isActive && (
                    <div className="coffee-steam" style={{ position: "absolute", top: -40, left: 30, display: "flex", gap: 8 }}>
                        <div className="steam-puff" style={{ animationDelay: "0s" }} />
                        <div className="steam-puff" style={{ animationDelay: "0.5s" }} />
                        <div className="steam-puff" style={{ animationDelay: "1s" }} />
                    </div>
                )}
                <div style={{
                    width: 140, height: 160,
                    border: "6px solid var(--t2)",
                    borderRadius: "0 0 50px 50px",
                    position: "relative",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.05)",
                    zIndex: 2,
                    margin: "0 auto"
                }}>
                    <div className="coffee-liquid" style={{
                        position: "absolute", bottom: 0, left: 0, width: "100%",
                        height: `${liquidHeight}%`,
                        background: "#6F4E37",
                        transition: "height 1s linear",
                        borderTop: "2px solid rgba(255,255,255,0.1)"
                    }} />
                </div>
                <div style={{
                    position: "absolute", top: 20, right: -10,
                    width: 40, height: 60,
                    border: "6px solid var(--t2)",
                    borderLeft: "none",
                    borderRadius: "0 20px 20px 0",
                    zIndex: 1
                }} />
            </div>

            {/* Timer */}
            <div style={{ fontSize: 80, fontWeight: 800, marginTop: 40, fontFamily: "'JetBrains Mono', monospace", color: timeLeft < 60 ? "var(--rose)" : "var(--t1)" }}>
                {formatTime(timeLeft)}
            </div>

            <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, color: "var(--t2)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Focusing on task</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--gold)" }}>{task.name}</div>
            </div>

            <div style={{ marginTop: 60 }}>
                {finished ? (
                    <button className="btn btn-p btn-lg" onClick={handleFinish} style={{ padding: "12px 32px", fontSize: 18 }}>
                        ☕ Task Complete!
                    </button>
                ) : (
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                        <button className="btn btn-gh" onClick={() => setIsActive(!isActive)} style={{ width: 120 }}>
                            {isActive ? "⏸ Pause" : "▶ Resume"}
                        </button>
                        <button className="btn btn-gh" onClick={onExit} style={{ color: "var(--rose)", width: 120 }}>
                            Quit
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
