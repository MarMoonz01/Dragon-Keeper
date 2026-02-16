
export async function getWeeklyPatterns(supabase) {
    if (!supabase) return "No data available (Supabase not connected).";

    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const { data: history } = await supabase
            .from('daily_summaries')
            .select('*')
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (!history || history.length === 0) return "No 30-day history available.";

        // Initialize aggregators
        const days = { 0: { total: 0, score: 0 }, 1: { total: 0, score: 0 }, 2: { total: 0, score: 0 }, 3: { total: 0, score: 0 }, 4: { total: 0, score: 0 }, 5: { total: 0, score: 0 }, 6: { total: 0, score: 0 } };
        const cats = { health: { total: 0, done: 0 }, work: { total: 0, done: 0 }, ielts: { total: 0, done: 0 }, mind: { total: 0, done: 0 } };
        let energySum = 0, moodSum = 0, count = 0;

        history.forEach(day => {
            const date = new Date(day.date);
            const dayIdx = date.getDay(); // 0=Sun
            days[dayIdx].total++;
            days[dayIdx].score += (day.productivity_score || 0);

            if (day.completed_tasks) {
                day.completed_tasks.forEach(t => {
                    if (cats[t.cat]) { cats[t.cat].total++; cats[t.cat].done++; }
                });
            }
            // Note: We don't have missed tasks in summary, only productivity score. 
            // We can infer general category performance if we had detailed logs, 
            // but here we'll use productivity score as a proxy for "good days".

            if (day.energy_score) energySum += day.energy_score;
            if (day.mood_score) moodSum += day.mood_score;
            count++;
        });

        // Calculate Averages
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayAvg = (d) => d.total > 0 ? d.score / d.total : 0;
        const bestDay = Object.keys(days).reduce((a, b) => dayAvg(days[a]) > dayAvg(days[b]) ? a : b);
        const worstDay = Object.keys(days).reduce((a, b) => dayAvg(days[a]) < dayAvg(days[b]) ? a : b);

        const avgEnergy = count > 0 ? (energySum / count).toFixed(1) : "0.0";
        const avgMood = count > 0 ? (moodSum / count).toFixed(1) : "0.0";

        return `30-Day Analysis:
- Best Day: ${dayNames[bestDay]} (Avg Score: ${Math.round(dayAvg(days[bestDay]))}%)
- Struggle Day: ${dayNames[worstDay]} (Avg Score: ${Math.round(dayAvg(days[worstDay]))}%)
- Avg Energy: ${avgEnergy}/5, Avg Mood: ${avgMood}/5
- Trend: User is most productive on ${dayNames[bestDay]}s. Energy levels are ${avgEnergy > 3.5 ? "high" : "moderate"}.`;
    } catch (e) {
        console.error("Pattern analysis failed:", e);
        return "Analysis failed.";
    }
}
