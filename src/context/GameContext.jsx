import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { load, save } from '../utils/helpers';
import { DRAGONS, DRAGON_SKILLS } from '../data/constants';

const GameContext = createContext();

export function useGame() {
    return useContext(GameContext);
}

export function GameProvider({ children }) {
    const [dragon, setDragon] = useState({ xp: 0, level: 1 });
    const [stats, setStats] = useState({ monstersDefeated: 0, streak: 0, healthScore: 0, streakFreezes: 1 });
    const [health, setHealth] = useState({ sleep: 0, steps: 0, water: 0, hr: 0, calories: 0 });
    const [levelUp, setLevelUp] = useState(null);

    // Initial Load
    useEffect(() => {
        setDragon(load("nx-dragon") || { xp: 0, level: 1 });
        setStats(load("nx-stats") || { monstersDefeated: 0, streak: 0, healthScore: 0, streakFreezes: 1 });
        setHealth(load("nx-health") || { sleep: 0, steps: 0, water: 0, hr: 0, calories: 0 });
    }, []);

    // Dragon Skill — derived from IELTS writing history
    const dragonSkill = useMemo(() => {
        const history = load("nx-writing-history") || [];
        if (history.length === 0) return DRAGON_SKILLS[0]; // Default: Ember Shield (1.0×)

        // Calculate average band from recent writing scores
        const recent = history.slice(0, 10); // Last 10 scores
        const avgBand = recent.reduce((sum, s) => sum + (s.band || 0), 0) / recent.length;

        // Find highest matching skill
        let skill = DRAGON_SKILLS[0];
        for (const s of DRAGON_SKILLS) {
            if (avgBand >= s.band) skill = s;
        }
        return skill;
    }, []);

    // Re-derive skill when writing history changes (listen for storage events)
    const [skillRefresh, setSkillRefresh] = useState(0);
    const refreshSkill = () => setSkillRefresh(p => p + 1);

    const currentSkill = useMemo(() => {
        const history = load("nx-writing-history") || [];
        if (history.length === 0) return DRAGON_SKILLS[0];
        const recent = history.slice(0, 10);
        const avgBand = recent.reduce((sum, s) => sum + (s.band || 0), 0) / recent.length;
        let skill = DRAGON_SKILLS[0];
        for (const s of DRAGON_SKILLS) {
            if (avgBand >= s.band) skill = s;
        }
        return skill;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skillRefresh]);

    const addXP = (amount) => {
        const multiplier = currentSkill.xpMultiplier || 1;
        const boostedAmount = Math.round(amount * multiplier);
        setDragon(prev => {
            const nxp = prev.xp + boostedAmount;
            const nlv = Math.floor(nxp / 100) + 1;
            if (nlv > prev.level) setTimeout(() => setLevelUp(nlv), 400);
            save("nx-dragon", { xp: nxp, level: nlv });
            return { xp: nxp, level: nlv };
        });
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
            // Optional: update health score in stats if present
            if (updates.healthScore !== undefined) {
                updateStats({ healthScore: updates.healthScore });
            }
            return u;
        });
    };

    const defeatMonster = (reward) => {
        addXP(reward);
        updateStats({ monstersDefeated: (stats.monstersDefeated || 0) + 1 });
    };

    const calculateStreak = () => {
        // Simple increment for now, logic can be enhanced later to check dates
        const newStreak = (stats.streak || 0) + 1;
        updateStats({ streak: newStreak });
    };

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
        dragonSkill: currentSkill,
        refreshSkill
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}
