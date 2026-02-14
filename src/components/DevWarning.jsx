import React, { useEffect, useState } from 'react';

export default function DevWarning() {
    const isProd = import.meta.env.PROD;

    // Only show if NOT in production
    if (isProd) return null;

    return (
        <div style={{
            background: "#faa",
            color: "#600",
            padding: "4px 12px",
            fontSize: 11,
            textAlign: "center",
            fontWeight: 700,
            borderBottom: "1px solid #d00"
        }}>
            ⚠️ DEVELOPMENT MODE — INSECURE API KEYS ENABLED
        </div>
    );
}
