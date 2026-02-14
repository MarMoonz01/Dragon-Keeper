import React from 'react';
import { useTasks } from '../context/TaskContext';

export default function Toast() {
    const { toast } = useTasks();

    if (!toast) return null;

    return (
        <div className="toast">
            <div className="t-ic">{toast.icon}</div>
            <div><div className="t-tl">{toast.title}</div><div className="t-msg">{toast.msg}</div></div>
        </div>
    );
}
