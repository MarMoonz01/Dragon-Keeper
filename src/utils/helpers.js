import { supabase } from './supabaseClient';

export function load(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Error loading " + key, e);
        return null;
    }
}

export function save(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error("Error saving " + key, e);
    }
}

export async function ai(messages, system) {
    const isProd = import.meta.env.PROD;

    // 1. Production: Enforce Supabase Edge Function (Secure)
    // Keys are hidden on server. Client does not need to provide them.
    if (isProd) {
        if (!supabase) throw new Error("Supabase client not initialized.");

        try {
            const { data, error } = await supabase.functions.invoke('ai-proxy', {
                body: { messages, system_prompt: system }
            });

            if (error) throw error;
            if (data?.content?.[0]?.text) return data.content[0].text;
            throw new Error("No content returned from AI Proxy.");

        } catch (e) {
            console.error("Secure AI Proxy Failed:", e);
            return "Error: Unable to connect to Secure AI Service. Please check your connection.";
        }
    }

    // 2. Development: Try Proxy first, then Fallback to Local Keys (BYOK)
    if (supabase) {
        try {
            const { data, error } = await supabase.functions.invoke('ai-proxy', {
                body: { messages, system_prompt: system }
            });
            if (!error && data?.content?.[0]?.text) {
                return data.content[0].text;
            }
        } catch (e) {
            console.warn("Dev: Edge Function failed, falling back to local keys:", e);
        }
    }

    // --- LOCAL DEVELOPMENT FALLBACKS (Client-Side Keys) ---
    const settings = load("nx-settings");
    const provider = settings?.provider || "claude";

    // Key Selection Logic
    let apiKey = "";
    if (provider === "gemini") apiKey = settings?.geminiKey;
    else if (provider === "claude") apiKey = settings?.claudeKey || settings?.apiKey;

    if (!apiKey) {
        const lastMsg = messages[messages.length - 1]?.content || "";
        if (lastMsg.includes("JSON")) {
            return JSON.stringify([{ id: 1, name: "Set API Key in Settings", cat: "work", xp: 10, time: "09:00", done: false, hp: 10 }]);
        }
        return "Dev Mode: Please set your API Key in Settings to use Nexus AI features.";
    }

    // --- GOOGLE GEMINI 3 FLASH PREVIEW ---
    if (provider === "gemini") {
        try {
            const contents = messages.map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }]
            }));

            const modelId = "gemini-3-flash-preview";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

            const payload = {
                contents,
                generationConfig: { maxOutputTokens: 2000 }
            };

            if (system) {
                payload.systemInstruction = { parts: [{ text: system }] };
            }

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Gemini API Error: ${errText}`);
            }

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return text || "No content returned from Gemini.";

        } catch (e) {
            console.error("Gemini Request Failed:", e);
            return `Error: ${e.message}`;
        }
    }

    // --- ANTHROPIC CLAUDE IMPLEMENTATION ---
    if (provider === "claude" || !provider) {
        try {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                    "dangerously-allow-browser": "true"
                },
                body: JSON.stringify({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 1500,
                    system: system,
                    messages: messages
                })
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Claude API Error: ${err}`);
            }

            const data = await res.json();
            return data.content[0].text;
        } catch (e) {
            console.error("Claude Call Failed:", e);
            throw e;
        }
    }
}

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    const d = new Date(); d.setHours(h); d.setMinutes(m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
