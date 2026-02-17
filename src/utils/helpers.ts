/// <reference types="vite/client" />
import { supabase } from './supabaseClient';

export interface Message {
    role: string;
    content: string;
}

export function load(key: string): any {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Error loading " + key, e);
        return null;
    }
}

export function save(key: string, value: any): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error("Error saving " + key, e);
    }
}

const API_KEYS = {
    claude: () => {
        try { return JSON.parse(localStorage.getItem("nx-settings") || "{}").claudeKey || ""; }
        catch { return ""; }
    },
    openai: () => {
        try { return JSON.parse(localStorage.getItem("nx-settings") || "{}").openaiKey || ""; }
        catch { return ""; }
    },
    gemini: () => {
        try { return JSON.parse(localStorage.getItem("nx-settings") || "{}").geminiKey || ""; }
        catch { return ""; }
    },
};

const MODELS = {
    claude: "claude-sonnet-4-5-20250929",
    openai: "gpt-4o",
    gemini: "gemini-3-flash-preview",
};

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // ms

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
    try {
        const res = await fetch(url, options);
        if (res.ok) return res;

        // Retry on 429 (Too Many Requests) or 5xx (Server Error)
        if ((res.status === 429 || res.status >= 500) && retries > 0) {
            console.warn(`API Error ${res.status}. Retrying in ${RETRY_DELAY}ms... (${retries} left)`);
            await new Promise(r => setTimeout(r, RETRY_DELAY));
            return fetchWithRetry(url, options, retries - 1);
        }

        return res;
    } catch (e) {
        if (retries > 0) {
            console.warn(`Network Error. Retrying in ${RETRY_DELAY}ms... (${retries} left)`, e);
            await new Promise(r => setTimeout(r, RETRY_DELAY));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw e;
    }
}

export async function ai(messages: Message[], system: string = "", provider: string | null = null): Promise<string> {
    const isProd = import.meta.env.PROD;

    // Determine model: explicit provider > localStorage > default "claude"
    const model = provider || (() => {
        try { return localStorage.getItem("nx-ai-model") || "claude"; }
        catch { return "claude"; }
    })();

    // Production check skipped as per previous logic, but structured for future security if needed.

    // Use User's Logic (Client-Side / BYOK)
    const key = API_KEYS[model as keyof typeof API_KEYS]?.();
    if (!key) {
        if (messages.length > 0 && messages[messages.length - 1].content.includes("JSON")) {
            return JSON.stringify({ error: "No API Key" });
        }
        throw new Error(`No API key for ${model}. Please add it in Settings.`);
    }

    try {
        // ── Claude ────────────────────────────────────────────────
        if (model === "claude") {
            const res = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                    "dangerously-allow-browser": "true"
                },
                body: JSON.stringify({
                    model: MODELS.claude,
                    max_tokens: 2048,
                    system,
                    messages,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                // Check for credit balance error specifically
                if (err?.error?.type === "overloaded_error") throw new Error("Claude is overloaded. Please try again.");
                if (res.status === 401) throw new Error("Invalid Claude API Key.");
                throw new Error(err?.error?.message || `Claude error ${res.status}`);
            }
            const data = await res.json();
            return data.content?.[0]?.text || "";
        }

        // ── OpenAI ────────────────────────────────────────────────
        if (model === "openai") {
            const msgs = system
                ? [{ role: "system", content: system }, ...messages]
                : messages;
            const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: MODELS.openai,
                    max_tokens: 2048,
                    messages: msgs,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (res.status === 401) throw new Error("Invalid OpenAI API Key.");
                if (res.status === 429) throw new Error("OpenAI Rate Limit / Quota Exceeded.");
                throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
            }
            const data = await res.json();
            return data.choices?.[0]?.message?.content || "";
        }

        // ── Gemini ────────────────────────────────────────────────
        if (model === "gemini") {
            const contents = messages.map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }));
            if (system) {
                contents.unshift({ role: "user", parts: [{ text: system }] } as any);
            }
            const res = await fetchWithRetry(
                `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${key}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents }),
                }
            );

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (res.status === 400 && err?.error?.message?.includes("API key")) throw new Error("Invalid Gemini API Key.");
                throw new Error(err?.error?.message || `Gemini error ${res.status}`);
            }
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }

        throw new Error(`Unknown provider: ${model}`);

    } catch (e: any) {
        // Normalize error message
        console.error("AI Helper Error:", e);
        if (e.message.includes("Failed to fetch")) {
            throw new Error("Network error. Please check your connection.");
        }
        throw e;
    }
}

export const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const formatTime = (timeStr: string): string => {
    if (!timeStr || !timeStr.includes(':')) return '';
    const [h, m] = timeStr.split(':');
    const hours = parseInt(h);
    const mins = parseInt(m);
    if (isNaN(hours) || isNaN(mins)) return '';
    const d = new Date(); d.setHours(hours); d.setMinutes(mins);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
