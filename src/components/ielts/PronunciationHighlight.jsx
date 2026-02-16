import React from 'react';

export default function PronunciationHighlight({ transcript, issues }) {
    if (!transcript || !issues?.length) return (
        <div className="pron-text-raw">{transcript}</div>
    );
    const words = transcript.split(/\s+/);
    return (
        <div className="pron-text-highlight">
            {words.map((word, i) => {
                const clean = word.toLowerCase().replace(/[^a-z]/g, "");
                const issue = issues.find(iss =>
                    iss.word?.toLowerCase().replace(/[^a-z]/g, "") === clean);
                return (
                    <React.Fragment key={i}>
                        {issue ? (
                            <span title={`${issue?.ipa || ""} — ${issue.tip}`} className="pron-issue">
                                {word}
                                <span className="pron-warn">⚠</span>
                            </span>
                        ) : (
                            <span className="pron-ok">{word}</span>
                        )}{" "}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
