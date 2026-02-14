import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { messages, system_prompt } = await req.json();

        // Use GEMINI_API_KEY from Supabase Edge Function Secrets
        const apiKey = Deno.env.get('GEMINI_API_KEY');

        if (!apiKey) {
            throw new Error('Missing GEMINI_API_KEY in environment variables');
        }

        // 2. Convert Message Format: (OpenAI/Claude Style) -> (Gemini Style)
        const contents = messages.map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
        }));

        // 3. Prepare System Instruction
        let systemInstruction = undefined;
        if (system_prompt) {
            systemInstruction = { parts: [{ text: system_prompt }] };
        }

        // 4. Call Gemini API (1.5-flash for speed, 1.5-pro for intelligence)
        const model = "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: systemInstruction,
                generationConfig: {
                    maxOutputTokens: 2000,
                    temperature: 0.7,
                }
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error: ${errText}`);
        }

        const data = await response.json();

        // 5. Extract text from Gemini response
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // 6. Adapter Pattern: Convert Gemini response to Claude format
        // Frontend expects: data.content[0].text
        const adaptedResponse = {
            id: "gemini-proxy",
            type: "message",
            role: "assistant",
            content: [
                { type: "text", text: generatedText }
            ]
        };

        return new Response(JSON.stringify(adaptedResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Proxy Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
