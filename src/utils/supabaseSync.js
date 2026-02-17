import { supabase } from './supabaseClient';

// ── Debounced Game State Writer ─────────────────────────────────────
// Accumulates dirty columns and flushes them in a single UPDATE every 1.5s.

let dirtyColumns = {};
let flushTimer = null;
const DEBOUNCE_MS = 1500;

export function queueGameStateUpdate(column, value) {
    if (!supabase) return;
    dirtyColumns[column] = value;

    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flushGameState, DEBOUNCE_MS);
}

export async function flushGameState() {
    if (!supabase || Object.keys(dirtyColumns).length === 0) return;

    const payload = { ...dirtyColumns, updated_at: new Date().toISOString() };
    dirtyColumns = {};
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }

    try {
        const { error } = await supabase
            .from('game_state')
            .update(payload)
            .eq('id', 1);
        if (error) console.error('game_state flush error:', error);
    } catch (e) {
        console.error('game_state flush failed:', e);
    }
}

// Flush on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (Object.keys(dirtyColumns).length > 0) {
            // Use sendBeacon-friendly approach: navigator.sendBeacon isn't great for
            // Supabase REST, so we do a synchronous-ish flush via the existing method.
            // The browser may or may not complete this, but it's best-effort.
            flushGameState();
        }
    });
}

// ── Game State Loader ───────────────────────────────────────────────

export async function loadGameState() {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('game_state')
            .select('*')
            .eq('id', 1)
            .single();
        if (error) { console.error('loadGameState error:', error); return null; }
        return data;
    } catch (e) {
        console.error('loadGameState failed:', e);
        return null;
    }
}

// ── Profile CRUD ────────────────────────────────────────────────────

const PROFILE_KEY_MAP = {
    wakeTime: 'wake_time',
    sleepTime: 'sleep_time',
    freeSlots: 'free_slots',
    currentBand: 'current_band',
    exerciseDays: 'exercise_days',
};

function profileToDb(profile) {
    if (!profile) return {};
    const row = {};
    for (const [jsKey, val] of Object.entries(profile)) {
        const dbKey = PROFILE_KEY_MAP[jsKey] || jsKey;
        row[dbKey] = val;
    }
    return row;
}

function profileFromDb(row) {
    if (!row) return null;
    const reverseMap = Object.fromEntries(
        Object.entries(PROFILE_KEY_MAP).map(([js, db]) => [db, js])
    );
    const profile = {};
    for (const [dbKey, val] of Object.entries(row)) {
        if (dbKey === 'id' || dbKey === 'updated_at') continue;
        const jsKey = reverseMap[dbKey] || dbKey;
        profile[jsKey] = val;
    }
    return profile;
}

export async function loadProfile() {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('user_profile')
            .select('*')
            .eq('id', 1)
            .single();
        if (error) { console.error('loadProfile error:', error); return null; }
        // Check if the row has meaningful data (not just the seeded empty row)
        if (!data.name && !data.goals?.length && !data.wake_time) return null;
        return profileFromDb(data);
    } catch (e) {
        console.error('loadProfile failed:', e);
        return null;
    }
}

export async function saveProfile(profile) {
    if (!supabase || !profile) return;
    try {
        const row = { ...profileToDb(profile), id: 1, updated_at: new Date().toISOString() };
        const { error } = await supabase
            .from('user_profile')
            .upsert([row], { onConflict: 'id' });
        if (error) console.error('saveProfile error:', error);
    } catch (e) {
        console.error('saveProfile failed:', e);
    }
}

// ── Writing History ─────────────────────────────────────────────────

export async function loadWritingHistory() {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('writing_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) { console.error('loadWritingHistory error:', error); return null; }
        if (!data || data.length === 0) return null;
        // Map DB rows back to the app's camelCase format
        return data.map(row => ({
            date: row.date,
            taskId: row.task_id,
            taskType: row.task_type,
            text: row.text,
            wc: row.wc,
            band: row.band,
            ta: row.ta,
            cc: row.cc,
            lr: row.lr,
            gra: row.gra,
            strengths: row.strengths,
            improve: row.improve,
        }));
    } catch (e) {
        console.error('loadWritingHistory failed:', e);
        return null;
    }
}

export async function addWritingHistoryEntry(result) {
    if (!supabase || !result) return;
    try {
        const { error } = await supabase
            .from('writing_history')
            .insert([{
                date: result.date,
                task_id: result.taskId,
                task_type: result.taskType,
                text: result.text,
                wc: result.wc,
                band: result.band,
                ta: result.ta,
                cc: result.cc,
                lr: result.lr,
                gra: result.gra,
                strengths: result.strengths,
                improve: result.improve,
            }]);
        if (error) console.error('addWritingHistoryEntry error:', error);
    } catch (e) {
        console.error('addWritingHistoryEntry failed:', e);
    }
}
