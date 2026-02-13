export const load = async (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
export const save = async (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };

export async function ai(messages, sys) {
    try {
        const settings = await load("nx-settings") || {};
        const provider = settings.provider || "claude";
        const key = settings[provider + "Key"];

        if (!key && provider !== "claude") throw new Error("Missing API Key"); // Claude might have a hardcoded proxy in original code, but here we enforce key for others.

        if (provider === "openai") {
            const r = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "system", content: sys || "You are a helpful assistant." }, ...messages]
                })
            });
            const d = await r.json();
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
            const d = await r.json();
            return d.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
        }

        // Default: Claude (Anthropic)
        const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST", headers: {
                "Content-Type": "application/json",
                "x-api-key": key, // User provided key
                "anthropic-version": "2023-06-01"
                // Removed dangerous-allow-browser header per security best practice.
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20240620", max_tokens: 1000,
                system: sys || "You are NEXUS, an elite AI life coach and IELTS expert. Be concise and actionable.",
                messages
            })
        });
        const d = await r.json();
        return d.content?.map(c => c.text || "").join("") || "No response.";

    } catch (e) {
        console.error(e);
        return "⚠️ AI Error: " + (e.message || "Check settings & API Key.");
    }
}
