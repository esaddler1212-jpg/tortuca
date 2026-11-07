import { useEffect, useRef } from "react";

interface Props {
  /** 0–1 extra energy (voice + phase). */
  energy?: number;
  listening?: boolean;
  thinking?: boolean;
  speaking?: boolean;
  className?: string;
}

type Vec3 = [number, number, number];

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

/** K.A.R.A.-style chaotic red filament orb (Original 01). */
export function KaraFilamentOrb({ energy = 0, listening, thinking, speaking, className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

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

    let t0 = performance.now();
    const draw = (now: number) => {
      t0 = now;
      const w = canvas.width;
      const h = canvas.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h) * 0.46;

      const speed = speaking ? 1.4 : listening ? 0.55 : thinking ? 1.1 : 0.22;
      const t = reduce ? 0 : now * 0.001;
      const yaw = t * speed * (thinking ? -1 : 1);
      const pitch = 0.35 + Math.sin(t * 0.31) * 0.08;
      const pulse = 1 + Math.sin(t * (speaking ? 8 : 3)) * 0.06 + energy * 0.22;

      ctx.clearRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 1.15);
      glow.addColorStop(0, `rgba(255, 230, 245, ${0.35 + energy * 0.2})`);
      glow.addColorStop(0.12, `rgba(255, 120, 140, ${0.55 + energy * 0.15})`);
      glow.addColorStop(0.45, `rgba(220, 40, 60, 0.25)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const project = (p: Vec3): [number, number, number] => {
        let v = rotY(rotX(p, pitch), yaw);
        const depth = v[2];
        const persp = 1 / (1.15 - depth * 0.35);
        return [cx + v[0] * base * persp, cy + v[1] * base * persp, depth];
      };

      // faint orbital rings
      ctx.save();
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
        ctx.strokeStyle = `rgba(255, 90, 110, ${0.12 + ri * 0.06})`;
        ctx.lineWidth = 1.2 * (w / 400);
        ctx.stroke();
      }
      ctx.restore();

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
        ctx.strokeStyle = `rgba(255, ${70 + Math.floor(alpha * 80)}, 95, ${0.08 + alpha * 0.55})`;
        ctx.lineWidth = (0.6 + alpha * 1.4) * (w / 400);
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
        ctx.fillStyle = `rgba(255, ${200 + Math.floor(a * 40)}, 220, ${0.15 + a * 0.35})`;
        ctx.beginPath();
        ctx.arc(x, y, (1.2 + a * 0.8) * (w / 400), 0, Math.PI * 2);
        ctx.fill();
      }

      const coreR = base * 0.22 * pulse;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0, "#ffffff");
      core.addColorStop(0.35, "#ffd1e0");
      core.addColorStop(0.7, "#ff4466");
      core.addColorStop(1, "rgba(180, 20, 40, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      if (!reduce) raf.current = requestAnimationFrame(draw);
    };

    if (reduce) draw(t0);
    else raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [energy, listening, thinking, speaking]);

  return (
    <canvas
      ref={ref}
      className={`absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
