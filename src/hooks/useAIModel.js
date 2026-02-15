import { useState, useEffect, useCallback } from 'react';

// Shared Model Selector Logic
// Reads/writes from localStorage("nx-ai-model") so ALL pages share the same choice
export function useAIModel() {
    const [model, setModelState] = useState(() => {
        try { return localStorage.getItem("nx-ai-model") || "claude"; }
        catch { return "claude"; }
    });

    const setModel = useCallback((m) => {
        setModelState(m);
        try { localStorage.setItem("nx-ai-model", m); } catch { }
        // Dispatch event so other components can react
        window.dispatchEvent(new CustomEvent("nx-model-change", { detail: m }));
    }, []);

    useEffect(() => {
        const handler = (e) => setModelState(e.detail);
        window.addEventListener("nx-model-change", handler);
        return () => window.removeEventListener("nx-model-change", handler);
    }, []);

    return [model, setModel];
}

export const AI_MODELS = [
    { id: "claude", label: "Claude", sub: "Sonnet", color: "#e8a25a", em: "🟠" },
    { id: "openai", label: "GPT-5.2", sub: "OpenAI", color: "#74c69d", em: "🟢" },
    { id: "gemini", label: "Gemini", sub: "3.0 Flash", color: "#74b4f7", em: "🔵" },
];
