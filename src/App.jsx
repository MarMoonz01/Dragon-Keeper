import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import Dashboard from './pages/Dashboard';
import DailyCheckInModal from './components/DailyCheckInModal';
import AnalysisPage from './pages/AnalysisPage';
import HatcheryPage from './pages/HatcheryPage';
import IELTSPage from './pages/IELTSPage';
import HealthPage from './pages/HealthPage';
import { TASKS0, DRAGONS } from './data/constants';
import { load, save, ai } from './utils/helpers';
import { supabase } from './utils/supabaseClient';
import './index.css';

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [dragon, setDragon] = useState({ xp: 0, level: 1 });
  const [stats, setStats] = useState({ monstersDefeated: 0, streak: 0, healthScore: 0 });
  const [health, setHealth] = useState({ sleep: 0, steps: 0, water: 0, hr: 0, calories: 0 });
  const [toast, setToast] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [gcal, setGcal] = useState({ connected: false, lastSync: null });
  const [gcalPushing, setGcalPushing] = useState(false);


  const [dailyPlan, setDailyPlan] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    load("nx-dragon").then(d => setDragon(d || { xp: 0, level: 1 }));
    load("nx-stats").then(d => setStats(d || { monstersDefeated: 0, streak: 0, healthScore: 0 }));
    load("nx-health").then(d => setHealth(d || { sleep: 0, steps: 0, water: 0, hr: 0, calories: 0 }));
    load("nx-gcal").then(d => d && setGcal(d));

    // Fetch or Generate Daily Plan
    if (supabase) {
      fetchDailyPlan();
    } else {
      // Fallback if no DB
      load("nx-tasks").then(d => setTasks(d || TASKS0));
    }
  }, []);

  const fetchDailyPlan = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('daily_plans').select('*').eq('date', today).single();
    if (data) {
      setTasks(data.tasks);
      setDailyPlan(data);
    } else {
      generateDailyPlan();
    }
  };

  const generateDailyPlan = async () => {
    // 1. Get yesterday's summary
    const { data: history } = await supabase.from('daily_summaries').select('*').order('date', { ascending: false }).limit(1).single();

    // 2. AI Gen
    // For now, if no history, just use TASKS0 but save it to DB
    let newTasks = TASKS0;

    if (history) {
      // Logic to ask AI for new schedule based on history.summary
      // For this MVP, we will stick to TASKS0 but maybe tweak it later
      // implemented in next step if user wants dynamic generation right away
    }

    // 3. Save to DB
    const { error } = await supabase.from('daily_plans').insert([{ date: new Date().toISOString().split('T')[0], tasks: newTasks }]);
    if (!error) {
      setTasks(newTasks);
    } else {
      setTasks(TASKS0); // Fallback
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
    const settings = await load("nx-settings");

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
    // if (!supabase) return alert("Connect Supabase to use End of Day analysis."); // Checked in handleEndDay
    setAnalyzing(true);
    const completed = tasks.filter(t => t.done);
    const score = Math.round((completed.length / tasks.length) * 100);

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
      const res = await ai([{ role: "user", content: prompt }], "You are a life coach.");
      const jsonMatch = res.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: res, mood: "Neutral" };

      await supabase.from('daily_summaries').insert([{
        date: new Date().toISOString().split('T')[0],
        summary: analysis.summary,
        mood: analysis.mood,
        mood_score: metrics.mood,
        energy_score: metrics.energy,
        focus_score: metrics.focus,
        sleep_score: metrics.sleep,
        productivity_score: score,
        completed_tasks: completed
      }]);

      showToast("🌙", "Day Ended", "Analysis saved. See you tomorrow!");
    } catch (e) {
      console.error(e);
      showToast("❌", "Error", "Could not analyze day.");
    }
    setAnalyzing(false);
  };

  const handleEndDay = () => {
    if (!supabase) return alert("Connect Supabase to use End of Day analysis.");
    setShowCheckIn(true);
  };

  const showToast = (icon, title, msg) => { setToast({ icon, title, msg }); setTimeout(() => setToast(null), 3500); };

  const completeTask = useCallback((id) => {
    setTasks(prev => {
      const t = prev.find(x => x.id === id);
      if (!t || t.done) return prev;
      const nxp = dragon.xp + t.xp, nlv = Math.floor(nxp / 100) + 1;
      const nd = { xp: nxp, level: nlv };
      setDragon(nd); save("nx-dragon", nd);
      showToast("⚡", "Task Complete!", "+" + t.xp + " XP earned! 🐉");
      if (nlv > dragon.level) setTimeout(() => setLevelUp(nlv), 400);
      if (nlv > dragon.level) setTimeout(() => setLevelUp(nlv), 400);
      const upd = prev.map(x => x.id === id ? { ...x, done: true } : x);
      updateTaskStatus(upd); // Use new helper
      return upd;
    });
  }, [dragon]);

  const addTask = t => {
    setTasks(prev => {
      const u = [...prev, t];
      updateTaskStatus(u); // Use new helper
      return u;
    });
    showToast("✅", "Task Added", t.name);
  };

  const onDefeat = reward => {
    const nxp = dragon.xp + reward, nlv = Math.floor(nxp / 100) + 1;
    const nd = { xp: nxp, level: nlv };
    setDragon(nd); save("nx-dragon", nd);
    setStats(p => { const u = { ...p, monstersDefeated: (p.monstersDefeated || 0) + 1 }; save("nx-stats", u); return u; });
    showToast("🏆", "Monster Defeated!", "+" + reward + " XP! Next battle unlocked.");
    if (nlv > dragon.level) setTimeout(() => setLevelUp(nlv), 600);
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

  const saveHealth = h => { setHealth(h); save("nx-health", h); showToast("❤️", "Health Saved", "Data will inform tomorrow's AI schedule"); };

  return (
    <>
      <div className="app">
        <Sidebar page={page} setPage={setPage} dragon={dragon} onSettings={() => setShowSettings(true)} />

        <main className="main">
          {page === "dashboard" && (
            <>
              <Dashboard tasks={tasks} onComplete={completeTask} dragon={dragon} streak={stats.streak || 7} onAdd={addTask} gcal={gcal} onConnect={onGcalConnect} onPush={onGcalPush} pushing={gcalPushing} stats={stats} />
              <div style={{ padding: "0 24px 24px" }}>
                <button className="btn btn-gh" style={{ width: "100%", justifyContent: "center", border: "1px dashed var(--bdr)", padding: 12 }} onClick={handleEndDay} disabled={analyzing}>
                  {analyzing ? "🌙 Analysing Day..." : "🌙 End Day & Analyze Performance"}
                </button>
              </div>
            </>
          )}
          {page === "analysis" && <AnalysisPage tasks={tasks} dragon={dragon} stats={stats} streak={stats.streak || 7} />}
          {page === "hatchery" && <HatcheryPage tasks={tasks} dragon={dragon} stats={stats} onDefeat={onDefeat} streak={stats.streak || 7} />}
          {page === "ielts" && <IELTSPage />}
          {page === "health" && <HealthPage health={health} onSave={saveHealth} />}
        </main>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onReset={resetGame} />}
      {showCheckIn && <DailyCheckInModal onClose={() => setShowCheckIn(false)} onSave={endDay} />}

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
