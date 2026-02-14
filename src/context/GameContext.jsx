import React, { createContext, useContext, useState, useEffect } from 'react';
import { load, save } from '../utils/helpers';
import { DRAGONS } from '../data/constants';

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

    const addXP = (amount) => {
        setDragon(prev => {
            const nxp = prev.xp + amount;
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

    const value = {
        dragon,
        stats,
        health,
        levelUp,
        setLevelUp,
        addXP,
        updateStats,
        updateHealth,
        defeatMonster
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}
