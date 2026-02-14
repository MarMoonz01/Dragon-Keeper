import React, { createContext, useContext, useState, useEffect } from 'react';
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
        const { data } = await supabase.from('scores').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
            setRealScores(data);
            setScores(data[0]);
        }
    };

    const fetchNotebook = async () => {
        const { data } = await supabase.from('notebook').select('*').order('created_at', { ascending: false });
        if (data) setNotebook(data);
    };

    const fetchPracticeLogs = async () => {
        const { data } = await supabase.from('practice_logs').select('*').order('created_at', { ascending: false }).limit(20);
        if (data) setPracticeLogs(data);
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

    const addScore = async (scoreData) => {
        if (!supabase) return { error: { message: "Supabase not connected" } };
        const { error } = await supabase.from('scores').insert([scoreData]);
        if (!error) fetchScores();
        return { error };
    };

    const value = {
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
        fetchPracticeLogs
    };

    return (
        <IELTSContext.Provider value={value}>
            {children}
        </IELTSContext.Provider>
    );
}
