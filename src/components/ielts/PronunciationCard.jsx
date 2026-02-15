import React, { useState } from 'react';

export default function PronunciationCard({ issue }) {
    const [playing, setPlaying] = useState(false);

    const playIPA = () => {
        if (!window.speechSynthesis) return;
        setPlaying(true);
        const utt = new SpeechSynthesisUtterance(issue.word);
        utt.lang = "en-US";
        utt.rate = 0.7;
        utt.onend = () => setPlaying(false);
        window.speechSynthesis.speak(utt);
    };

    // severity colour
    const col = issue.severity === "high" ? "var(--rose)"
        : issue.severity === "medium" ? "#fb923c"
            : "var(--gold)";

    return (
        <div className="pron-card" style={{ borderLeft: `3px solid ${col}` }}>
            <div>
                <div className="pron-header">
                    <span className="pron-word" style={{ color: col }}>
                        {issue.word}
                    </span>
                    <span className="pron-ipa">
                        {issue.ipa}
                    </span>
                    {issue.severity && (
                        <span className="pron-severity" style={{ background: `${col}18`, color: col }}>
                            {issue.severity}
                        </span>
                    )}
                </div>
                {issue.heard && (
                    <div className="pron-heard">
                        Heard: <span className="pron-heard-val">
                            /{issue.heard}/
                        </span>
                        {" → "}
                        <span className="pron-ipa">
                            {issue.ipa}
                        </span>
                    </div>
                )}
                <div className="pron-tip">{issue.tip}</div>
                {issue.example && (
                    <div className="pron-example">
                        e.g. "{issue.example}"
                    </div>
                )}
            </div>
            <button onClick={playIPA} title="Listen to correct pronunciation"
                className={`pron-play-btn ${playing ? 'playing' : ''}`}>
                {playing ? "⏸" : "▶"}
            </button>
        </div>
    );
}
