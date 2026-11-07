import { useEffect, useRef } from "react";
import { readHudAccent, rgba, type HudAccent } from "../../lib/hudAccent";

interface Props {
  energy?: number;
  voiceTick?: number;
  listening?: boolean;
  thinking?: boolean;
  speaking?: boolean;
  className?: string;
}

type Vec3 = [number, number, number];

type OrbState = {
  energy: number;
  voiceTick: number;
  listening: boolean;
  thinking: boolean;
  speaking: boolean;
};

function rotY([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

function rotX(v: Vec3, a: number): Vec3 {
  const [x, y, z] = v;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

/** Chaotic filament orb — colors follow focus-mode accent; pulses on Iris speech. */
export function KaraFilamentOrb({
  energy = 0,
  voiceTick = 0,
  listening,
  thinking,
  speaking,
  className = "",
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const stateRef = useRef<OrbState>({
    energy: 0,
    voiceTick: 0,
    listening: false,
    thinking: false,
    speaking: false,
  });
  stateRef.current = {
    energy,
    voiceTick,
    listening: Boolean(listening),
    thinking: Boolean(thinking),
    speaking: Boolean(speaking),
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const filaments: Vec3[][] = [];
    const rng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    };
    const rand = rng(90210);
    const FIL = 120;
    const SEG = 5;
    for (let f = 0; f < FIL; f++) {
      const pts: Vec3[] = [];
      const u = rand() * Math.PI * 2;
      const v = Math.acos(2 * rand() - 1);
      const axis: Vec3 = [Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)];
      const twist = rand() * 6.28;
      const rad = 0.55 + rand() * 0.38;
      for (let s = 0; s < SEG; s++) {
        const t = s / (SEG - 1);
        const wobble = (rand() - 0.5) * 0.22;
        const r = rad * (0.85 + 0.2 * Math.sin(t * 5 + twist));
        const along = t * 1.6 - 0.8;
        pts.push([
          axis[0] * along * 0.35 + (rand() - 0.5) * wobble,
          axis[1] * along * 0.35 + (rand() - 0.5) * wobble,
          axis[2] * along * 0.35 + (rand() - 0.5) * wobble,
        ]);
        const len = Math.hypot(pts[s][0], pts[s][1], pts[s][2]) || 1;
        pts[s] = [(pts[s][0] / len) * r, (pts[s][1] / len) * r, (pts[s][2] / len) * r];
      }
      filaments.push(pts);
    }

    const nodes: Vec3[] = [];
    for (let i = 0; i < 48; i++) {
      const u = rand() * Math.PI * 2;
      const v = Math.acos(2 * rand() - 1);
      const r = 0.35 + rand() * 0.55;
      nodes.push([r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u)]);
    }

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let lastVoiceTick = -1;
    let speakBurst = 0;
    let smoothEnergy = 0;

    const draw = (now: number) => {
      const { energy, voiceTick: tick, listening: listen, thinking: think, speaking: talk } = stateRef.current;
      if (tick !== lastVoiceTick) {
        lastVoiceTick = tick;
        if (tick > 0) speakBurst = 1;
      }
      speakBurst *= talk ? 0.86 : 0.92;
      const targetEnergy = Math.min(1.2, energy + speakBurst * 0.65 + (talk ? 0.28 : 0));
      smoothEnergy += (targetEnergy - smoothEnergy) * 0.14;

      const w = canvas.width;
      const h = canvas.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h) * 0.46;
      const accent: HudAccent = readHudAccent();

      const speed = talk ? 1.75 + smoothEnergy * 0.6 : listen ? 0.55 : think ? 1.15 : 0.22;
      const t = reduce ? 0 : now * 0.001;
      const yaw = t * speed * (think ? -1 : 1);
      const pitch = 0.35 + Math.sin(t * 0.31) * 0.08;
      const pulseHz = talk ? 10 + smoothEnergy * 4 : 3;
      const pulse = 1 + Math.sin(t * pulseHz) * (talk ? 0.11 : 0.05) + smoothEnergy * 0.18;

      ctx.clearRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 1.18);
      glow.addColorStop(0, rgba(accent.light, 0.22 + smoothEnergy * 0.35));
      glow.addColorStop(0.15, rgba(accent.mid, 0.45 + smoothEnergy * 0.25));
      glow.addColorStop(0.5, rgba(accent.core, 0.22));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const project = (p: Vec3): [number, number, number] => {
        const v = rotY(rotX(p, pitch), yaw);
        const depth = v[2];
        const persp = 1 / (1.15 - depth * 0.35);
        return [cx + v[0] * base * persp, cy + v[1] * base * persp, depth];
      };

      for (let ri = 0; ri < 3; ri++) {
        const tilt = pitch + ri * 0.55 + t * 0.15 * (ri + 1);
        ctx.beginPath();
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          const p = rotY(rotX([Math.cos(a) * 0.92, 0, Math.sin(a) * 0.92], tilt), yaw * 0.7);
          const persp = 1 / (1.15 - p[2] * 0.35);
          const x = cx + p[0] * base * persp;
          const y = cy + p[1] * base * persp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(accent.mid, 0.1 + ri * 0.05 + (talk ? 0.08 : 0));
        ctx.lineWidth = (1.1 + (talk ? 0.4 : 0)) * (w / 400);
        ctx.stroke();
      }

      const drawLine = (pts: Vec3[], alpha: number) => {
        ctx.beginPath();
        let first = true;
        for (const p of pts) {
          const [x, y] = project(p);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else ctx.lineTo(x, y);
        }
        const mix = accent.mid.map((n, i) => Math.round(n * 0.55 + accent.core[i]! * 0.45)) as [number, number, number];
        ctx.strokeStyle = rgba(mix, 0.07 + alpha * (talk ? 0.68 : 0.48));
        ctx.lineWidth = (0.55 + alpha * (talk ? 2 : 1.3) + speakBurst * 0.8) * (w / 400);
        ctx.stroke();
      };

      const sorted = [...filaments].map((pts) => {
        const mid = pts[Math.floor(pts.length / 2)];
        const [, , d] = project(mid);
        return { pts, d };
      });
      sorted.sort((a, b) => a.d - b.d);
      for (const { pts, d } of sorted) {
        const alpha = 0.45 + (d + 1) * 0.3;
        drawLine(pts, alpha);
      }

      for (const n of nodes) {
        const [x, y, d] = project(n);
        const a = 0.25 + (d + 1) * 0.35;
        ctx.fillStyle = rgba(accent.light, 0.12 + a * (talk ? 0.45 : 0.3));
        ctx.beginPath();
        ctx.arc(x, y, (1.2 + a * 0.8 + speakBurst * 1.2) * (w / 400), 0, Math.PI * 2);
        ctx.fill();
      }

      const coreR = base * (0.2 + smoothEnergy * 0.06) * pulse;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0, rgba(accent.light, 0.95));
      core.addColorStop(0.35, rgba(accent.mid, 0.85));
      core.addColorStop(0.72, rgba(accent.core, 0.55));
      core.addColorStop(1, rgba(accent.deep, 0));
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      if (!reduce) raf.current = requestAnimationFrame(draw);
    };

    if (reduce) draw(performance.now());
    else raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={`absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}
