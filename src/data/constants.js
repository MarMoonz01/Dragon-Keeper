export const TASKS0 = [
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
export const DRAGONS = [
    { lv: 1, name: "Ember Hatchling", em: "🥚", trait: "Curious & fragile" },
    { lv: 3, name: "Spark Whelp", em: "🐣", trait: "First flames appear" },
    { lv: 6, name: "Flame Fledgling", em: "🐲", trait: "Wings growing stronger" },
    { lv: 10, name: "Blaze Drake", em: "🔥", trait: "Fierce and confident" },
    { lv: 15, name: "Inferno Wyrm", em: "🐉", trait: "Ancient power awakens" },
];
export const MONSTERS = [
    { name: "Procrastination Goblin", em: "👺", maxHp: 80, reward: 50, level: 1 },
    { name: "Fatigue Wraith", em: "👻", maxHp: 120, reward: 75, level: 2 },
    { name: "Distraction Demon", em: "😈", maxHp: 160, reward: 100, level: 3 },
    { name: "Burnout Dragon", em: "🦕", maxHp: 220, reward: 160, level: 4 },
];
export const ACHIEVEMENTS = [
    { id: "first", em: "🌟", name: "First Light", desc: "Complete your first task", max: 1, prog: (_, d) => d.filter(x => x.done).length },
    { id: "scholar", em: "📚", name: "IELTS Scholar", desc: "Complete 10 IELTS tasks", max: 10, prog: (_, d) => d.filter(x => x.cat === "ielts" && x.done).length },
    { id: "warrior", em: "⚔️", name: "Battle Warrior", desc: "Defeat 3 monsters", max: 3, prog: (_, _2, s) => s.monstersDefeated || 0 },
    { id: "streak7", em: "🔥", name: "Week Warrior", desc: "7-day streak", max: 7, prog: (_, _2, s) => s.streak || 0 },
    { id: "lvl10", em: "💎", name: "Dragon Master", desc: "Reach Level 10", max: 10, prog: (_, _2, s) => s.dragonLevel || 1 },
    { id: "health20", em: "❤️", name: "Health Champion", desc: "20 health tasks done", max: 20, prog: (_, d) => d.filter(x => x.cat === "health" && x.done).length },
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
