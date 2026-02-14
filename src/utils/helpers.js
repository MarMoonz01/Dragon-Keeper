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
    // 1. Try Supabase Edge Function (Secure)
    // We assume 'supabase' is imported from './supabaseClient'
    if (supabase) {
        try {
            const { data, error } = await supabase.functions.invoke('ai-proxy', {
                body: { messages, system_prompt: system }
            });
            if (!error && data?.content?.[0]?.text) {
                return data.content[0].text;
            }
            if (error) console.warn("Edge Function error:", error);
        } catch (e) {
            console.warn("Edge Function failed, falling back to local key:", e);
        }
    }

    // 2. Fallback to Local Key (Legacy/Dev)
    const settings = load("nx-settings");
    const apiKey = settings?.apiKey;

    if (!apiKey) {
        // Mock response if no key
        console.warn("No API Key found. Returning mock response.");
        // Return a mock JSON string if the prompt likely expects JSON (task generation)
        const lastMsg = messages[messages.length - 1].content;
        if (lastMsg.includes("JSON")) {
            return JSON.stringify([{ id: 1, name: "Set API Key in Settings", cat: "work", xp: 10, time: "09:00", done: false, hp: 10 }]);
        }
        return "Please set your API Key in Settings to use Nexus AI features.";
    }

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
            throw new Error(`API Error: ${err}`);
        }

        const data = await res.json();
        return data.content[0].text;
    } catch (e) {
        console.error("AI Call Failed:", e);
        throw e;
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
