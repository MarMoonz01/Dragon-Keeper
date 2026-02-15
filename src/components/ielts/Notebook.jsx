import React, { useState } from 'react';
import { ai } from '../../utils/helpers';
import Loader from '../Loader';

export default function Notebook({ notebook, setNotebook, addToNotebook, fetchNotebook, supabase }) {
    const [nbTab, setNbTab] = useState("vocab");
    const [filterTopic, setFilterTopic] = useState("All");
    const [genNb, setGenNb] = useState(false);
    const [nbInput, setNbInput] = useState("");
    const [genVocab, setGenVocab] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState("Technology");

    // Extract unique topics from notebook for filter
    const uniqueTopics = ["All", ...new Set(notebook.filter(n => n.topic_tag).map(n => n.topic_tag))];

    const generateKnowledge = async () => {
        if (!nbInput.trim()) return;
        setGenNb(true);
        let prompt = "";
        let sys = "You are an expert language tutor.";

        if (nbTab === "vocab") {
            prompt = `Analyze the word/phrase: "${nbInput}".\nRespond in this EXACT format:\nWORD: ${nbInput}\nPHONETIC: [IPA]\nTYPE: [part of speech]\nDEF: [definition]\nEXAMPLE: [sentence]\nTOPIC: [One word topic e.g. Health/Tech/General]\nMASTERY: 1`;
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
                newItem = {
                    ...newItem,
                    word: get("WORD") || nbInput,
                    phonetic: get("PHONETIC"),
                    type: get("TYPE"),
                    def: get("DEF"),
                    example: get("EXAMPLE"),
                    topic_tag: get("TOPIC") || "General",
                    mastery: 1
                };
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

    const generateTopicPack = async () => {
        setGenVocab(true);
        const prompt = `Generate 5 advanced IELTS vocabulary words related to the topic "${selectedTopic}" (C1/C2 level).
        Respond in this EXACT format for each word (separated by '---'):
        WORD: [word]
        PHONETIC: [IPA]
        TYPE: [noun/verb/adj/etc.]
        DEF: [short definition]
        EXAMPLE: [sentence regarding ${selectedTopic}]
        TOPIC: ${selectedTopic}
        MASTERY: 1`;

        try {
            const r = await ai([{ role: "user", content: prompt }], "You are an IELTS expert tutor.");

            const newWords = r.split("---").map(chunk => {
                const get = k => { const m = chunk.match(new RegExp(k + ":\\s*(.+)")); return m ? m[1].trim() : ""; };
                if (!get("WORD")) return null;
                return {
                    word: get("WORD"),
                    phonetic: get("PHONETIC"),
                    type: get("TYPE"),
                    def: get("DEF"),
                    example: get("EXAMPLE"),
                    topic_tag: get("TOPIC") || selectedTopic,
                    mastery: 1,
                    category: 'vocab',
                    created_at: new Date().toISOString()
                };
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
        } catch (e) {
            console.error(e);
        }
        setGenVocab(false);
    };

    const filtered = notebook.filter(i => {
        if (filterTopic !== "All" && i.topic_tag !== filterTopic) return false;
        return i.category === nbTab;
    });

    return (
        <div>
            {/* Controls Tab */}
            <div className="card" style={{ marginBottom: 16, background: "var(--card2)", border: "1px solid var(--teal)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                        {["vocab", "conv", "grammar"].map(t => (
                            <button key={t} onClick={() => setNbTab(t)} style={{
                                padding: "6px 12px", borderRadius: 20, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                                background: nbTab === t ? "var(--teal)" : "rgba(255,255,255,0.05)",
                                color: nbTab === t ? "#000" : "var(--t2)",
                                textTransform: "uppercase"
                            }}>
                                {t}
                            </button>
                        ))}
                    </div>

                    {nbTab === "vocab" && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <select className="inp" style={{ width: 120, margin: 0, height: 28, fontSize: 11, padding: "0 8px" }} value={filterTopic} onChange={e => setFilterTopic(e.target.value)}>
                                {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span style={{ fontSize: 11, color: "var(--t2)" }}>Filter</span>
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        className="inp"
                        placeholder={nbTab === "vocab" ? "Enter word..." : nbTab === "conv" ? "Enter topic..." : "Enter grammar rule..."}
                        value={nbInput}
                        onChange={e => setNbInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && generateKnowledge()}
                        style={{ flex: 1 }}
                    />
                    <button className="btn btn-g" onClick={generateKnowledge} disabled={genNb || !nbInput.trim()}>
                        {genNb ? "✨..." : "✨ Add"}
                    </button>
                </div>

                {nbTab === "vocab" && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700 }}>🎁 Topic Pack:</span>
                        <select className="inp" style={{ width: 110, margin: 0, height: 26, fontSize: 11 }} value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
                            {["Technology", "Environment", "Health", "Education", "Society", "Crime", "Art", "Work"].map(t => <option key={t}>{t}</option>)}
                        </select>
                        <button className="btn btn-gh btn-sm" onClick={generateTopicPack} disabled={genVocab}>
                            {genVocab ? "Generating..." : "Generate 5 Words"}
                        </button>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="g2">
                {filtered.map((v, i) => (
                    <div key={i} className="vc" style={{ cursor: "default" }}>
                        {v.category === "vocab" && (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <div className="vw">{v.word}</div>
                                    {v.topic_tag && <span className="cat-badge" style={{ background: "rgba(255,255,255,0.1)", color: "var(--t2)", fontSize: 9 }}>{v.topic_tag}</span>}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--t2)", marginBottom: 6 }}>
                                    <div className="vph" style={{ margin: 0 }}>{v.phonetic}</div>
                                    <div className="vt" style={{ margin: 0 }}>{v.type}</div>
                                </div>
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
                    No items found for this filter.
                </div>
            )}
        </div>
    );
}
