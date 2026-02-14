import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import Dashboard from './pages/Dashboard';
import DailyCheckInModal from './components/DailyCheckInModal';
import AnalysisPage from './pages/AnalysisPage';
import HatcheryPage from './pages/HatcheryPage';
import WorldMapPage from './pages/WorldMapPage';
import IELTSPage from './pages/IELTSPage';
import HealthPage from './pages/HealthPage';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingPage from './components/OnboardingModal';
import NotificationManager from './components/NotificationManager';
import { TASKS0, DRAGONS } from './data/constants';
import { load, save, ai } from './utils/helpers';
import { supabase } from './utils/supabaseClient';
import './index.css';

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [dragon, setDragon] = useState({ xp: 0, level: 1 });
  const [stats, setStats] = useState({ monstersDefeated: 0, streak: 0, healthScore: 0, streakFreezes: 1 });
  const [health, setHealth] = useState({ sleep: 0, steps: 0, water: 0, hr: 0, calories: 0 });
  const [toast, setToast] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [gcal, setGcal] = useState({ connected: false, lastSync: null });
  const [gcalPushing, setGcalPushing] = useState(false);


  const [dailyPlan, setDailyPlan] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setDragon(load("nx-dragon") || { xp: 0, level: 1 });
    setStats(load("nx-stats") || { monstersDefeated: 0, streak: 0, healthScore: 0 });
    setHealth(load("nx-health") || { sleep: 0, steps: 0, water: 0, hr: 0, calories: 0 });
    const g = load("nx-gcal"); if (g) setGcal(g);
    if (!load("nx-onboarded")) setShowOnboarding(true);

    // Supabase check with try/catch safety
    if (supabase) {
      fetchDailyPlan().catch(e => console.error("Fetch plan failed:", e));
    } else {
      setTasks(load("nx-tasks") || TASKS0);
    }
    // Always calculate streak (works with Supabase or localStorage)
    calculateStreak();
  }, []);

  const fetchDailyPlan = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('daily_plans').select('*').eq('date', today).single();
    if (data) {
      // Check if plan was created before 4am — if so, regenerate
      const planCreatedAt = new Date(data.created_at);
      const today4am = new Date();
      today4am.setHours(4, 0, 0, 0);
      if (planCreatedAt < today4am) {
        generateDailyPlan(); // Stale plan from before dawn
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
      // 1. Get yesterday's summary for context
      const { data: history } = await supabase.from('daily_summaries').select('*').order('date', { ascending: false }).limit(1).single();

      // 2. Load user profile for personalization
      const profile = load("nx-profile");
      const profileCtx = profile
        ? `User: ${profile.name || "User"}${profile.age ? `, age ${profile.age}` : ""}${profile.status ? `, ${profile.status.replace(/_/g, " ")}` : ""}. Goals: ${(profile.goals || []).join(", ") || "general"}. Wake: ${profile.wakeTime || "07:00"}, Sleep: ${profile.sleepTime || "23:00"}. Free time: ${profile.freeSlots || "afternoon"}.${profile.currentBand ? ` Current IELTS: ${profile.currentBand}.` : ""}`
        : "No profile set.";

      // 3. AI-powered plan generation
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

      // Parse AI response
      let newTasks = TASKS0;
      try {
        const jsonMatch = res.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // Validate structure
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

      // 3. Save to DB
      const { error } = await supabase.from('daily_plans').upsert([{ date: new Date().toISOString().split('T')[0], tasks: newTasks }], { onConflict: 'date' });
      setTasks(newTasks); // Always use AI-generated tasks
      if (error) {
        console.error("DB save failed:", error);
        showToast("⚠️", "Plan Not Saved", "AI plan loaded but couldn't save to database");
      }
    } catch (e) {
      console.error("Error generating plan:", e);
      setTasks(TASKS0);
      showToast("❌", "Plan Generation Failed", "Using default tasks. Check AI settings.");
    }
  };

  const calculateStreak = async () => {
    try {
      let dateSet;
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      if (supabase) {
        // Supabase path: read from daily_summaries
        const { data } = await supabase.from('daily_summaries')
          .select('date')
          .order('date', { ascending: false })
          .limit(60);
        if (!data || data.length === 0) return;
        dateSet = new Set(data.map(d => d.date));
      } else {
        // Local fallback: scan nx-daily-{date} keys in localStorage
        dateSet = new Set();
        for (let i = 0; i < 60; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().split('T')[0];
          if (localStorage.getItem("nx-daily-" + ds)) dateSet.add(ds);
        }
        if (dateSet.size === 0) return;
      }

      let streak = 0;
      let checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);

      if (dateSet.has(todayStr)) {
        streak = 1;
        checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
      }

      let freezesUsed = 0;
      const todayFreezeKey = "nx-freezes-used-" + todayStr;

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (dateSet.has(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          const prevDate = new Date(checkDate);
          prevDate.setDate(prevDate.getDate() - 1);
          const prevStr = prevDate.toISOString().split('T')[0];
          const availableFreezes = Math.max((stats.streakFreezes || 1), 0);
          if (dateSet.has(prevStr) && freezesUsed < availableFreezes) {
            freezesUsed++;
            streak++;
            checkDate.setDate(checkDate.getDate() - 2);
          } else {
            break;
          }
        }
      }

      localStorage.setItem(todayFreezeKey, JSON.stringify(freezesUsed));

      let bonusFreezes = 0;
      if (streak >= 30) bonusFreezes = 3;
      else if (streak >= 14) bonusFreezes = 2;
      else if (streak >= 7) bonusFreezes = 1;

      const baseFreeze = Math.max(stats.streakFreezes || 1, bonusFreezes);
      const finalFreezes = Math.max(0, baseFreeze - freezesUsed);

      setStats(prev => {
        const updated = { ...prev, streak, streakFreezes: finalFreezes };
        save("nx-stats", updated);
        return updated;
      });
    } catch (e) {
      console.error("Streak calc error:", e);
    }
  };

  const updateTaskStatus = async (updatedTasks) => {
    setTasks(updatedTasks);
    save("nx-tasks", updatedTasks);
    // Sync to DB if we have a plan
    const today = new Date().toISOString().split('T')[0];
    if (supabase) {
      await supabase.from('daily_plans').update({ tasks: updatedTasks }).eq('date', today);
    }
  };

  const resetGame = async () => {
    // 1. Preserve Settings (API Keys)
    const settings = load("nx-settings");

    // 2. Wipe Supabase (if connected)
    if (supabase) {
      const { error } = await supabase.from('scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('notebook').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('practice_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('daily_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('daily_summaries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 3. Clear LocalStorage
    localStorage.clear();

    // 4. Restore Settings
    if (settings) {
      save("nx-settings", settings);
    }

    // 5. Reload to apply defaults
    window.location.reload();
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
      // Always save locally for streak tracking
      save("nx-daily-" + todayStr, summaryData);

      showToast("🌙", "Day Ended", "Analysis saved. See you tomorrow!");
    } catch (e) {
      console.error(e);
      // Still mark day as completed locally for streak
      save("nx-daily-" + todayStr, { date: todayStr, productivity_score: score });
      showToast("❌", "Error", "Analysis failed, but day was recorded.");
    }
    setAnalyzing(false);
    setShowCheckIn(false);
    calculateStreak();
  };

  const handleEndDay = () => {
    setShowCheckIn(true);
  };

  const showToast = (icon, title, msg) => { setToast({ icon, title, msg }); setTimeout(() => setToast(null), 3500); };

  const completeTask = useCallback((id, xp) => {
    // Guard: if task is already done, don't award XP again
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task || task.done) return prev; // Already completed — no-op

      // Award XP via functional updater (no stale closure)
      setDragon(prevDragon => {
        const nxp = prevDragon.xp + xp;
        const nlv = Math.floor(nxp / 100) + 1;
        if (nlv > prevDragon.level) setTimeout(() => setLevelUp(nlv), 400);
        save("nx-dragon", { xp: nxp, level: nlv });
        showToast("⚡", "Task Complete!", "+" + xp + " XP earned! 🐉");
        return { xp: nxp, level: nlv };
      });

      const upd = prev.map(x => x.id === id ? { ...x, done: true } : x);
      updateTaskStatus(upd);
      return upd;
    });
  }, []); // No closure dependencies

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

  const onDefeat = reward => {
    setDragon(prev => {
      const nxp = prev.xp + reward;
      const nlv = Math.floor(nxp / 100) + 1;
      if (nlv > prev.level) setTimeout(() => setLevelUp(nlv), 600);
      save("nx-dragon", { xp: nxp, level: nlv });
      return { xp: nxp, level: nlv };
    });
    setStats(p => { const u = { ...p, monstersDefeated: (p.monstersDefeated || 0) + 1 }; save("nx-stats", u); return u; });
    showToast("🏆", "Monster Defeated!", "+" + reward + " XP! Next battle unlocked.");
  };

  const onGcalConnect = () => {
    const g = { connected: true, lastSync: new Date().toLocaleTimeString() };
    setGcal(g); save("nx-gcal", g); showToast("📅", "Calendar Connected", "Schedule will sync automatically!");
  };

  const onGcalPush = async () => {
    setGcalPushing(true);
    await new Promise(r => setTimeout(r, 1800));
    const g = { ...gcal, lastSync: new Date().toLocaleTimeString() };
    setGcal(g); save("nx-gcal", g); setGcalPushing(false);
    showToast("📤", "Synced!", tasks.filter(t => t.calSync).length + " tasks pushed to Google Calendar");
  };

  const saveHealth = h => {
    const { healthScore, ...healthData } = h;
    setHealth(healthData); save("nx-health", healthData);
    if (healthScore !== undefined) {
      setStats(prev => { const u = { ...prev, healthScore }; save("nx-stats", u); return u; });
    }
    showToast("❤️", "Health Saved", "Data will inform tomorrow's AI schedule");
  };

  // Gate: show full-page onboarding before main app
  if (showOnboarding) {
    return <OnboardingPage onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <>
      <div className="app">
        <Sidebar page={page} setPage={setPage} dragon={dragon} onSettings={() => setShowSettings(true)} />

        <main className="main">
          {page === "dashboard" && (
            <>
              <Dashboard tasks={tasks} onComplete={completeTask} dragon={dragon} streak={stats.streak || 0} onAdd={addTask} onEdit={editTask} onDelete={deleteTask} gcal={gcal} onConnect={onGcalConnect} onPush={onGcalPush} pushing={gcalPushing} stats={stats} />
              <div style={{ padding: "0 24px 24px" }}>
                <button className="btn btn-gh" style={{ width: "100%", justifyContent: "center", border: "1px dashed var(--bdr)", padding: 12 }} onClick={handleEndDay} disabled={analyzing}>
                  {analyzing ? "🌙 Analysing Day..." : "🌙 End Day & Analyze Performance"}
                </button>
              </div>
            </>
          )}
          {page === "analysis" && <ErrorBoundary><AnalysisPage tasks={tasks} dragon={dragon} stats={stats} streak={stats.streak || 0} /></ErrorBoundary>}
          {page === "hatchery" && <HatcheryPage tasks={tasks} dragon={dragon} stats={stats} onDefeat={onDefeat} streak={stats.streak || 0} />}
          {page === "worldmap" && <WorldMapPage dragon={dragon} stats={stats} showToast={showToast} onXP={(xp) => { setDragon(prev => { const d = { ...prev, xp: prev.xp + xp }; const lvl = Math.floor(d.xp / 100) + 1; if (lvl > d.level) { d.level = lvl; setLevelUp(lvl); } save('nx-dragon', d); return d; }); }} />}
          {page === "ielts" && <ErrorBoundary><IELTSPage /></ErrorBoundary>}
          {page === "health" && <HealthPage health={health} onSave={saveHealth} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-nav">
        {[
          { id: "dashboard", ic: "🏠", label: "Home" },
          { id: "worldmap", ic: "🗺️", label: "Map" },
          { id: "ielts", ic: "📚", label: "IELTS" },
          { id: "hatchery", ic: "⚔️", label: "Battle" },
          { id: "health", ic: "❤️", label: "Health" },
        ].map(n => (
          <button key={n.id} className={"mob-item" + (page === n.id ? " on" : "")} onClick={() => setPage(n.id)}>
            <span className="mob-ic">{n.ic}</span>
            {n.label}
          </button>
        ))}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onReset={resetGame} />}
      {showCheckIn && <DailyCheckInModal onClose={() => setShowCheckIn(false)} onSave={endDay} analyzing={analyzing} />}
      <NotificationManager tasks={tasks} />

      {toast && (
        <div className="toast">
          <div className="t-ic">{toast.icon}</div>
          <div><div className="t-tl">{toast.title}</div><div className="t-msg">{toast.msg}</div></div>
        </div>
      )}

      {levelUp && (
        <div className="luov" onClick={() => setLevelUp(null)}>
          <div className="luc">
            <span className="lu-em">{DRAGONS.reduce((s, st) => levelUp >= st.lv ? st : s, DRAGONS[0]).em}</span>
            <div className="lu-t">LEVEL UP!</div>
            <div className="lu-n">Level {levelUp}</div>
            <div className="lu-m">Your dragon grows stronger!<br />{DRAGONS.find(d => d.lv === levelUp) && ("You've evolved into a " + DRAGONS.find(d => d.lv === levelUp).name + "!")}</div>
            <button className="btn btn-g" style={{ margin: "0 auto" }} onClick={() => setLevelUp(null)}>Continue Journey ✦</button>
          </div>
        </div>
      )}
    </>
  );
}
