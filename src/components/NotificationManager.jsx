import { useEffect, useRef } from 'react';

const getIconFromEmoji = (emoji) => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, 32, 32);

    return canvas.toDataURL();
};

export default function NotificationManager() {
    const { tasks } = useTasks();
    const prevNotified = useRef(new Set());
    const proactiveChecked = useRef(false);

    useEffect(() => {
        // Request notification permission on mount
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // === Feature 1: Task Reminders (existing) ===
    useEffect(() => {
        if (!("Notification" in window) || Notification.permission !== "granted") return;

        const check = () => {
            const now = new Date();
            const nowMin = now.getHours() * 60 + now.getMinutes();

            tasks.forEach(t => {
                if (t.done || !t.time || prevNotified.current.has(t.id)) return;
                const [h, m] = t.time.split(":").map(Number);
                const taskMin = h * 60 + m;
                // Notify if within ±5 min window
                if (Math.abs(taskMin - nowMin) <= 5) {
                    prevNotified.current.add(t.id);
                    new Notification("⏰ NEXUS Reminder", {
                        body: `Time for: ${t.name}`,
                        icon: getIconFromEmoji("🐲"),
                        tag: "nexus-" + t.id
                    });
                }
            });
        };

        check();
        const interval = setInterval(check, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [tasks]);

    // === Feature 2: Proactive AI Coach — Daily Writing Check ===
    useEffect(() => {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        if (proactiveChecked.current) return;

        const checkWritingProgress = () => {
            try {
                // Check if we already notified today
                const lastNotif = localStorage.getItem("nx-proactive-last");
                const today = new Date().toISOString().split("T")[0];
                if (lastNotif === today) return;

                // Only check at or after 08:00
                const now = new Date();
                if (now.getHours() < 8) return;

                const history = JSON.parse(localStorage.getItem("nx-writing-history") || "[]");
                if (history.length < 2) return; // Need at least 2 scores

                // Get scores from last 2 weeks
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                const twoWeeksStr = twoWeeksAgo.toISOString().split("T")[0];

                const recentScores = history.filter(s => s.date >= twoWeeksStr);
                if (recentScores.length === 0) return;

                const avgBand = recentScores.reduce((sum, s) => sum + (s.band || 0), 0) / recentScores.length;

                if (avgBand < 6.0) {
                    new Notification("📝 NEXUS AI Coach", {
                        body: `Your writing average is ${avgBand.toFixed(1)} over the last 2 weeks. Try adding an extra Writing Task 2 practice today!`,
                        icon: getIconFromEmoji("🐲"),
                        tag: "nexus-proactive-writing"
                    });
                    localStorage.setItem("nx-proactive-last", today);
                } else if (avgBand < 6.5) {
                    new Notification("✨ NEXUS AI Coach", {
                        body: `Writing average: ${avgBand.toFixed(1)}. You're close to Band 6.5! One more push today could unlock Scholar's Eye for your dragon.`,
                        icon: getIconFromEmoji("🐲"),
                        tag: "nexus-proactive-writing"
                    });
                    localStorage.setItem("nx-proactive-last", today);
                }

                proactiveChecked.current = true;
            } catch (e) {
                // Silently ignore errors
            }
        };

        checkWritingProgress();
        // Also set interval to check every hour (in case app was opened before 08:00)
        const interval = setInterval(checkWritingProgress, 3600000);
        return () => clearInterval(interval);
    }, []);

    return null; // No UI — runs in background
}
