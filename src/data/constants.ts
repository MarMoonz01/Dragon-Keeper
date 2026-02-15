export interface Task {
    id: number;
    name: string;
    time: string; // HH:MM
    cat: 'work' | 'health' | 'ielts' | 'mind' | 'social';
    xp: number;
    done: boolean;
    calSync?: boolean;
    hp: number;
}

export interface Dragon {
    lv: number;
    name: string;
    em: string;
    trait: string;
    minBand?: number;
}

export interface Monster {
    name: string;
    em: string;
    maxHp: number;
    reward: number;
    level: number;
    type?: 'boss' | 'normal';
}

export interface Achievement {
    id: string;
    em: string;
    name: string;
    desc: string;
    max: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    prog: (tasks: Task[], doneTasks: Task[], stats: any) => number;
}

export const TASKS0: Task[] = [
    { id: 1, name: "Morning Meditation (10 min)", time: "06:30", cat: "mind", xp: 20, done: false, calSync: true, hp: 15 },
    { id: 2, name: "Drink 500ml water", time: "07:00", cat: "health", xp: 10, done: false, calSync: false, hp: 8 },
    { id: 3, name: "IELTS Reading (45 min)", time: "08:00", cat: "ielts", xp: 40, done: false, calSync: true, hp: 30 },
    { id: 4, name: "Workout — Upper Body", time: "09:30", cat: "health", xp: 50, done: false, calSync: true, hp: 45 },
    { id: 5, name: "Deep Work Block (2 hrs)", time: "11:00", cat: "work", xp: 60, done: false, calSync: true, hp: 50 },
    { id: 6, name: "Lunch + Walk (30 min)", time: "13:00", cat: "health", xp: 20, done: false, calSync: false, hp: 18 },
    { id: 7, name: "IELTS Listening Mock", time: "15:00", cat: "ielts", xp: 45, done: false, calSync: true, hp: 35 },
    { id: 8, name: "Vocabulary Review", time: "17:00", cat: "ielts", xp: 25, done: false, calSync: false, hp: 22 },
    { id: 9, name: "Evening Walk / Stretch", time: "19:00", cat: "health", xp: 20, done: false, calSync: true, hp: 15 },
    { id: 10, name: "Journal + Reflect", time: "21:30", cat: "mind", xp: 30, done: false, calSync: false, hp: 20 },
];

export const DRAGONS: Dragon[] = [
    { lv: 1, minBand: 0, name: "Ember Hatchling", em: "🥚", trait: "Curious & fragile" },
    { lv: 3, minBand: 0, name: "Spark Whelp", em: "🐣", trait: "First flames appear" },
    { lv: 6, minBand: 6.0, name: "Flame Fledgling", em: "🐲", trait: "Wings growing stronger" },
    { lv: 10, minBand: 6.5, name: "Blaze Drake", em: "🔥", trait: "Fierce and confident" },
    { lv: 15, minBand: 7.0, name: "Inferno Wyrm", em: "🐉", trait: "Ancient power awakens" },
    { lv: 20, minBand: 7.5, name: "Solar Leviathan", em: "🌞", trait: "Radiates the sun's power" },
    { lv: 30, minBand: 8.0, name: "Cosmic Elder", em: "🌌", trait: "One with the universe" },
];

export interface DragonSkill {
    band: number;
    skill: string;
    desc: string;
    xpMultiplier: number;
    em: string;
}

export const DRAGON_SKILLS: DragonSkill[] = [
    { band: 5.5, skill: "Ember Shield", desc: "Basic protection", xpMultiplier: 1.0, em: "🛡️" },
    { band: 6.0, skill: "Flame Tongue", desc: "Words grow sharper", xpMultiplier: 1.1, em: "🗡️" },
    { band: 6.5, skill: "Scholar's Eye", desc: "Reading comprehension deepens", xpMultiplier: 1.25, em: "👁️" },
    { band: 7.0, skill: "Dragon's Greed", desc: "Absorb 1.5× monster XP", xpMultiplier: 1.5, em: "💎" },
    { band: 7.5, skill: "Ancient Wisdom", desc: "XP doubled from IELTS tasks", xpMultiplier: 1.75, em: "📜" },
    { band: 8.0, skill: "Sovereign's Aura", desc: "All XP ×2.0", xpMultiplier: 2.0, em: "👑" },
    { band: 8.5, skill: "Mythic Presence", desc: "All XP ×2.5", xpMultiplier: 2.5, em: "🌟" },
    { band: 9.0, skill: "God Tier", desc: "All XP ×3.0", xpMultiplier: 3.0, em: "⚡" },
];

