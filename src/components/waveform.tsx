// Waveform.tsx
import { useEffect, useRef } from "react";

type WaveformProps = {
  //   audioRef: React.RefObject<HTMLAudioElement>;
  audioRef: any;
  playing: boolean;
};

export default function Waveform({ audioRef, playing }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioRef.current) return;
    // lazy-init audio context on user gesture or first play
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn("Web Audio not supported");
        return;
      }
    }
    const audioCtx = audioCtxRef.current;

    if (!analyserRef.current) {
      analyserRef.current = audioCtx.createAnalyser();
      analyserRef.current.fftSize = 256;
      dataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }

    if (!sourceRef.current) {
      try {
        sourceRef.current = audioCtx.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioCtx.destination);
      } catch (e) {
        // createMediaElementSource will throw if audio element belongs to different origin or if already connected
      }
    }

    const ctx = canvas.getContext("2d")!;
    const draw = () => {
      if (!analyserRef.current || !dataRef.current) return;
      analyserRef.current.getByteFrequencyData(dataRef.current);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barWidth = w / dataRef.current.length;
      for (let i = 0; i < dataRef.current.length; i++) {
        const v = dataRef.current[i] / 255;
        const barH = v * h;
        const x = i * barWidth;
        ctx.fillStyle = `rgba(${44}, ${156}, ${255}, ${0.7})`;
        ctx.fillRect(x, h - barH, barWidth * 0.9, barH);
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    if (playing) {
      // resume audio context (required by browsers after user gesture)
      audioCtx.resume().then(() => {
        if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);
      });
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audioRef, playing]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={60}
      style={{
        width: "100%",
        height: 60,
        borderRadius: 6,
        background: "transparent",
      }}
    />
  );
}
