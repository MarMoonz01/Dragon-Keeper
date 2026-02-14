import React from 'react';
import { useGame } from '../context/GameContext';
import { DRAGONS } from '../data/constants';

export default function LevelUpModal() {
    const { levelUp, setLevelUp } = useGame();

    if (!levelUp) return null;

    const dragon = DRAGONS.reduce((s, st) => levelUp >= st.lv ? st : s, DRAGONS[0]);
    const exactMatch = DRAGONS.find(d => d.lv === levelUp);

    return (
        <div className="luov" onClick={() => setLevelUp(null)}>
            <div className="luc">
                <span className="lu-em">{dragon.em}</span>
                <div className="lu-t">LEVEL UP!</div>
                <div className="lu-n">Level {levelUp}</div>
                <div className="lu-m">
                    Your dragon grows stronger!
                    <br />
                    {exactMatch && ("You've evolved into a " + exactMatch.name + "!")}
                </div>
                <button className="btn btn-g" style={{ margin: "0 auto" }} onClick={() => setLevelUp(null)}>Continue Journey ✦</button>
            </div>
        </div>
    );
}
