import React, { useState } from 'react';
import { ai } from '../../utils/helpers';

export default function Notebook({ notebook, setNotebook, addToNotebook, fetchNotebook, supabase }) {
    const [nbTab, setNbTab] = useState("vocab");
    const [genNb, setGenNb] = useState(false);
    const [nbInput, setNbInput] = useState("");
    const [genVocab, setGenVocab] = useState(false);

    const generateKnowledge = async () => {
        if (!nbInput.trim()) return;
        setGenNb(true);
        let prompt = "";
        let sys = "You are an expert language tutor.";

        if (nbTab === "vocab") {
            prompt = `Analyze the word/phrase: "${nbInput}".\nRespond in this EXACT format:\nWORD: ${nbInput}\nPHONETIC: [IPA]\nTYPE: [part of speech]\nDEF: [definition]\nEXAMPLE: [sentence]\nMASTERY: 1`;
        } else if (nbTab === "conv") {
            prompt = `Create a short conversation usage for: "${nbInput}".\nRespond in this EXACT format:\nTOPIC: ${nbInput}\nCONTEXT: [situation]\nA: [Speaker A line]\nB: [Speaker B line]\nNUANCE: [explanation of usage/tone]`;
        } else {
            prompt = `Explain the grammar rule/concept: "${nbInput}".\nRespond in this EXACT format:\nRULE: ${nbInput}\nEXPLAIN: [simple explanation]\nSTRUCTURE: [formula/pattern]\nEXAMPLE: [correct sentence]\nINCORRECT: [common mistake]`;
        }

        try {
            const r = await ai([{ role: "user", content: prompt }], sys);
            const get = k => { const m = r.match(new RegExp(k + ":\\s*(.+)")); return m ? m[1].trim() : ""; };

            let newItem = { category: nbTab, created_at: new Date().toISOString(), original: nbInput };

            if (nbTab === "vocab") {
                newItem = { ...newItem, word: get("WORD") || nbInput, phonetic: get("PHONETIC"), type: get("TYPE"), def: get("DEF"), example: get("EXAMPLE"), mastery: 1 };
            } else if (nbTab === "conv") {
                newItem = { ...newItem, topic: get("TOPIC"), context: get("CONTEXT"), a: get("A"), b: get("B"), nuance: get("NUANCE") };
            } else {
                newItem = { ...newItem, rule: get("RULE"), explain: get("EXPLAIN"), structure: get("STRUCTURE"), example: get("EXAMPLE"), incorrect: get("INCORRECT") };
            }

            addToNotebook(newItem);
            setNbInput("");
        } catch (e) {
            console.error(e);
        }
        setGenNb(false);
    };

    const generateDailyVocab = async () => {
        setGenVocab(true);
        const r = await ai([{ role: "user", content: "Generate 5 advanced IELTS vocabulary words (C1/C2 level) that are useful for high-scoring essays/speaking.\n\nRespond in this EXACT format for each word (separated by '---'):\nWORD: [word]\nPHONETIC: [IPA]\nTYPE: [noun/verb/adj/etc.]\nDEF: [short definition]\nEXAMPLE: [sentence using the word]\nMASTERY: 1" }],
            "You are an IELTS expert tutor.");

        const newWords = r.split("---").map(chunk => {
            const get = k => { const m = chunk.match(new RegExp(k + ":\\s*(.+)")); return m ? m[1].trim() : ""; };
            if (!get("WORD")) return null;
            return { word: get("WORD"), phonetic: get("PHONETIC"), type: get("TYPE"), def: get("DEF"), example: get("EXAMPLE"), mastery: 1, category: 'vocab', created_at: new Date().toISOString() };
        }).filter(w => w);

        if (newWords.length > 0) {
            if (supabase) {
                const { error } = await supabase.from('notebook').insert(newWords);
                if (error) console.error("Error saving batch notebook:", error);
                else fetchNotebook();
            } else {
                setNotebook(prev => [...newWords, ...prev]);
            }
        }
        setGenVocab(false);
    };

    const filtered = notebook.filter(i => i.category === nbTab);

    return (
        <div>
            <div className="card" style={{ marginBottom: 16, background: "var(--card2)", border: "1px solid var(--teal)" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    {["vocab", "conv", "grammar"].map(t => (
                        <button key={t} onClick={() => setNbTab(t)} style={{
                            padding: "6px 12px", borderRadius: 20, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                            background: nbTab === t ? "var(--teal)" : "rgba(255,255,255,0.05)",
                            color: nbTab === t ? "#000" : "var(--t2)"
                        }}>
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        className="inp"
                        placeholder={nbTab === "vocab" ? "Enter word (e.g. Serendipity)..." : nbTab === "conv" ? "Enter topic (e.g. Checking into hotel)..." : "Enter grammar rule (e.g. Past Perfect)..."}
                        value={nbInput}
                        onChange={e => setNbInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && generateKnowledge()}
                    />
                    <button className="btn btn-g" onClick={generateKnowledge} disabled={genNb || !nbInput.trim()}>
                        {genNb ? "✨ Magic..." : "✨ Add + AI Explain"}
                    </button>
                    {nbTab === "vocab" && (
                        <button className="btn btn-gh" onClick={generateDailyVocab} disabled={genVocab}>
                            {genVocab ? "..." : "📅 Daily 3"}
                        </button>
                    )}
                </div>
            </div>

            <div className="g2">
                {filtered.map((v, i) => (
                    <div key={i} className="vc" style={{ cursor: "default" }}>
                        {v.category === "vocab" && (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div className="vw">{v.word}</div>
                                    <div className="vph">{v.phonetic}</div>
                                </div>
                                <div className="vt">{v.type}</div>
                                <div className="vd">{v.def}</div>
                                <div className="ve">"{v.example}"</div>
                            </>
                        )}
                        {v.category === "conv" && (
                            <>
                                <div className="vw" style={{ fontSize: 13 }}>💬 {v.topic}</div>
                                <div style={{ fontSize: 10, color: "var(--t2)", marginBottom: 8 }}>{v.context}</div>
                                <div style={{ background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6, marginBottom: 6 }}>
                                    <div style={{ fontSize: 11, color: "var(--teal)" }}>A: {v.a}</div>
                                    <div style={{ fontSize: 11, color: "var(--gold)" }}>B: {v.b}</div>
                                </div>
                                <div style={{ fontSize: 10, fontStyle: "italic", color: "var(--t2)" }}>💡 {v.nuance}</div>
                            </>
                        )}
                        {v.category === "grammar" && (
                            <>
                                <div className="vw" style={{ fontSize: 14 }}>📐 {v.rule}</div>
                                <div className="vd" style={{ marginBottom: 6 }}>{v.explain}</div>
                                <div style={{ fontFamily: "monospace", fontSize: 10, background: "rgba(167,139,250,0.1)", color: "var(--violet)", padding: 4, borderRadius: 4, marginBottom: 6 }}>{v.structure}</div>
                                <div className="ve">✅ {v.example}</div>
                                <div className="ve" style={{ borderLeftColor: "var(--rose)", color: "var(--rose)" }}>❌ {v.incorrect}</div>
                            </>
                        )}
                    </div>
                ))}
            </div>
            {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "var(--t2)", fontSize: 12 }}>
                    No items yet. Try adding one above!
                </div>
            )}
        </div>
    );
}