export const MONSTERS: Monster[] = [
    { name: "Procrastination Goblin", em: "👺", maxHp: 80, reward: 50, level: 1 },
    { name: "Fatigue Wraith", em: "👻", maxHp: 120, reward: 75, level: 2 },
    { name: "Distraction Demon", em: "😈", maxHp: 160, reward: 100, level: 3 },
    { name: "Burnout Dragon", em: "🦕", maxHp: 220, reward: 160, level: 4, type: 'boss' },
    { name: "Chaos Hydra", em: "🐍", maxHp: 300, reward: 250, level: 5, type: 'boss' },
    { name: "Void Titan", em: "👾", maxHp: 500, reward: 500, level: 10, type: 'boss' },
];

export const SHOP_ITEMS = [
    { id: "freeze", name: "Streak Freeze", em: "🧊", desc: "Protect your streak for one day.", cost: 200 },
    { id: "boost", name: "2× XP Potion", em: "⚡", desc: "Double XP for 24 hours.", cost: 300 },
    { id: "reset", name: "Schedule Reset", em: "📅", desc: "Reroll your daily tasks.", cost: 100 },
    { id: "heal", name: "Full Heal", em: "💖", desc: "Restore Dragon HP to max.", cost: 150 },
];

export const CHALLENGE_TEMPLATES = {
    daily: [
        { id: "d_ielts", text: "Complete 3 IELTS tasks", target: 3, reward: 50, type: "ielts" },
        { id: "d_health", text: "Complete 3 Health tasks", target: 3, reward: 40, type: "health" },
        { id: "d_focus", text: "Complete 2 Deep Work blocks", target: 2, reward: 60, type: "work" },
        { id: "d_mind", text: "Do 1 Mindfulness session", target: 1, reward: 30, type: "mind" },
        { id: "d_all", text: "Finish 5 tasks total", target: 5, reward: 50, type: "any" },
        { id: "d_xp", text: "Gain 200 XP", target: 200, reward: 40, type: "xp" },
    ],
    weekly: [
        { id: "w_monster", text: "Defeat 5 Monsters", target: 5, reward: 300, type: "monster" },
        { id: "w_streak", text: "Maintain 7-day Streak", target: 7, reward: 500, type: "streak" },
        { id: "w_ielts", text: "Complete 15 IELTS tasks", target: 15, reward: 400, type: "ielts" },
        { id: "w_vocab", text: "Add 20 new words to Notebook", target: 20, reward: 250, type: "vocab" },
    ]
};

