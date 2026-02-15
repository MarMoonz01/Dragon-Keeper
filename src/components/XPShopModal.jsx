import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SHOP_ITEMS } from '../data/constants';

export default function XPShopModal({ onClose }) {
    const { dragon, buyItem } = useGame();
    const [msg, setMsg] = useState("");

    const handleBuy = (item) => {
        if (dragon.xp < item.cost) {
            setMsg(`Not enough XP! Need ${item.cost - dragon.xp} more.`);
            setTimeout(() => setMsg(""), 3000);
            return;
        }

        const success = buyItem(item.id, item.cost);
        if (success) {
            setMsg(`Purchased ${item.name}!`);
            setTimeout(() => setMsg(""), 3000);
        }
    };

    return (
        <div className="mo" onClick={onClose}>
            <div className="mc" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div className="ct" style={{ margin: 0 }}>🛒 XP Shop</div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t2)", fontSize: 18, cursor: "pointer" }}>✕</button>
                </div>

                <div style={{ textAlign: "center", marginBottom: 20, background: "rgba(251,191,36,0.1)", padding: 10, borderRadius: 12, border: "1px solid rgba(251,191,36,0.3)" }}>
                    <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase" }}>Current Balance</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "var(--gold)" }}>{dragon.xp} XP</div>
                </div>

                <div className="g2">
                    {SHOP_ITEMS.map(item => (
                        <div key={item.id} className="card" style={{ padding: 14, background: "var(--card2)", display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ fontSize: 24 }}>{item.em}</div>
                            <div style={{ fontWeight: 700 }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.4, flex: 1 }}>{item.desc}</div>
                            <button
                                className="btn"
                                style={{
                                    width: "100%", justifyContent: "center",
                                    background: dragon.xp >= item.cost ? "var(--teal)" : "var(--gh)",
                                    opacity: dragon.xp >= item.cost ? 1 : 0.5,
                                    color: dragon.xp >= item.cost ? "#000" : "var(--t2)"
                                }}
                                onClick={() => handleBuy(item)}
                                disabled={dragon.xp < item.cost}
                            >
                                <span style={{ fontSize: 13 }}>⚡ {item.cost} XP</span>
                            </button>
                        </div>
                    ))}
                </div>

                {msg && (
                    <div style={{
                        marginTop: 14, padding: "8px 12px", background: "#222", color: "#fff",
                        borderRadius: 8, fontSize: 12, textAlign: "center", animation: "pulse 0.5s"
                    }}>
                        {msg}
                    </div>
                )}
            </div>
        </div>
    );
}
