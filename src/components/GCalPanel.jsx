import React, { useState } from 'react';

/**
 * Generate a valid .ics (iCalendar) string from an array of tasks.
 * Each task with a `time` field gets a 1-hour event on today's date.
 */
function generateICS(tasks) {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

    const events = tasks
        .filter(t => t.time)
        .map(t => {
            const [h, m] = t.time.split(":").map(Number);
            const startH = String(h).padStart(2, "0");
            const startM = String(m).padStart(2, "0");
            const endH = String(h + 1 > 23 ? 23 : h + 1).padStart(2, "0");
            const endM = String(m).padStart(2, "0");
            const uid = `nexus-${t.id}-${dateStr}@nexus-app`;
            const cat = { health: "Health", work: "Work", ielts: "IELTS", mind: "Mindfulness", social: "Social" }[t.cat] || "Task";

            return [
                "BEGIN:VEVENT",
                `UID:${uid}`,
                `DTSTART:${dateStr}T${startH}${startM}00`,
                `DTEND:${dateStr}T${endH}${endM}00`,
                `SUMMARY:${t.name}`,
                `DESCRIPTION:[${cat}] ${t.xp} XP — NEXUS`,
                `CATEGORIES:${cat}`,
                `STATUS:${t.done ? "COMPLETED" : "CONFIRMED"}`,
                "END:VEVENT"
            ].join("\r\n");
        });

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//NEXUS//AI Life Secretary//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        ...events,
        "END:VCALENDAR"
    ].join("\r\n");
}

function downloadICS(content, filename) {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function GCalPanel({ tasks }) {
    const [exported, setExported] = useState(false);

    const exportableTasks = (tasks || []).filter(t => t.time);

    const handleExportAll = () => {
        if (exportableTasks.length === 0) return;
        const ics = generateICS(exportableTasks);
        const today = new Date().toISOString().split("T")[0];
        downloadICS(ics, `nexus-tasks-${today}.ics`);
        setExported(true);
        setTimeout(() => setExported(false), 3000);
    };

    const handleExportSingle = (task) => {
        const ics = generateICS([task]);
        downloadICS(ics, `nexus-${task.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.ics`);
    };

    return (
        <div className="card">
            <div className="ct" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                📅 Calendar Export
                <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(52,211,153,.15)", color: "var(--teal)", padding: "2px 8px", borderRadius: 20, letterSpacing: 1 }}>ACTIVE</span>
            </div>

            <div className="gcal-s">
                <div className="gcal-dot" style={{ background: "var(--teal)" }} />
                <div className="gcal-info">
                    <div className="gcal-nm">Export to Any Calendar</div>
                    <div className="gcal-sub">Download .ics files for Google Calendar, Apple Calendar, or Outlook</div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                    className="btn btn-g"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={handleExportAll}
                    disabled={exportableTasks.length === 0}
                >
                    {exported ? "✅ Downloaded!" : `📥 Export All Tasks (${exportableTasks.length})`}
                </button>
            </div>

            {exportableTasks.length > 0 && (
                <div style={{ marginTop: 12, maxHeight: 150, overflowY: "auto" }}>
                    {exportableTasks.map(t => (
                        <div key={t.id} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "6px 8px", borderBottom: "1px solid var(--bdr)", fontSize: 11
                        }}>
                            <span style={{ color: t.done ? "var(--t3)" : "var(--t1)", textDecoration: t.done ? "line-through" : "none" }}>
                                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--t3)", marginRight: 8 }}>{t.time}</span>
                                {t.name}
                            </span>
                            <button
                                className="btn btn-gh btn-sm"
                                style={{ fontSize: 9, padding: "2px 8px", whiteSpace: "nowrap" }}
                                onClick={() => handleExportSingle(t)}
                            >
                                📥 .ics
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {exportableTasks.length === 0 && (
                <div className="ins" style={{ marginTop: 10 }}>
                    <span className="ins-ic">💡</span>
                    <span>Add tasks with time slots on your Dashboard to enable calendar export.</span>
                </div>
            )}
        </div>
    );
}