export const ACHIEVEMENTS: Achievement[] = [
    // Streak
    { id: "streak_b", em: "🔥", name: "Spark Starter", desc: "3-day streak", max: 3, tier: "bronze", prog: (_, _2, s) => s.streak || 0 },
    { id: "streak_s", em: "🔥🔥", name: "Week Warrior", desc: "7-day streak", max: 7, tier: "silver", prog: (_, _2, s) => s.streak || 0 },
    { id: "streak_g", em: "🔥🔥🔥", name: "Monthly Master", desc: "30-day streak", max: 30, tier: "gold", prog: (_, _2, s) => s.streak || 0 },
    { id: "streak_p", em: "💎", name: "Centurion", desc: "100-day streak", max: 100, tier: "platinum", prog: (_, _2, s) => s.streak || 0 },

    // Tasks (Total)
    { id: "tasks_b", em: "📝", name: "Getting Started", desc: "Complete 10 tasks", max: 10, tier: "bronze", prog: (_, _2, s) => s.totalTasksStr || 0 },
    { id: "tasks_s", em: "📝", name: "Productivity Machine", desc: "Complete 100 tasks", max: 100, tier: "silver", prog: (_, _2, s) => s.totalTasksStr || 0 },
    { id: "tasks_g", em: "📝", name: "Task Titan", desc: "Complete 1000 tasks", max: 1000, tier: "gold", prog: (_, _2, s) => s.totalTasksStr || 0 },

    // IELTS
    { id: "ielts_b", em: "📚", name: "Student", desc: "10 IELTS tasks done", max: 10, tier: "bronze", prog: (_, _2, s) => s.ieltsTasks || 0 },
    { id: "ielts_s", em: "🎓", name: "Scholar", desc: "50 IELTS tasks done", max: 50, tier: "silver", prog: (_, _2, s) => s.ieltsTasks || 0 },
    { id: "ielts_g", em: "🏛️", name: "Professor", desc: "200 IELTS tasks done", max: 200, tier: "gold", prog: (_, _2, s) => s.ieltsTasks || 0 },

    // Writing
    { id: "write_b", em: "✍️", name: "Scribe", desc: "Write 5 essays", max: 5, tier: "bronze", prog: (_, _2, s) => s.essaysWritten || 0 },
    { id: "write_s", em: "🖋️", name: "Author", desc: "Write 20 essays", max: 20, tier: "silver", prog: (_, _2, s) => s.essaysWritten || 0 },
    { id: "write_g", em: "📜", name: "Novelist", desc: "Write 50 essays", max: 50, tier: "gold", prog: (_, _2, s) => s.essaysWritten || 0 },

    // Monsters
    { id: "mon_b", em: "⚔️", name: "Fighter", desc: "Defeat 3 monsters", max: 3, tier: "bronze", prog: (_, _2, s) => s.monstersDefeated || 0 },
    { id: "mon_s", em: "🏰", name: "Knight", desc: "Defeat 20 monsters", max: 20, tier: "silver", prog: (_, _2, s) => s.monstersDefeated || 0 },
    { id: "mon_g", em: "🐉", name: "Dragonslayer", desc: "Defeat 100 monsters", max: 100, tier: "gold", prog: (_, _2, s) => s.monstersDefeated || 0 },

    // Health
    { id: "fit_b", em: "🏃", name: "Mover", desc: "20 Health tasks", max: 20, tier: "bronze", prog: (_, _2, s) => s.healthTasks || 0 },
    { id: "fit_s", em: "💪", name: "Athlete", desc: "100 Health tasks", max: 100, tier: "silver", prog: (_, _2, s) => s.healthTasks || 0 },

    // Focus / Work
    { id: "focus_b", em: "🧠", name: "Concentrated", desc: "10 Deep Work blocks", max: 10, tier: "bronze", prog: (_, _2, s) => s.workTasks || 0 },
    { id: "focus_s", em: "⚡", name: "Flow State", desc: "50 Deep Work blocks", max: 50, tier: "silver", prog: (_, _2, s) => s.workTasks || 0 },

    // Level
    { id: "lvl_b", em: "🐣", name: "Hatchling", desc: "Reach Level 5", max: 5, tier: "bronze", prog: (_, _2, s) => s.dragonLevel || 1 },
    { id: "lvl_s", em: "🐲", name: "Drake", desc: "Reach Level 10", max: 10, tier: "silver", prog: (_, _2, s) => s.dragonLevel || 1 },
    { id: "lvl_g", em: "🐲", name: "Wyrm", desc: "Reach Level 20", max: 20, tier: "gold", prog: (_, _2, s) => s.dragonLevel || 1 },
    { id: "lvl_p", em: "👑", name: "Ascended", desc: "Reach Level 50", max: 50, tier: "platinum", prog: (_, _2, s) => s.dragonLevel || 1 },

    // Social / Hidden
    { id: "social_b", em: "👋", name: "Connector", desc: "Complete 5 Social tasks", max: 5, tier: "bronze", prog: (_, _2, s) => s.socialTasks || 0 },
    { id: "early_bird", em: "🌅", name: "Early Bird", desc: "Complete a task before 7am", max: 1, tier: "silver", prog: (_, _2, s) => s.earlyBird || 0 },
    { id: "night_owl", em: "🦉", name: "Night Owl", desc: "Complete a task after 11pm", max: 1, tier: "silver", prog: (_, _2, s) => s.nightOwl || 0 },
];

