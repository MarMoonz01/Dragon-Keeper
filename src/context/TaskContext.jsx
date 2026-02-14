import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { load, save, ai } from '../utils/helpers';
import { supabase } from '../utils/supabaseClient';
import { TASKS0 } from '../data/constants';
import { useGame } from './GameContext';
import { useSettings } from './SettingsContext';

const TaskContext = createContext();

export function useTasks() {
    return useContext(TaskContext);
}

export function TaskProvider({ children }) {
    const { addXP, updateStats, calculateStreak } = useGame();
    const { gcal, updateGcal } = useSettings();

    const [tasks, setTasks] = useState([]);
    const [dailyPlan, setDailyPlan] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [gcalPushing, setGcalPushing] = useState(false);
    const [toast, setToast] = useState(null);

    // Initial Load
    useEffect(() => {
        if (supabase) {
            fetchDailyPlan().catch(e => console.error("Fetch plan failed:", e));
        } else {
            setTasks(load("nx-tasks") || TASKS0);
        }
    }, []);

    const showToast = (icon, title, msg) => { setToast({ icon, title, msg }); setTimeout(() => setToast(null), 3500); };

    const fetchDailyPlan = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('daily_plans').select('*').eq('date', today).single();
        if (data) {
            const planCreatedAt = new Date(data.created_at);
            const today4am = new Date();
            today4am.setHours(4, 0, 0, 0);
            if (planCreatedAt < today4am) {
                generateDailyPlan();
            } else {
                setTasks(data.tasks);
                setDailyPlan(data);
            }
        } else {
            generateDailyPlan();
        }
    };

    const generateDailyPlan = async () => {
        try {
            // 1. Get yesterday's summary
            let history = null;
            if (supabase) {
                const { data } = await supabase.from('daily_summaries').select('*').order('date', { ascending: false }).limit(1).single();
                history = data;
            }

            // 2. Load profile
            const profile = load("nx-profile");
            const profileCtx = profile
                ? `User: ${profile.name || "User"}${profile.age ? `, age ${profile.age}` : ""}${profile.status ? `, ${profile.status.replace(/_/g, " ")}` : ""}. Goals: ${(profile.goals || []).join(", ") || "general"}. Wake: ${profile.wakeTime || "07:00"}, Sleep: ${profile.sleepTime || "23:00"}. Free time: ${profile.freeSlots || "afternoon"}.${profile.currentBand ? ` Current IELTS: ${profile.currentBand}.` : ""}`
                : "No profile set.";

            // 3. AI Generation
            const context = history
                ? `Yesterday: ${history.summary || 'No summary'}. Mood: ${history.mood || 'Unknown'}. Score: ${history.productivity_score || 0}%. Completed: ${(history.completed_tasks || []).map(t => t.name).join(', ') || 'none'}.`
                : 'First day — no history yet.';

            const wakeH = profile?.wakeTime ? parseInt(profile.wakeTime.split(':')[0]) : 7;
            const sleepH = profile?.sleepTime ? parseInt(profile.sleepTime.split(':')[0]) : 23;

            const prompt = `Generate today's daily plan. ${profileCtx}
Context: ${context}
Create exactly 10 tasks as a JSON array. Each task must have:
- id (number 1-10), name (string), time (HH:MM between ${String(wakeH).padStart(2, "0")}:00 and ${String(sleepH - 1).padStart(2, "0")}:30), cat (one of: health/work/ielts/mind/social), xp (10-60), done (false), calSync (boolean), hp (8-50)
Schedule tasks ONLY between ${String(wakeH).padStart(2, "0")}:00-${String(sleepH).padStart(2, "0")}:00. ${profile?.goals?.includes("ielts") ? "Front-load IELTS before noon." : ""} Include health, work, and mindfulness tasks. Mix categories.
Respond with ONLY the JSON array, no explanation.`;

            const res = await ai([{ role: "user", content: prompt }], "You are NEXUS AI Life Secretary. Generate practical, balanced daily schedules in JSON format.");

            let newTasks = TASKS0;
            try {
                const jsonMatch = res.match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name && parsed[0].cat) {
                        newTasks = parsed.map((t, i) => ({
                            id: t.id || i + 1,
                            name: String(t.name || ''),
                            time: String(t.time || '08:00'),
                            cat: ['health', 'work', 'ielts', 'mind', 'social'].includes(t.cat) ? t.cat : 'work',
                            xp: Math.max(10, Math.min(60, Number(t.xp) || 20)),
                            done: false,
                            calSync: Boolean(t.calSync),
                            hp: Math.max(8, Math.min(50, Number(t.hp) || 15))
                        }));
                    }
                }
            } catch (parseErr) {
                console.warn("AI plan parse failed, using defaults:", parseErr);
            }

            if (supabase) {
                await supabase.from('daily_plans').upsert([{ date: new Date().toISOString().split('T')[0], tasks: newTasks }], { onConflict: 'date' });
            }
            setTasks(newTasks);
            save("nx-tasks", newTasks);
        } catch (e) {
            console.error("Error generating plan:", e);
            setTasks(TASKS0);
            showToast("❌", "Plan Generation Failed", "Using default tasks. Check AI settings.");
        }
    };

    const updateTaskStatus = async (updatedTasks) => {
        setTasks(updatedTasks);
        save("nx-tasks", updatedTasks);
        const today = new Date().toISOString().split('T')[0];
        if (supabase) {
            await supabase.from('daily_plans').update({ tasks: updatedTasks }).eq('date', today);
        }
    };

    const completeTask = useCallback((id, xp) => {
        setTasks(prev => {
            const task = prev.find(t => t.id === id);
            if (!task || task.done) return prev;

            addXP(xp);
            showToast("⚡", "Task Complete!", "+" + xp + " XP earned! 🐉");

            const upd = prev.map(x => x.id === id ? { ...x, done: true } : x);
            updateTaskStatus(upd);
            return upd;
        });
    }, [addXP, updateTaskStatus, showToast]);

    const addTask = t => {
        setTasks(prev => {
            const u = [...prev, t];
            updateTaskStatus(u);
            return u;
        });
        showToast("✅", "Task Added", t.name);
    };

    const editTask = (id, updates) => {
        setTasks(prev => {
            const u = prev.map(t => t.id === id ? { ...t, ...updates } : t);
            updateTaskStatus(u);
            return u;
        });
        showToast("✏️", "Task Updated", updates.name || "Changes saved");
    };

    const deleteTask = id => {
        setTasks(prev => {
            const t = prev.find(x => x.id === id);
            const u = prev.filter(x => x.id !== id);
            updateTaskStatus(u);
            if (t) showToast("🗑️", "Task Deleted", t.name);
            return u;
        });
    };

    const endDay = async (metrics) => {
        setAnalyzing(true);
        const completed = tasks.filter(t => t.done);
        const score = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
        const todayStr = new Date().toISOString().split('T')[0];

        const prompt = `Analyze my day.
Completed: ${completed.map(t => t.name).join(", ")}
Missed: ${tasks.filter(t => !t.done).map(t => t.name).join(", ")}
Metrics: Mood ${metrics.mood}/5, Energy ${metrics.energy}/5, Focus ${metrics.focus}/5, Sleep ${metrics.sleep}/5.
Reflection: ${metrics.reflection}
Productivity Score: ${score}%

Respond in this JSON format:
{
  "summary": "...",
  "mood": "Productive|Tired|Lazy|Energetic",
  "advice": "..."
}`;

        try {
            let analysis = { summary: "Day completed with " + score + "% productivity.", mood: "Neutral" };
            try {
                const res = await ai([{ role: "user", content: prompt }], "You are a life coach.");
                const jsonMatch = res.match(/\{[\s\S]*\}/);
                if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
            } catch (aiErr) {
                console.warn("AI analysis failed, using fallback:", aiErr);
            }

            const summaryData = {
                date: todayStr,
                summary: analysis.summary,
                mood: analysis.mood,
                mood_score: metrics.mood,
                energy_score: metrics.energy,
                focus_score: metrics.focus,
                sleep_score: metrics.sleep,
                productivity_score: score,
                completed_tasks: completed
            };

            if (supabase) {
                await supabase.from('daily_summaries').insert([summaryData]);
            }
            save("nx-daily-" + todayStr, summaryData);
            showToast("🌙", "Day Ended", "Analysis saved. See you tomorrow!");
        } catch (e) {
            console.error(e);
            save("nx-daily-" + todayStr, { date: todayStr, productivity_score: score });
            showToast("❌", "Error", "Analysis failed, but day was recorded.");
        }
        setAnalyzing(false);
        setShowCheckIn(false);

        // Use GameContext to update streak
        if (calculateStreak) calculateStreak();
    };

    const onGcalPush = async () => {
        setGcalPushing(true);
        await new Promise(r => setTimeout(r, 1800)); // Mock delay
        const updatedGcal = { ...gcal, lastSync: new Date().toLocaleTimeString() };
        updateGcal(updatedGcal);
        setGcalPushing(false);
        showToast("📤", "Synced!", tasks.filter(t => t.calSync).length + " tasks pushed to Google Calendar");
    };

    const value = {
        tasks,
        setTasks,
        dailyPlan,
        analyzing,
        showCheckIn,
        setShowCheckIn,
        gcalPushing,
        toast,
        showToast,
        completeTask,
        addTask,
        editTask,
        deleteTask,
        endDay,
        onGcalPush
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
}
