import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient'; // Adjusted path
import { WL } from '../../data/constants'; // Adjusted path

export default function WeeklyChart() {
    const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);

    const fetchWeeklyHistory = useCallback(async () => {
        if (!supabase) return;
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        const monStr = monday.toISOString().split('T')[0];

        const { data } = await supabase.from('daily_summaries')
            .select('date, productivity_score')
            .gte('date', monStr)
            .order('date', { ascending: true })
            .limit(7);

        if (data) {
            const mapped = [0, 0, 0, 0, 0, 0, 0];
            data.forEach(d => {
                const dayIdx = (new Date(d.date + 'T00:00:00').getDay() + 6) % 7;
                mapped[dayIdx] = d.productivity_score || 0;
            });
            setWeeklyData(mapped);
        }
    }, []);

    useEffect(() => {
        fetchWeeklyHistory();
    }, [fetchWeeklyHistory]);

    return (
        <div className="card">
            <div className="ct">Weekly Performance</div>
            <div className="bch">
                {weeklyData.map((h, i) => (
                    <div key={i} className="bc">
                        <div
                            className={"bb" + (i === (new Date().getDay() + 6) % 7 ? " act" : "")}
                            style={{ height: h + "%" }}
                        />
                        <span className="bl">{WL[i]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
