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

export default function NotificationManager({ tasks }) {
    const prevNotified = useRef(new Set());

    useEffect(() => {
        // Request notification permission on mount
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

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

    return null; // No UI — runs in background
}