export const VOCAB = [
    { word: "Exacerbate", phonetic: "/ɪɡˈzæs.ər.beɪt/", type: "verb", def: "To make a problem or bad situation worse", example: "The drought exacerbated food shortages across the region.", mastery: 3 },
    { word: "Ubiquitous", phonetic: "/juːˈbɪk.wɪ.təs/", type: "adj", def: "Present, appearing, or found everywhere", example: "Mobile phones have become ubiquitous in modern society.", mastery: 4 },
    { word: "Mitigate", phonetic: "/ˈmɪt.ɪ.ɡeɪt/", type: "verb", def: "To lessen the severity or seriousness of", example: "Governments must mitigate the effects of climate change.", mastery: 2 },
    { word: "Pragmatic", phonetic: "/præɡˈmæt.ɪk/", type: "adj", def: "Dealing with things realistically and practically", example: "A pragmatic approach is needed to solve this issue.", mastery: 5 },
    { word: "Proliferation", phonetic: "/prəˌlɪf.ərˈeɪ.ʃən/", type: "noun", def: "A rapid increase in number or amount", example: "The proliferation of social media changed communication.", mastery: 1 },
    { word: "Disparate", phonetic: "/ˈdɪs.pər.ɪt/", type: "adj", def: "Essentially different; not able to be compared", example: "The study combines data from disparate sources.", mastery: 2 },
    { word: "Substantiate", phonetic: "/səbˈstæn.ʃi.eɪt/", type: "verb", def: "To prove the truth of something with evidence", example: "The new data substantiates the original hypothesis.", mastery: 3 },
    { word: "Incongruous", phonetic: "/ɪnˈkɒŋ.ɡru.əs/", type: "adj", def: "Not in harmony with surroundings; out of place", example: "The tower looked incongruous in the ancient village.", mastery: 1 },
];

export const ISKILLS = [
    { name: "Listening", ic: "🎧", sc: 7.0, color: "var(--teal)", hist: [6.5, 6.5, 7.0, 7.0] },
    { name: "Reading", ic: "📖", sc: 6.5, color: "var(--violet)", hist: [6.0, 6.5, 6.0, 6.5] },
    { name: "Writing", ic: "✍️", sc: 6.0, color: "var(--gold)", hist: [5.5, 6.0, 5.5, 6.0] },
    { name: "Speaking", ic: "🎤", sc: 6.5, color: "var(--rose)", hist: [6.0, 6.0, 6.5, 6.5] },
];

export const TOPICS = [
    "Describe a time when you helped someone in need",
    "Talk about a technology that changed your life significantly",
    "Describe your hometown and what makes it unique",
    "Talk about an important decision you made recently",
    "Describe a book or film that inspired you deeply",
];

export const WL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WD = [0, 0, 0, 0, 0, 0, 0];
export const CC = { health: "#34d399", work: "#00ddb3", ielts: "#a78bfa", mind: "#f0c040", social: "#ff5e87" };

export const ZONES = [
    { id: "scholar", name: "Scholar's Kingdom", ic: "📚", color: "#a78bfa", desc: "IELTS mastery path", goalLabel: "IELTS Exam Date" },
    { id: "iron", name: "Iron Citadel", ic: "🏋️", color: "#34d399", desc: "Health & fitness", goalLabel: "Fitness Goal Date" },
    { id: "dragon", name: "Dragon's Lair", ic: "⚔️", color: "#fb7185", desc: "Battle challenges", goalLabel: "Battle Mastery Date" },
    { id: "mindful", name: "Mindful Peaks", ic: "🧘", color: "#fccb58", desc: "Mind & meditation", goalLabel: "Mindfulness Goal Date" }
];

