import React, { useState } from 'react';

export default function FlashcardDeck({ notebook, setNotebook, fetchNotebook, supabase }) {
    const [fcIdx, setFcIdx] = useState(0);
    const [fcFlip, setFcFlip] = useState(false);

    // SRS intervals: mastery → days until next review
    const SRS_INTERVALS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
    const now = new Date();

    const vocabCards = notebook
        .filter(i => i.category === 'vocab')
        .map(c => {
            const nextReview = c.next_review_at ? new Date(c.next_review_at) : new Date(0);
            const isDue = nextReview <= now;
            return { ...c, isDue, nextReview };
        })
        .sort((a, b) => {
            if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;
            if ((a.mastery || 1) !== (b.mastery || 1)) return (a.mastery || 1) - (b.mastery || 1);
            return a.nextReview - b.nextReview;
        });

    const dueCount = vocabCards.filter(c => c.isDue).length;
    const safeIdx = Math.min(fcIdx, Math.max(0, vocabCards.length - 1));
    const currentCard = vocabCards[safeIdx];

    const updateMastery = async (card, delta) => {
        const newMastery = Math.max(1, Math.min(5, (card.mastery || 1) + delta));
        const intervalDays = SRS_INTERVALS[newMastery] || 0;
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);
        nextReviewAt.setHours(4, 0, 0, 0);

        if (supabase && card.id) {
            await supabase.from('notebook').update({
                mastery: newMastery,
                last_reviewed: new Date().toISOString(),
                next_review_at: nextReviewAt.toISOString()
            }).eq('id', card.id);
            fetchNotebook();
        } else {
            setNotebook(prev => prev.map(n => n.id === card.id ? { ...n, mastery: newMastery, next_review_at: nextReviewAt.toISOString() } : n));
        }
    };

    if (vocabCards.length === 0) {
        return (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>No Flashcards Yet</div>
                <div style={{ fontSize: 12, color: "var(--t2)" }}>Head to the <strong>Notebook</strong> tab and add some vocabulary first!</div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: "var(--t2)" }}>Card {safeIdx + 1} of {vocabCards.length} · Tap to reveal</span>
                {dueCount > 0 && <span style={{ fontSize: 10, color: "var(--teal)", marginLeft: 8, fontWeight: 700 }}>📬 {dueCount} due today</span>}
                {currentCard && <span style={{ fontSize: 10, color: "var(--t3)", marginLeft: 8 }}>Mastery: {"⭐".repeat(currentCard.mastery || 1)}{"☆".repeat(5 - (currentCard.mastery || 1))}</span>}
                {currentCard && !currentCard.isDue && <span style={{ fontSize: 9, color: "var(--t3)", marginLeft: 6 }}>(not due yet)</span>}
            </div>
            <div className="fc" onClick={() => setFcFlip(f => !f)}>
                {!fcFlip ? (
                    <>
                        <div className="fcw">{currentCard?.word}</div>
                        <div className="fcp">{currentCard?.phonetic}</div>
                        <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 14 }}>Tap to reveal ↓</div>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: 11, color: "var(--violet)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{currentCard?.type}</div>
                        <div style={{ fontSize: 15, color: "var(--t1)", fontWeight: 700, marginBottom: 8 }}>{currentCard?.def}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontStyle: "italic", borderLeft: "2px solid var(--violet)", paddingLeft: 10 }}>"{currentCard?.example}"</div>
                    </>
                )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
                <button className="btn btn-gh" onClick={() => { setFcFlip(false); setFcIdx(i => Math.max(0, i - 1)) }}>← Prev</button>
                {fcFlip && (
                    <>
                        <button className="btn btn-sm" style={{ background: "rgba(255,94,135,.18)", color: "var(--rose)", border: "1px solid rgba(255,94,135,.3)" }} onClick={() => {
                            if (currentCard) updateMastery(currentCard, -1);
                            setFcFlip(false); setFcIdx(i => vocabCards.length > 0 ? Math.min(i + 1, vocabCards.length - 1) : 0);
                        }}>😐 Hard (−★)</button>
                        <button className="btn btn-sm" style={{ background: "rgba(52,211,153,.18)", color: "var(--green)", border: "1px solid rgba(52,211,153,.3)" }} onClick={() => {
                            if (currentCard) updateMastery(currentCard, 1);
                            setFcFlip(false); setFcIdx(i => vocabCards.length > 0 ? (i + 1) % vocabCards.length : 0);
                        }}>✓ Got it (+★)</button>
                    </>
                )}
                <button className="btn btn-gh" onClick={() => { setFcFlip(false); setFcIdx(i => vocabCards.length > 0 ? (i + 1) % vocabCards.length : 0) }}>Next →</button>
            </div>
        </div>
    );
}
