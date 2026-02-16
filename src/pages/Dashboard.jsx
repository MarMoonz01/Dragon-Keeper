import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useTasks } from '../context/TaskContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../utils/supabaseClient';

// Components
import AddTaskModal from '../components/AddTaskModal';
import BriefingCard from '../components/BriefingCard';
import JourneyPanel from '../components/JourneyPanel';
import DragonPanel from '../components/DragonPanel';
import GCalPanel from '../components/GCalPanel';
import MiniCal from '../components/MiniCal';
import XPShopModal from '../components/XPShopModal';
import ChallengesCard from '../components/ChallengesCard';

// Extracted Components
import StatsRow from '../components/dashboard/StatsRow';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import AIScheduler from '../components/dashboard/AIScheduler';
import ScheduleCard from '../components/dashboard/ScheduleCard';

export default function Dashboard() {
    const { dragon, stats, currentStage, nextStage, dragonSkill } = useGame();
    const streak = stats.streak || 0;
    const { tasks, addTask: onAdd } = useTasks();
    const { gcal, updateGcal } = useSettings();
    const navigate = useNavigate();

    const [showShop, setShowShop] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [calHighlights, setCalHighlights] = useState([]);

    const done = tasks.filter(t => t.done).length;
    const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;

    const fetchCalHighlights = useCallback(async () => {
        if (!supabase) return;
        try {
            const now = new Date();
            const y = now.getFullYear(), m = now.getMonth();
            const start = new Date(y, m, 1).toISOString().split('T')[0];
            const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
            const { data, error } = await supabase.from('daily_summaries')
                .select('date')
                .gte('date', start).lte('date', end);
            if (error) { console.error("Calendar highlights fetch error:", error); return; }
            if (data) setCalHighlights(data.map(d => new Date(d.date + 'T00:00:00').getDate()));
        } catch (e) { console.error("Calendar highlights exception:", e); }
    }, []);

    useEffect(() => {
        fetchCalHighlights();
    }, [fetchCalHighlights]);

    const onConnect = () => updateGcal({ ...gcal, connected: true });

    return (
        <div>
            {showShop && <XPShopModal onClose={() => setShowShop(false)} />}
            {showAdd && <AddTaskModal onAdd={t => { onAdd(t); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}

            <div className="ph">
                <div className="ph-title">Command Center</div>
                <div className="ph-sub">{new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })} · AI Secretary Active</div>
            </div>

            <BriefingCard dragon={dragon} streak={streak} />

            <StatsRow setShowShop={setShowShop} />

            <div className="gm">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <ChallengesCard />

                    <ScheduleCard onAddClick={() => setShowAdd(true)} pct={pct} />

                    <WeeklyChart />

                    <AIScheduler />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <JourneyPanel />
                    <DragonPanel
                        xp={dragon.xp} lv={dragon.level} done={done} streak={streak} tasks={tasks}
                        stage={currentStage} nextStage={nextStage} skill={dragonSkill}
                    />
                    <GCalPanel tasks={tasks} />
                    <div className="card">
                        <div className="ct">Calendar</div>
                        <MiniCal hi={calHighlights.length > 0 ? calHighlights : []} />
                    </div>
                </div>
            </div>
        </div>
    );
}
