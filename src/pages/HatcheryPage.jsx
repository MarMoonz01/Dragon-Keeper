import React from 'react';
import BattleMode from '../components/BattleMode';
import DragonPanel from '../components/DragonPanel';
import { DRAGONS, ACHIEVEMENTS } from '../data/constants';

export default function HatcheryPage({ tasks, dragon, stats, onDefeat, streak }) {
    const unlocked = ACHIEVEMENTS.map(a => ({
        ...a,
        cur: Math.min(a.max, a.prog(null, tasks, { ...stats, dragonLevel: dragon.level, streak })),
        done: a.prog(null, tasks, { ...stats, dragonLevel: dragon.level, streak }) >= a.max
    }));
    return (
        <div>
            <div className="ph"><div className="ph-title">Dragon Hatchery</div><div className="ph-sub">Battle monsters · Earn achievements · Evolve your dragon</div></div>
            <div className="gm">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <BattleMode tasks={tasks} defeated={stats.monstersDefeated || 0} onDefeat={onDefeat} />
                    <div className="card">
                        <div className="ct">🏆 Achievements</div>
                        <div className="g2">
                            {unlocked.map(a => (
                                <div key={a.id} className={"ach" + (a.done ? " unlocked" : "")}>
                                    <div className="ach-em">{a.em}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="ach-n">{a.name}</div>
                                        <div className="ach-d">{a.desc}</div>
                                        <div className="ach-pb"><div className="ach-pf" style={{ width: Math.min(100, a.cur / a.max * 100) + "%" }} /></div>
                                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t2)", marginTop: 3 }}>{a.cur}/{a.max}</div>
                                    </div>
                                    {a.done && <span className="badge bt">✓</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <DragonPanel xp={dragon.xp} lv={dragon.level} done={tasks.filter(t => t.done).length} streak={streak} tasks={tasks} />
                    <div className="card">
                        <div className="ct">Evolution Path</div>
                        <div className="tl">
                            {DRAGONS.map((d, i) => (
                                <div key={i} className="tli">
                                    <div className={"tld" + (dragon.level >= d.lv ? " y" : "") + (dragon.level === d.lv ? " act" : "")} />
                                    <div className="tlt">Lv {d.lv}+</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 18 }}>{d.em}</span>
                                        <div>
                                            <div className="tln" style={{ color: dragon.level >= d.lv ? "var(--gold)" : "var(--t3)" }}>{d.name}</div>
                                            <div style={{ fontSize: 10, color: "var(--t2)" }}>{d.trait}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
