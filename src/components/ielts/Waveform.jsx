import React, { useRef, useEffect } from 'react';

export default function Waveform({ isRecording, analyserRef }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;

        if (!isRecording || !analyserRef.current) {
            ctx.clearRect(0, 0, W, H);
            ctx.strokeStyle = "rgba(45,212,191,0.3)";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
            return;
        }

        const analyser = analyserRef.current;
        const bufLen = analyser.frequencyBinCount;
        const dataArr = new Uint8Array(bufLen);

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArr);
            ctx.clearRect(0, 0, W, H);
            const grad = ctx.createLinearGradient(0, 0, W, 0);
            grad.addColorStop(0, "#a78bfa");
            grad.addColorStop(0.5, "#2dd4bf");
            grad.addColorStop(1, "#fccb58");
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = "round";
            ctx.beginPath();
            const sliceW = W / bufLen;
            let x = 0;
            for (let i = 0; i < bufLen; i++) {
                const v = dataArr[i] / 128.0;
                const y = (v * H) / 2;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                x += sliceW;
            }
            ctx.lineTo(W, H / 2);
            ctx.stroke();
        };
        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [isRecording]);

    return (
        <canvas ref={canvasRef} width={340} height={56} className="waveform-canvas" />
    );
}
