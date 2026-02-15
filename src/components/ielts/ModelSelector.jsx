import React, { useState, useRef, useEffect } from 'react';
import { useAIModel, AI_MODELS } from '../../hooks/useAIModel';

export default function ModelSelector({ compact = false }) {
    const [model, setModel] = useAIModel();
    const [open, setOpen] = useState(false);
    const current = AI_MODELS.find(m => m.id === model) || AI_MODELS[0];
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    return (
        <div ref={ref} className="model-selector">
            <button onClick={() => setOpen(o => !o)}
                className={`model-btn ${compact ? 'compact' : ''}`}
                style={{
                    background: `${current.color}18`,
                    border: `1px solid ${current.color}40`,
                    color: current.color
                }}>
                {current.em} {current.label}
                {!compact && <span className="model-arrow" style={{ color: `${current.color}aa` }}>▾</span>}
            </button>
            {open && (
                <div className="model-dropdown">
                    <div className="model-dd-header">
                        AI Model
                    </div>
                    {AI_MODELS.map(m => (
                        <button key={m.id} onClick={() => { setModel(m.id); setOpen(false); }}
                            className={`model-opt ${model === m.id ? 'active' : ''}`}
                            style={{
                                background: model === m.id ? `${m.color}14` : "transparent",
                                borderLeft: model === m.id ? `3px solid ${m.color}` : "3px solid transparent",
                            }}>
                            <span className="model-opt-em">{m.em}</span>
                            <div className="model-opt-info">
                                <div className="model-opt-label" style={{ color: model === m.id ? m.color : "var(--t1)" }}>
                                    {m.label}
                                </div>
                                <div className="model-opt-sub">{m.sub}</div>
                            </div>
                            {model === m.id && <span className="model-check" style={{ color: m.color }}>✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
