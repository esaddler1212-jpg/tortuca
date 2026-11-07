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

type Drifter = {
  base: Vec3;
  axis: Vec3;
  speed: number;
  phase: number;
  size: number;
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

function rotZ([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z];
}

function rotAround(p: Vec3, axis: Vec3, a: number): Vec3 {
  const [kx, ky, kz] = norm(axis);
  const [x, y, z] = p;
  const dot = kx * x + ky * y + kz * z;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const cx = ky * z - kz * y;
  const cy = kz * x - kx * z;
  const cz = kx * y - ky * x;
  return [x * c + cx * s + kx * dot * (1 - c), y * c + cy * s + ky * dot * (1 - c), z * c + cz * s + kz * dot * (1 - c)];
}

function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

type Filament = { pts: Vec3[]; spinAxis: Vec3; spinRate: number; phase: number };

/** Filament core + satellite orbs — accent-themed; tumbles on all axes; pulses with Iris speech. */
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

    const rng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    };
    const rand = rng(90210);

    const filaments: Filament[] = [];
    const FIL = 110;
    const SEG = 6;
    for (let f = 0; f < FIL; f++) {
      const pts: Vec3[] = [];
      const u = rand() * Math.PI * 2;
      const v = Math.acos(2 * rand() - 1);
      const axis: Vec3 = [Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)];
      const twist = rand() * 6.28;
      const rad = 0.48 + rand() * 0.48;
      for (let s = 0; s < SEG; s++) {
        const t = s / (SEG - 1);
        const wobble = (rand() - 0.5) * 0.28;
        const r = rad * (0.8 + 0.25 * Math.sin(t * 5 + twist));
        const along = t * 1.6 - 0.8;
        pts.push([
          axis[0] * along * 0.35 + (rand() - 0.5) * wobble,
          axis[1] * along * 0.35 + (rand() - 0.5) * wobble,
          axis[2] * along * 0.35 + (rand() - 0.5) * wobble,
        ]);
        const len = Math.hypot(pts[s][0], pts[s][1], pts[s][2]) || 1;
        pts[s] = [(pts[s][0] / len) * r, (pts[s][1] / len) * r, (pts[s][2] / len) * r];
      }
      const spinAxis = norm([
        rand() - 0.5,
        rand() - 0.5,
        rand() - 0.5,
      ]);
      filaments.push({
        pts,
        spinAxis,
        spinRate: (rand() * 1.6 + 0.35) * (rand() > 0.5 ? 1 : -1),
        phase: rand() * Math.PI * 2,
      });
    }

    const drifters: Drifter[] = [];
    for (let i = 0; i < 40; i++) {
      const u = rand() * Math.PI * 2;
      const v = Math.acos(2 * rand() - 1);
      const r = 0.25 + rand() * 0.65;
      drifters.push({
        base: [r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u)],
        axis: norm([rand() - 0.5, rand() - 0.5, rand() - 0.5]),
        speed: (rand() * 1.4 + 0.25) * (rand() > 0.5 ? 1 : -1),
        phase: rand() * Math.PI * 2,
        size: 0.8 + rand() * 1.6,
      });
    }

    const nodes: Vec3[] = [];
    for (let i = 0; i < 40; i++) {
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
      speakBurst *= talk ? 0.84 : 0.9;
      const targetEnergy = Math.min(1.35, energy + speakBurst * 0.72 + (talk ? 0.35 : listen ? 0.15 : 0));
      smoothEnergy += (targetEnergy - smoothEnergy) * 0.16;

      const w = canvas.width;
      const h = canvas.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h) * 0.46;
      const accent: HudAccent = readHudAccent();

      const motor = talk ? 2.1 + smoothEnergy * 0.9 : listen ? 0.65 : think ? 1.25 : 0.38;
      const t = reduce ? 0 : now * 0.001;
      const yaw = t * motor * (think ? -1 : 1);
      const pitch = 0.42 + Math.sin(t * 0.37) * 0.18;
      const roll = t * motor * 0.62 * (listen ? -0.5 : 1);
      const pulseHz = talk ? 11 + smoothEnergy * 5 : 3.2;
      const pulse = 1 + Math.sin(t * pulseHz) * (talk ? 0.14 : 0.06) + smoothEnergy * 0.22;

      ctx.clearRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 1.22);
      glow.addColorStop(0, rgba(accent.light, 0.28 + smoothEnergy * 0.4));
      glow.addColorStop(0.12, rgba(accent.mid, 0.55 + smoothEnergy * 0.28));
      glow.addColorStop(0.48, rgba(accent.core, 0.28));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const world = (p: Vec3): Vec3 => rotZ(rotY(rotX(p, pitch), yaw), roll);

      const project = (p: Vec3): [number, number, number] => {
        const v = world(p);
        const depth = v[2];
        const persp = 1 / (1.12 - depth * 0.38);
        return [cx + v[0] * base * persp, cy + v[1] * base * persp, depth];
      };

      for (let ri = 0; ri < 4; ri++) {
        const ringTilt = pitch + ri * 0.78 + t * 0.22 * (ri + 1) * (ri % 2 ? -1 : 1);
        const ringRoll = roll * (0.4 + ri * 0.2);
        ctx.beginPath();
        const steps = 72;
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          const p0: Vec3 = [Math.cos(a) * 0.94, 0, Math.sin(a) * 0.94];
          const p = rotZ(rotY(rotX(p0, ringTilt), yaw * (0.7 + ri * 0.08)), ringRoll);
          const persp = 1 / (1.12 - p[2] * 0.38);
          const x = cx + p[0] * base * persp;
          const y = cy + p[1] * base * persp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(accent.mid, 0.12 + ri * 0.04 + (talk ? 0.1 : 0));
        ctx.lineWidth = (1 + (talk ? 0.5 : 0)) * (w / 400);
        ctx.stroke();
      }

      const drawPts = (pts: Vec3[], alpha: number, extra: number) => {
        ctx.beginPath();
        let first = true;
        for (const p of pts) {
          const [x, y] = project(p);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else ctx.lineTo(x, y);
        }
        const mix = accent.mid.map((n, i) => Math.round(n * 0.5 + accent.core[i]! * 0.5)) as [number, number, number];
        ctx.strokeStyle = rgba(mix, 0.1 + alpha * (talk ? 0.75 : 0.52) + speakBurst * 0.15);
        ctx.lineWidth = (0.5 + alpha * (talk ? 2.2 : 1.4) + extra) * (w / 400);
        ctx.stroke();
      };

      const lines: { pts: Vec3[]; d: number; extra: number }[] = [];
      for (const fil of filaments) {
        const spin = t * fil.spinRate * motor + fil.phase;
        const pts = fil.pts.map((p) => rotAround(p, fil.spinAxis, spin));
        const mid = pts[Math.floor(pts.length / 2)]!;
        const [, , d] = project(mid);
        lines.push({ pts, d, extra: speakBurst * 0.6 });
      }
      lines.sort((a, b) => a.d - b.d);
      for (const { pts, d, extra } of lines) {
        drawPts(pts, 0.4 + (d + 1) * 0.32, extra);
      }

      for (const n of nodes) {
        const wobble = rotAround(n, norm([0, 1, 0]), t * motor * 0.4);
        const [x, y, d] = project(wobble);
        const a = 0.28 + (d + 1) * 0.36;
        ctx.fillStyle = rgba(accent.light, 0.15 + a * (talk ? 0.5 : 0.32));
        ctx.beginPath();
        ctx.arc(x, y, (1 + a * 0.9 + speakBurst) * (w / 400), 0, Math.PI * 2);
        ctx.fill();
      }

      const sortedDrifters = drifters.map((d) => {
        const angle = t * d.speed * motor * 1.15 + d.phase;
        const p = rotAround(d.base, d.axis, angle);
        const [, , depth] = project(p);
        return { p, depth, size: d.size };
      });
      sortedDrifters.sort((a, b) => a.depth - b.depth);
      for (const { p, depth, size } of sortedDrifters) {
        const [x, y] = project(p);
        const a = 0.35 + (depth + 1) * 0.35;
        const rPx = (size + smoothEnergy * 1.5 + speakBurst * 2) * (w / 400) * (talk ? 1.15 : 1);
        const g = ctx.createRadialGradient(x, y, 0, x, y, rPx * 2.2);
        g.addColorStop(0, rgba(accent.light, 0.75 * a));
        g.addColorStop(0.45, rgba(accent.mid, 0.35 * a));
        g.addColorStop(1, rgba(accent.core, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rPx, 0, Math.PI * 2);
        ctx.fill();
      }

      const coreR = base * (0.19 + smoothEnergy * 0.08) * pulse;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0, rgba(accent.light, 1));
      core.addColorStop(0.32, rgba(accent.mid, 0.92));
      core.addColorStop(0.68, rgba(accent.core, 0.6));
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
