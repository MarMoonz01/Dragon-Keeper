import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { load, save } from '../utils/helpers';
import { DRAGONS, DRAGON_SKILLS, ACHIEVEMENTS, CHALLENGE_TEMPLATES, MONSTERS } from '../data/constants';

const GameContext = createContext();

export function useGame() {
    return useContext(GameContext);
}

export function GameProvider({ children }) {
    const [dragon, setDragon] = useState({ xp: 0, level: 1 });
    const [stats, setStats] = useState({ monstersDefeated: 0, streak: 0, healthScore: 0, streakFreezes: 1, totalTasks: 0, ieltsTasks: 0, healthTasks: 0, workTasks: 0, socialTasks: 0 });
    const [health, setHealth] = useState({ sleep: 0, steps: 0, water: 0, hr: 0, calories: 0 });
    const [levelUp, setLevelUp] = useState(null);
    const [challenges, setChallenges] = useState({ daily: [], weekly: [], lastDaily: null, lastWeekly: null });
    const [activeMonster, setActiveMonster] = useState(null);
    const [unlockedAchievements, setUnlockedAchievements] = useState([]);

    // Initial Load
    useEffect(() => {
        setDragon(load("nx-dragon") || { xp: 0, level: 1 });
        setStats(load("nx-stats") || { monstersDefeated: 0, streak: 0, healthScore: 0, streakFreezes: 1, totalTasks: 0, ieltsTasks: 0 });
        setHealth(load("nx-health") || { sleep: 0, steps: 0, water: 0, hr: 0, calories: 0 });
        setUnlockedAchievements(load("nx-achievements") || []);

        // Load or Init Monster
        const savedMonster = load("nx-monster-state");
        if (savedMonster && savedMonster.currentHp > 0) {
            setActiveMonster(savedMonster);
        } else {
            spawnMonster(1);
        }

        // Load or Init Challenges
        refreshChallenges();
    }, []);

    const spawnMonster = (level) => {
        const template = MONSTERS.find(m => m.level === level) || MONSTERS[0];
        const newMonster = { ...template, currentHp: template.maxHp, id: Date.now() };
        setActiveMonster(newMonster);
        save("nx-monster-state", newMonster);
    };

    const refreshChallenges = () => {
        const active = load("nx-challenges") || { daily: [], weekly: [], lastDaily: null, lastWeekly: null };
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0]; // Sunday

        let updated = { ...active };
        let changed = false;

        // Daily Reset
        if (active.lastDaily !== today) {
            const temps = [...CHALLENGE_TEMPLATES.daily].sort(() => 0.5 - Math.random()).slice(0, 3);
            updated.daily = temps.map(t => ({ ...t, current: 0, completed: false }));
            updated.lastDaily = today;
            changed = true;
        }

        // Weekly Reset
        if (active.lastWeekly !== startOfWeek) {
            const temps = [...CHALLENGE_TEMPLATES.weekly].sort(() => 0.5 - Math.random()).slice(0, 2);
            updated.weekly = temps.map(t => ({ ...t, current: 0, completed: false }));
            updated.lastWeekly = startOfWeek;
            changed = true;
        }

        if (changed) {
            setChallenges(updated);
            save("nx-challenges", updated);
        } else {
            setChallenges(active);
        }
    };

    // Dragon Skill — derived from Overall IELTS Band (Writing + persisted Reading/Listening scores)
    const dragonSkill = useMemo(() => {
        const wHistory = load("nx-writing-history") || [];
        const ieltsScores = load("nx-ielts-scores") || []; // From IELTSContext

        let totalBand = 0;
        let count = 0;

        // Valid writing history
        if (wHistory.length > 0) {
            const wAvg = wHistory.slice(0, 5).reduce((sum, s) => sum + (s.band || 0), 0) / Math.min(wHistory.length, 5);
            totalBand += wAvg;
            count++;
        }

        // Valid mock scores (Listening/Reading)
        if (ieltsScores.length > 0) {
            const latest = ieltsScores[0]; // Assuming latest mock represents current level
            if (latest.overall) {
                totalBand += latest.overall;
                count++;
            }
        }

        const overall = count > 0 ? (totalBand / count) : 5.5; // Default 5.5

        // Find highest matching skill
        let skill = DRAGON_SKILLS[0];
        for (const s of DRAGON_SKILLS) {
            if (overall >= s.band) skill = s;
        }
        return skill;
    }, [stats]); // Re-calc when stats change (trigger)

    const addXP = (amount) => {
        const multiplier = dragonSkill.xpMultiplier || 1;
        const boostedAmount = Math.round(amount * multiplier);
        setDragon(prev => {
            const nxp = prev.xp + boostedAmount;
            const nlv = Math.floor(nxp / 100) + 1;
            if (nlv > prev.level) setTimeout(() => setLevelUp(nlv), 400);
            save("nx-dragon", { xp: nxp, level: nlv });
            return { xp: nxp, level: nlv };
        });
        updateChallengeProgress("xp", boostedAmount);
    };

    const updateStats = (updates) => {
        setStats(prev => {
            const u = { ...prev, ...updates };
            save("nx-stats", u);
            return u;
        });
    };

    const updateHealth = (updates) => {
        setHealth(prev => {
            const u = { ...prev, ...updates };
            save("nx-health", u);
            if (updates.healthScore !== undefined) {
                updateStats({ healthScore: updates.healthScore });
            }
            return u;
        });
    };

    const defeatMonster = (damage = 10) => {
        if (!activeMonster) return;
        const newHp = Math.max(0, activeMonster.currentHp - damage);

        if (newHp === 0) {
            // Monster Defeated
            addXP(activeMonster.reward);
            updateStats({ monstersDefeated: (stats.monstersDefeated || 0) + 1 });
            updateChallengeProgress("monster", 1);

            // Spawn next (or same if max level)
            setTimeout(() => {
                const nextLevel = (activeMonster.level >= 5 && activeMonster.level < 10) ? 5 : (activeMonster.level < 5 ? activeMonster.level + 1 : 10);
                spawnMonster(nextLevel);
            }, 1000);
        }

        const updatedMonster = { ...activeMonster, currentHp: newHp };
        setActiveMonster(updatedMonster);
        save("nx-monster-state", updatedMonster);
    };

    const updateChallengeProgress = (type, amount = 1) => {
        setChallenges(prev => {
            let changed = false;
            const updateList = (list) => list.map(c => {
                if (c.completed) return c;
                if (c.type === type || c.type === 'any') {
                    const newCurrent = c.current + amount;
                    if (newCurrent >= c.target) {
                        addXP(c.reward); // Instant reward
                        changed = true;
                        return { ...c, current: newCurrent, completed: true };
                    }
                    changed = true;
                    return { ...c, current: newCurrent };
                }
                return c;
            });

            const newDaily = updateList(prev.daily);
            const newWeekly = updateList(prev.weekly);

            if (changed) {
                const newState = { ...prev, daily: newDaily, weekly: newWeekly };
                save("nx-challenges", newState);
                return newState;
            }
            return prev;
        });
    };

    const checkAchievements = (tasks) => {
        // Calculate dynamic stats
        const doneTasks = tasks.filter(t => t.done);
        const dynamicStats = {
            ...stats,
            totalTasksStr: stats.totalTasks + doneTasks.length, // Approximation or use actual total if tracked
            streak: stats.streak || 0
            // Add other derived stats if needed
        };

        const newUnlocked = [];
        ACHIEVEMENTS.forEach(ach => {
            if (unlockedAchievements.includes(ach.id)) return;
            const progress = ach.prog(tasks, doneTasks, dynamicStats);
            if (progress >= ach.max) {
                newUnlocked.push(ach.id);
                // Notification/Toast could trigger here
            }
        });

        if (newUnlocked.length > 0) {
            const updated = [...unlockedAchievements, ...newUnlocked];
            setUnlockedAchievements(updated);
            save("nx-achievements", updated);

            // XP Reward for achievements? Maybe 50 XP per achievement
            addXP(newUnlocked.length * 50);
        }
    };

    // Calculate Streak
    const calculateStreak = () => {
        // Simple increment, usually called once per day
        const newStreak = (stats.streak || 0) + 1;
        updateStats({ streak: newStreak });
        updateChallengeProgress("streak", newStreak);
    };

    // Shop Actions
    const buyItem = (itemId, cost) => {
        if (dragon.xp < cost) return false;

        // Deduct XP
        setDragon(prev => {
            const nxp = prev.xp - cost;
            save("nx-dragon", { ...prev, xp: nxp });
            return { ...prev, xp: nxp };
        });

        // Apply Item Effect
        if (itemId === "freeze") updateStats({ streakFreezes: (stats.streakFreezes || 0) + 1 });
        if (itemId === "heal" && activeMonster) {
            // Heal Dragon? Wait, we don't track Dragon HP yet, maybe heal the User's "HP" in tasks?
            // Or maybe reset tasks HP? leaving as placeholder or "Full Health in Tasks"
        }
        if (itemId === "reset") {
            // Logic handled in component to reset tasks
        }
        return true;
    };

    // Dragon Stage (Evolution)
    const currentStage = useMemo(() => {
        let s = DRAGONS[0];
        const band = dragonSkill.band;
        for (const d of DRAGONS) {
            if (dragon.level >= d.lv && (!d.minBand || band >= d.minBand)) {
                s = d;
            }
        }
        return s;
    }, [dragon.level, dragonSkill]);

    const nextStage = useMemo(() => {
        const idx = DRAGONS.findIndex(d => d.name === currentStage.name);
        if (idx < DRAGONS.length - 1) return DRAGONS[idx + 1];
        return null;
    }, [currentStage]);

    const value = {
        dragon,
        stats,
        health,
        levelUp,
        setLevelUp,
        addXP,
        updateStats,
        updateHealth,
        defeatMonster,
        calculateStreak,
        dragonSkill,
        activeMonster,
        challenges,
        checkAchievements,
        updateChallengeProgress,
        buyItem,
        unlockedAchievements,
        currentStage,
        nextStage
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}