export const ZONE_MILESTONES = {
    scholar: [
        { key: "start", em: "🌅", title: "Diagnostic Test", desc: "Take a full practice test to find your baseline.", type: "normal", reward: 30, weight: 1 },
        { key: "vocab", em: "🏕️", title: "Vocabulary Foundation", desc: "Learn 200 core IELTS words. Daily vocab drills.", type: "normal", reward: 50, weight: 2 },
        { key: "grammar", em: "🌉", title: "Grammar Bridge", desc: "Master complex sentences and linking phrases.", type: "normal", reward: 60, weight: 2 },
        { key: "reading", em: "📖", title: "Reading Fortress", desc: "Speed reading, T/F/NG, matching headings.", type: "normal", reward: 70, weight: 2 },
        { key: "listen", em: "🎧", title: "Listening Cavern", desc: "Section 3 & 4 strategies. Note completion.", type: "normal", reward: 70, weight: 2 },
        { key: "mock1", em: "🏰", title: "Mid-Point Mock", desc: "Full mock test. Are you on track?", type: "boss", reward: 150, weight: 1 },
        { key: "writing", em: "🌋", title: "Writing Volcano", desc: "Task 1 & 2: argument structure, vocabulary range.", type: "normal", reward: 90, weight: 2 },
        { key: "speak", em: "🏛️", title: "Speaking Temple", desc: "Part 2 monologues, Part 3 deep discussions.", type: "normal", reward: 90, weight: 2 },
        { key: "review", em: "⚡", title: "Final Review", desc: "Full review of weak areas. Timed practice.", type: "normal", reward: 80, weight: 1 },
        { key: "summit", em: "🏔️", title: "Summit — Exam Day", desc: "You're ready. Conquer the exam!", type: "boss", reward: 300, weight: 1 },
    ],
    iron: [
        { key: "start", em: "🏃", title: "First Steps", desc: "Log your baseline health metrics.", type: "normal", reward: 30, weight: 1 },
        { key: "water", em: "💧", title: "Hydration Habit", desc: "Drink 2L water daily for 7 days.", type: "normal", reward: 60, weight: 2 },
        { key: "sleep", em: "💤", title: "Sleep Discipline", desc: "8hrs sleep for 14 consecutive nights.", type: "normal", reward: 60, weight: 2 },
        { key: "cardio", em: "👟", title: "Cardio Foundation", desc: "30-min cardio 5 days/week for 2 weeks.", type: "normal", reward: 80, weight: 2 },
        { key: "mid", em: "🏋️", title: "Strength Check", desc: "Hit strength benchmarks. Mid-point assessment.", type: "boss", reward: 150, weight: 1 },
        { key: "endure", em: "🔥", title: "Endurance Phase", desc: "Increase intensity. Push your limits.", type: "normal", reward: 100, weight: 2 },
        { key: "peak", em: "🏆", title: "Peak Performance", desc: "Achieve your fitness goal!", type: "boss", reward: 300, weight: 1 },
    ],
    dragon: [
        { key: "start", em: "⚔️", title: "Arena Gate", desc: "Win your first battle.", type: "normal", reward: 30, weight: 1 },
        { key: "goblin", em: "👺", title: "Goblin Slayer", desc: "Defeat 5 Procrastination Goblins.", type: "normal", reward: 60, weight: 2 },
        { key: "wraith", em: "👻", title: "Wraith Hunter", desc: "Defeat 3 Fatigue Wraiths consecutively.", type: "normal", reward: 80, weight: 2 },
        { key: "demon", em: "😈", title: "Demon Throne", desc: "Face the Distraction Demon. 3 consecutive wins.", type: "boss", reward: 200, weight: 2 },
        { key: "dragon", em: "🐉", title: "Dragon's Heart", desc: "The final boss. Defeat the Burnout Dragon!", type: "boss", reward: 400, weight: 1 },
    ],
    mindful: [
        { key: "start", em: "🌸", title: "Zen Garden", desc: "Complete your first mindfulness session.", type: "normal", reward: 30, weight: 1 },
        { key: "med7", em: "🧘", title: "7-Day Meditation", desc: "Meditate every day for a week.", type: "normal", reward: 70, weight: 2 },
        { key: "journal", em: "📝", title: "Reflection Practice", desc: "Journal daily for 14 days.", type: "normal", reward: 80, weight: 2 },
        { key: "deep", em: "🌊", title: "Deep Practice", desc: "20-min sessions. Breath work + body scan.", type: "normal", reward: 90, weight: 2 },
        { key: "peak", em: "✨", title: "Enlightenment", desc: "21-day meditation streak. Inner peace.", type: "boss", reward: 250, weight: 1 },
    ]
};
