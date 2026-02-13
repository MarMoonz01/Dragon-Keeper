import React from 'react';

export default function MiniCal({ hi = [] }) {
    const n = new Date(), y = n.getFullYear(), m = n.getMonth();
    const fd = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate(), dip = new Date(y, m, 0).getDate();
    const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = [];
    for (let i = fd - 1; i >= 0; i--) days.push({ d: dip - i, o: true });
    for (let d = 1; d <= dim; d++) days.push({ d, o: false });
    while (days.length < 35) days.push({ d: days.length - dim - fd + 1, o: true });
    return (
        <div className="mcal">
            <div className="mch"><div className="mct">{MN[m]} {y}</div></div>
            <div className="mcg">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} className="mcdh">{d}</div>)}
                {days.slice(0, 35).map((day, i) => (
                    <div key={i} className={`mcd${day.o ? " om" : ""}${day.d === n.getDate() && !day.o ? " today" : ""}${!day.o && hi.includes(day.d) ? " he" : ""}`}>{day.d}</div>
                ))}
            </div>
        </div>
    );
}
