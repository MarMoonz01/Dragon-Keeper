export const load = async (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
export const save = async (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };

export class AIError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AIError';
    }
}

export async function ai(messages, sys) {
    const settings = await load("nx-settings") || {};
    const provider = settings.provider || "claude";
    const key = settings[provider + "Key"];

    if (!key && provider !== "claude") throw new AIError("Missing API Key for " + provider);

    if (provider === "openai") {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: sys || "You are a helpful assistant." }, ...messages]
            })
        });
        if (!r.ok) throw new AIError("OpenAI API error: " + r.status);
        const d = await r.json();
        if (d.error) throw new AIError(d.error.message);
        return d.choices?.[0]?.message?.content || "No response.";
    }

    if (provider === "gemini") {
        const text = messages.map(m => m.content).join("\n\n");
        const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + key, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: (sys ? sys + "\n\n" : "") + text }] }]
            })
        });
        if (!r.ok) throw new AIError("Gemini API error: " + r.status);
        const d = await r.json();
        if (d.error) throw new AIError(d.error.message);
        return d.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    }

    // Default: Claude (Anthropic)
    const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: {
            "Content-Type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514", max_tokens: 1000,
            system: sys || "You are NEXUS, an elite AI life coach and IELTS expert. Be concise and actionable.",
            messages
        })
    });
    if (!r.ok) {
        const errBody = await r.text().catch(() => "");
        throw new AIError("Claude API error " + r.status + (errBody ? ": " + errBody.slice(0, 100) : ""));
    }
    const d = await r.json();
    if (d.error) throw new AIError(d.error.message);
    return d.content?.map(c => c.text || "").join("") || "No response.";
}
