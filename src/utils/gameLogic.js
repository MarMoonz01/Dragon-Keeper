import { MONSTERS } from '../data/constants';

// Procedurally generate a monster based on player level
export const generateRandomMonster = (playerLevel) => {
    // 1. Pick a base monster template
    // We want monsters roughly around the player's level, but with some variance
    const candidates = MONSTERS.filter(m => Math.abs(m.lv - playerLevel) <= 2) || [];

    // Fallback if no close match
    const template = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : MONSTERS[Math.floor(Math.random() * MONSTERS.length)];

    // 2. Apply variance to stats
    const variance = (Math.random() * 0.4) + 0.8; // 0.8x to 1.2x

    const hp = Math.round(template.hp * variance);
    const xp = Math.round(template.xp * variance);

    // 3. Generate a unique name? (Optional)
    const prefixes = ["Angry", "Fierce", "Shadow", "Ancient", "Toxic", "Void"];
    const name = Math.random() > 0.7
        ? `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${template.name}`
        : template.name;

    return {
        ...template,
        name,
        hp,
        maxHp: hp,
        xp
    };
};

export const getNextLevelXP = (level) => {
    return Math.floor(100 * Math.pow(1.2, level - 1));
};
