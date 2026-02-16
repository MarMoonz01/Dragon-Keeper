import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { load, save } from '../utils/helpers';
import { supabase } from '../utils/supabaseClient';

const SettingsContext = createContext();

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
    const [showSettings, setShowSettings] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [gcal, setGcal] = useState({ connected: false, lastSync: null });
    const [theme, setTheme] = useState("dark");

    // Load initial settings
    useEffect(() => {
        const g = load("nx-gcal");
        if (g) setGcal(g);

        const s = load("nx-settings");
        if (s && s.theme) setTheme(s.theme);

        if (!load("nx-onboarded")) setShowOnboarding(true);
    }, []);

    // Apply theme
    useEffect(() => {
        if (theme === "light") document.body.classList.add("light-mode");
        else document.body.classList.remove("light-mode");
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === "dark" ? "light" : "dark";
            const s = load("nx-settings") || {};
            save("nx-settings", { ...s, theme: next });
            return next;
        });
    };

    const updateGcal = (status) => {
        setGcal(status);
        save("nx-gcal", status);
    };

    const completeOnboarding = () => {
        setShowOnboarding(false);
        save("nx-onboarded", true);
    };

    const resetGame = async () => {
        // 1. Preserve Settings (API Keys)
        const settings = load("nx-settings");

        // 2. Wipe Supabase (if connected)
        if (supabase) {
            const tables = ['scores', 'notebook', 'practice_logs', 'daily_plans', 'daily_summaries'];
            for (const table of tables) {
                try {
                    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    if (error) console.warn(`Failed to clear ${table}:`, error.message);
                } catch (e) {
                    console.warn(`Exception clearing ${table}:`, e);
                }
            }
        }

        // 3. Clear LocalStorage
        localStorage.clear();

        // 4. Restore Settings
        if (settings) {
            save("nx-settings", settings);
        }
        window.location.reload();
    };

    const value = useMemo(() => ({
        theme,
        toggleTheme,
        showSettings,
        setShowSettings,
        showOnboarding,
        setShowOnboarding,
        gcal,
        updateGcal,
        resetGame
    }), [theme, showSettings, showOnboarding, gcal]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}
