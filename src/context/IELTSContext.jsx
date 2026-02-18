import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { load, save } from '../utils/helpers';
import { supabase } from '../utils/supabaseClient';

const IELTSContext = createContext();

export function useIELTS() {
    return useContext(IELTSContext);
}

export function IELTSProvider({ children }) {
    const [ieltsTarget, setIeltsTarget] = useState("7.5");
    const [scores, setScores] = useState(null); // Latest score object
    const [realScores, setRealScores] = useState([]); // Array of all scores
    const [notebook, setNotebook] = useState([]);
    const [practiceLogs, setPracticeLogs] = useState([]);

    // Load initial target
    useEffect(() => {
        const s = load("nx-settings");
        if (s && s.ieltsTarget) setIeltsTarget(s.ieltsTarget);
    }, []);

    // Fetch Data
    useEffect(() => {
        if (!supabase) return;
        fetchScores();
        fetchNotebook();
        fetchPracticeLogs();
    }, []);

    const fetchScores = async () => {
        try {
            const { data, error } = await supabase.from('scores').select('*').order('created_at', { ascending: false });
            if (error) { console.error("fetchScores error:", error); return; }
            if (data && data.length > 0) {
                setRealScores(data);
                setScores(data[0]);
                localStorage.setItem("nx-ielts-scores", JSON.stringify(data));
            }
        } catch (e) { console.error("fetchScores exception:", e); }
    };

    const fetchNotebook = async () => {
        try {
            const { data, error } = await supabase.from('notebook').select('*').order('created_at', { ascending: false });
            if (error) { console.error("fetchNotebook error:", error); return; }
            if (data) setNotebook(data);
        } catch (e) { console.error("fetchNotebook exception:", e); }
    };

    const fetchPracticeLogs = async () => {
        try {
            const { data, error } = await supabase.from('practice_logs').select('*').order('created_at', { ascending: false }).limit(20);
            if (error) { console.error("fetchPracticeLogs error:", error); return; }
            if (data) setPracticeLogs(data);
        } catch (e) { console.error("fetchPracticeLogs exception:", e); }
    };

    const addToNotebook = async (item) => {
        if (supabase) {
            const { error } = await supabase.from('notebook').insert([item]);
            if (error) console.error("Error saving notebook:", error);
            else fetchNotebook();
        } else {
            setNotebook(prev => [item, ...prev]);
        }
    };

    const togglePracticeLog = async (id, currentStatus) => {
        if (!supabase) return;
        await supabase.from('practice_logs').update({ completed: !currentStatus }).eq('id', id);
        fetchPracticeLogs();
    };

    const getWeakestSkills = useCallback(() => {
        if (!realScores || realScores.length === 0) return [];
        const latest = realScores[0];
        const target = parseFloat(ieltsTarget) || 7;
        const skills = ['listening', 'reading', 'writing', 'speaking'];
        return skills
            .map(s => ({ skill: s, current: latest[s] || 0, gap: target - (latest[s] || 0) }))
            .filter(s => s.gap > 0)
            .sort((a, b) => b.gap - a.gap);
    }, [realScores, ieltsTarget]);

    const addScore = async (scoreData) => {
        if (!supabase) return { error: { message: "Supabase not connected" } };
        const { error } = await supabase.from('scores').insert([scoreData]);
        if (!error) fetchScores();
        return { error };
    };

    const value = useMemo(() => ({
        ieltsTarget,
        scores,
        realScores,
        notebook,
        setNotebook,
        practiceLogs,
        addScore,
        addToNotebook,
        togglePracticeLog,
        fetchNotebook,
        fetchScores,
        fetchPracticeLogs,
        getWeakestSkills
    }), [ieltsTarget, scores, realScores, notebook, practiceLogs, getWeakestSkills]);

    return (
        <IELTSContext.Provider value={value}>
            {children}
        </IELTSContext.Provider>
    );
}
