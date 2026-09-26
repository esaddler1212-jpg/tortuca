import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import type { WoodhouseNodeSyncResult, WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import {
  activityLabel,
  agentPalette,
  buildStationLayout,
  type StationAgent,
} from "../lib/woodhouseStation";

interface Props {
  snapshot: WoodhouseOrchestrationSnapshot | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const TILE = 8;
const GRID_W = 40;
const GRID_H = 22;

function drawFloor(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const alt = (x + y) % 2 === 0;
      ctx.fillStyle = alt ? "#0c1a0c" : "#081208";
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
}

function drawWalls(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#14532d";
  ctx.fillRect(0, 0, GRID_W * TILE, TILE * 2);
  ctx.fillStyle = "#166534";
  for (let x = 0; x < GRID_W; x++) {
    if (x % 3 === 0) ctx.fillRect(x * TILE, TILE, TILE, TILE);
  }
}

function deskPosition(index: number, total: number): { x: number; y: number } {
  const cols = Math.min(total, 4);
  const row = Math.floor(index / cols);
  const col = index % cols;
  const rowCount = Math.min(cols, total - row * cols);
  const span = GRID_W - 8;
  const step = rowCount <= 1 ? 0 : span / (rowCount - 1);
  const x = 4 + col * step;
  const y = 5 + row * 5;
  return { x, y };
}

function drawDesk(ctx: CanvasRenderingContext2D, gx: number, gy: number, lit: boolean) {
  const px = gx * TILE;
  const py = gy * TILE;
  ctx.fillStyle = "#1e3a1e";
  ctx.fillRect(px, py + TILE, TILE * 3, TILE * 2);
  ctx.fillStyle = "#334155";
  ctx.fillRect(px + TILE * 0.5, py, TILE * 2, TILE);
  ctx.fillStyle = lit ? "#4ade80" : "#064e3b";
  ctx.fillRect(px + TILE * 0.75, py + TILE * 0.15, TILE * 1.5, TILE * 0.7);
  if (lit) {
    ctx.fillStyle = "rgba(74, 222, 128, 0.35)";
    ctx.fillRect(px, py - TILE * 0.5, TILE * 3, TILE * 3.5);
  }
}

function drawAgent(
  ctx: CanvasRenderingContext2D,
  agent: StationAgent,
  gx: number,
  gy: number,
  frame: number,
) {
  const { body, accent } = agentPalette(agent.nodeType);
  const px = gx * TILE + TILE;
  const py = gy * TILE + TILE * 2;
  const bob =
    agent.activity === "working" || agent.activity === "alert"
      ? Math.sin(frame / 8) * 1.5
      : Math.sin(frame / 24) * 0.5;

  ctx.fillStyle = body;
  ctx.fillRect(px, py + bob, TILE, TILE * 1.2);
  ctx.fillStyle = accent;
  ctx.fillRect(px + TILE * 0.15, py - TILE + bob, TILE * 0.7, TILE * 0.85);
  if (agent.activity === "offline") {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(px - 2, py - TILE + bob - 2, TILE + 4, TILE * 2.4);
  }
  if (agent.activity === "alert") {
    ctx.fillStyle = frame % 20 < 10 ? "#f87171" : "#7f1d1d";
    ctx.fillRect(px + TILE * 1.1, py - TILE * 0.5 + bob, TILE * 0.35, TILE * 0.35);
  }
}

function drawComms(ctx: CanvasRenderingContext2D, frame: number) {
  const cx = GRID_W / 2;
  const gy = GRID_H - 5;
  drawDesk(ctx, cx - 1.5, gy, true);
  const bob = Math.sin(frame / 16) * 0.5;
  ctx.fillStyle = "#4ade80";
  ctx.fillRect((cx - 0.35) * TILE, (gy + 2) * TILE + bob, TILE * 0.7, TILE * 1.2);
  ctx.fillStyle = "#ecfdf5";
  ctx.fillRect((cx - 0.25) * TILE, (gy + 1) * TILE + bob, TILE * 0.5, TILE * 0.75);
  ctx.fillStyle = "rgba(74, 222, 128, 0.2)";
  ctx.fillRect((cx - 3) * TILE, (gy - 1) * TILE, TILE * 6, TILE * 5);
}

function drawConveyor(ctx: CanvasRenderingContext2D, frame: number) {
  const y = GRID_H - 9;
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(TILE * 2, y * TILE, (GRID_W - 4) * TILE, TILE);
  for (let i = 0; i < GRID_W - 4; i++) {
    const offset = (frame + i * 3) % 12;
    ctx.fillStyle = offset < 6 ? "#475569" : "#334155";
    ctx.fillRect((2 + i) * TILE, y * TILE, TILE, TILE * 0.4);
  }
}

function paintStation(
  ctx: CanvasRenderingContext2D,
  agents: StationAgent[],
  frame: number,
) {
  const w = GRID_W * TILE;
  const h = GRID_H * TILE;
  ctx.clearRect(0, 0, w, h);
  drawFloor(ctx);
  drawWalls(ctx);
  drawConveyor(ctx, frame);

  const total = agents.length;
  agents.forEach((agent) => {
    const { x, y } = deskPosition(agent.deskIndex, total);
    const lit = agent.activity === "working" || agent.activity === "alert";
    drawDesk(ctx, x, y, lit);
    drawAgent(ctx, agent, x, y, frame);
  });

  drawComms(ctx, frame);

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, w, h);
}

export function WoodhouseStation({ snapshot, loading, error, onRefresh }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nodes: WoodhouseNodeSyncResult[] = snapshot?.nodes ?? [];
  const layout = useMemo(() => buildStationLayout(nodes), [nodes]);
  const selected = layout.agents.find((a) => a.id === selectedId) ?? layout.agents[0] ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = GRID_W * TILE;
    const cssH = GRID_H * TILE;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const tick = () => {
      frameRef.current += 1;
      paintStation(ctx, layout.agents, frameRef.current);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [layout.agents]);

  const handleCanvasClick = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || layout.agents.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const gx = ((ev.clientX - rect.left) / rect.width) * GRID_W;
    const gy = ((ev.clientY - rect.top) / rect.height) * GRID_H;
    const total = layout.agents.length;
    let hit: StationAgent | null = null;
    for (const agent of layout.agents) {
      const { x, y } = deskPosition(agent.deskIndex, total);
      if (gx >= x && gx <= x + 3 && gy >= y && gy <= y + 4) {
        hit = agent;
        break;
      }
    }
    setSelectedId(hit?.id ?? null);
  };

  return (
    <section className="panel-hud p-5 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="hud-label mb-1">Woodhouse station</p>
          <h3 className="font-display text-lg text-alfred-cream hud-glow-text tracking-wide">
            Your app crew
          </h3>
          <p className="text-xs text-alfred-mist max-w-md mt-1">
            StarNet-style live floor — each desk is a registered Woodhouse app. Glow = real work or
            alerts from that node&apos;s snapshot.
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            className="btn-ghost"
            onClick={onRefresh}
            aria-label="Sync Woodhouse station"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </header>

      {error && <p className="text-sm text-amber-300/90">{error}</p>}

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="relative rounded-lg border border-alfred-gold/30 overflow-hidden bg-black shadow-hud">
          <canvas
            ref={canvasRef}
            className="block cursor-crosshair max-w-full"
            onClick={handleCanvasClick}
            role="img"
            aria-label="Pixel-art Woodhouse station showing connected apps as crew at desks"
          />
          <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(74,222,128,0.03)_2px,rgba(74,222,128,0.03)_4px)]" />
        </div>

        <div className="flex-1 min-w-[200px] space-y-3">
          <div className="rounded-lg border border-alfred-border/60 bg-alfred-ink/40 px-3 py-3">
            <p className="text-xs uppercase tracking-wider text-alfred-gold mb-1">COMMS</p>
            <p className="text-sm text-alfred-cream">{layout.commsSummary}</p>
          </div>

          {selected ? (
            <div className="rounded-lg border border-alfred-border/60 px-3 py-3 text-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-alfred-cream">{selected.name}</span>
                <span className="text-xs text-alfred-mist capitalize">{selected.nodeType}</span>
              </div>
              <p className="text-xs text-alfred-mist">{activityLabel(selected.activity)}</p>
              <p className="text-sm">{selected.summary}</p>
              {selected.openUrl && (
                <a
                  href={selected.openUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-alfred-gold hover:underline"
                >
                  Open app <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-alfred-mist">
              {loading
                ? "Syncing crew roster…"
                : "Click a desk to inspect an app, or add nodes in Settings → Woodhouse."}
            </p>
          )}

          <p className="text-[11px] text-alfred-mist/80 leading-relaxed">
            Want a full local agent harness with models and tools?{" "}
            <a
              href="https://github.com/androoAGI/starnet"
              target="_blank"
              rel="noreferrer"
              className="text-alfred-gold hover:underline"
            >
              StarNet
            </a>{" "}
            is the desktop station from the reel — Alfred stays your web command center via Woodhouse.
          </p>
        </div>
      </div>

      {layout.agents.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-xs">
          {layout.agents.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={`rounded-full border px-2.5 py-1 transition ${
                  selected?.id === a.id
                    ? "border-alfred-gold bg-green-400/10 text-alfred-cream"
                    : "border-alfred-border/50 text-alfred-mist hover:border-alfred-gold/40"
                }`}
                onClick={() => setSelectedId(a.id)}
              >
                {a.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
