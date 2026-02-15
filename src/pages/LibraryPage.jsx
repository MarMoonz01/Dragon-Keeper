import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Vite-specific worker import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { ai, save, load } from '../utils/helpers';
import Loader from '../components/Loader';

// Initialize worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function LibraryPage() {
    const [files, setFiles] = useState([]);
    const [activeDoc, setActiveDoc] = useState(null);
    const [extracting, setExtracting] = useState(false);
    const [chat, setChat] = useState([]);
    const [input, setInput] = useState("");
    const [aiThinking, setAiThinking] = useState(false);

    // Load persisted files from localStorage on mount
    useEffect(() => {
        const saved = load('nx-library');
        if (saved && saved.length > 0) {
            setFiles(saved.map(f => ({ ...f, url: null }))); // Blob URLs don't persist
        }
    }, []);

    // Cleanup: revoke Blob URLs on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            files.forEach(f => { if (f.url) URL.revokeObjectURL(f.url); });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save files to localStorage whenever they change (debounced via effect)
    const persistFiles = (newFiles) => {
        const toSave = newFiles.map(f => ({
            id: f.id,
            name: f.name,
            date: f.date,
            size: f.size,
            text: (f.text || "").substring(0, 50000), // Cap at 50KB per doc
            summary: f.summary || ""
        }));
        save('nx-library', toSave);
    };

    const handleUpload = async (e) => {
        const uploaded = Array.from(e.target.files).filter(f => f.type === "application/pdf");
        if (uploaded.length === 0) return;

        setExtracting(true);
        const newFiles = [];

        for (const file of uploaded) {
            try {
                // 1. Create Blob URL for viewing
                const url = URL.createObjectURL(file);

                // 2. Extract Text for AI
                const text = await extractText(file);

                newFiles.push({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    date: new Date().toLocaleDateString(),
                    size: (file.size / 1024 / 1024).toFixed(2) + " MB",
                    url: url,
                    text: text, // Store extracted text in memory
                    summary: "" // To be generated
                });
            } catch (err) {
                console.error("PDF Parse Error:", err);
                alert("Failed to read " + file.name);
            }
        }
        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        persistFiles(updatedFiles);
        setExtracting(false);
    };

    const extractText = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";
        // Limit to first 20 pages for performance/token limits? Or read all?
        // Let's read up to 15 pages for now to be safe with AI context.
        const maxPages = Math.min(pdf.numPages, 15);

        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(" ");
            fullText += `[Page ${i}] ${pageText}\n`;
        }
        if (pdf.numPages > 15) fullText += "\n[...Truncated for AI context...]";
        return fullText;
    };

    const openDoc = (doc) => {
        setActiveDoc(doc);
        setChat([{ role: "ai", content: `I've read **${doc.name}**. Ask me anything about it!` }]);
    };

    const closeDoc = () => {
        setActiveDoc(null);
        setChat([]);
    };

    const sendChat = async () => {
        if (!input.trim() || !activeDoc) return;

        const userMsg = input;
        setChat(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setAiThinking(true);

        try {
            // Construct Prompt
            // Truncate text context if too long (approx 20k chars?)
            const context = activeDoc.text.substring(0, 25000);

            const prompt = `You are a helpful research assistant. 
Document Content:
"""
${context}
"""

User Question: ${userMsg}

Answer based ONLY on the document provided. Keep it concise.`;

            const res = await ai([{ role: "user", content: prompt }]);
            setChat(prev => [...prev, { role: "ai", content: res }]);
        } catch (e) {
            setChat(prev => [...prev, { role: "ai", content: "Error analyzing document." }]);
        }
        setAiThinking(false);
    };

    return (
        <div className="h-full flex flex-col relative" style={{ height: "100vh", overflow: "hidden" }}>
            {/* Header */}
            <div className="ph" style={{ flexShrink: 0 }}>
                <div className="ph-title">The Archives</div>
                <div className="ph-sub">Knowledge Repository · AI Analysis</div>
            </div>

            {/* Content */}
            {!activeDoc ? (
                <div className="gm" style={{ padding: 24, overflowY: "auto", height: "100%" }}>
                    {/* Upload Area */}
                    <div className="card" style={{ border: "2px dashed var(--bdr)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, cursor: "pointer", marginBottom: 24 }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Drag & Drop PDFs here</div>
                        <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 16 }}>or click to browse</div>
                        <input type="file" accept=".pdf" multiple onChange={handleUpload} style={{ position: "absolute", opacity: 0, inset: 0, cursor: extracting ? "not-allowed" : "pointer", pointerEvents: extracting ? "none" : "auto" }} disabled={extracting} />
                        {extracting && <Loader text="Reading scrolls..." />}
                    </div>

                    {/* Grid */}
                    <div className="g4">
                        {files.map(f => (
                            <div key={f.id} className="card" style={{ cursor: "pointer", transition: "transform .2s" }} onClick={() => openDoc(f)} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                                <div style={{ height: 100, background: "var(--card2)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, marginBottom: 12 }}>
                                    <div style={{ fontSize: 40 }}>📄</div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                                <div style={{ fontSize: 10, color: "var(--t3)", display: "flex", justifyContent: "space-between" }}>
                                    <span>{f.date}</span>
                                    <span>{f.size}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {files.length === 0 && !extracting && (
                        <div style={{ textAlign: "center", color: "var(--t3)", marginTop: 40 }}>
                            The shelves are empty. Upload a PDF to begin.
                        </div>
                    )}
                </div>
            ) : (
                /* Reader Mode */
                <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
                    {/* PDF Viewer */}
                    <div style={{ flex: 1, background: "#000", position: "relative" }}>
                        {activeDoc.url ? (
                            <iframe src={activeDoc.url} style={{ width: "100%", height: "100%", border: "none" }} title="PDF Viewer" />
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12, color: "var(--t2)" }}>
                                <div style={{ fontSize: 40 }}>📄</div>
                                <div style={{ fontWeight: 700 }}>{activeDoc.name}</div>
                                <div style={{ fontSize: 12 }}>Re-upload PDF to view. AI chat is still available →</div>
                            </div>
                        )}
                        <button className="btn btn-gh" style={{ position: "absolute", top: 16, left: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff", zIndex: 10 }} onClick={closeDoc}>
                            ← Back
                        </button>
                    </div>

                    {/* AI Sidebar */}
                    <div style={{ width: 350, background: "var(--card)", borderLeft: "1px solid var(--bdr)", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: 16, borderBottom: "1px solid var(--bdr)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                            <span>🤖 AI Analyst</span>
                        </div>

                        {/* Chat History */}
                        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                            {chat.map((msg, i) => (
                                <div key={i} style={{
                                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                    background: msg.role === "user" ? "var(--teal)" : "var(--card2)",
                                    color: msg.role === "user" ? "#000" : "var(--t1)",
                                    padding: "8px 12px",
                                    borderRadius: 12,
                                    maxWidth: "85%",
                                    fontSize: 12,
                                    lineHeight: 1.5
                                }}>
                                    {msg.content}
                                </div>
                            ))}
                            {aiThinking && (
                                <div style={{ alignSelf: "flex-start", color: "var(--t3)", fontSize: 11, fontStyle: "italic" }}>
                                    Reading...
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div style={{ padding: 16, borderTop: "1px solid var(--bdr)" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input
                                    className="inp"
                                    style={{ flex: 1 }}
                                    placeholder="Ask about this file..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && sendChat()}
                                />
                                <button className="btn btn-p" onClick={sendChat} disabled={aiThinking || !input.trim()}>
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
