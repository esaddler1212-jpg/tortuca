import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PulseSnapshot } from "../../shared/pulse";
import type { FlightFix } from "../../shared/flight";

export type MapLayer = "quakes" | "fires" | "cams" | "planes" | "ships";

interface Props {
  pulse: PulseSnapshot;
  lat: number;
  lon: number;
  layers: Record<MapLayer, boolean>;
  tracked: FlightFix | null;
  onCam: (image: string) => void;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const ago = (iso?: string) => {
  if (!iso) return "";
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  return m < 60 ? `${m}m ago` : m < 2880 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};

/** A marker drawn as a small glyph (no image files to load). */
function glyph(text: string, cls: string, rotate?: number, size = 26) {
  const hit = Math.max(size, 40);
  return L.divIcon({
    className: "pulse-pin",
    html: `<span class="pulse-pin-hit"><span class="pulse-pin-glyph ${cls}" style="width:${size}px;height:${size}px${rotate !== undefined ? `;transform:rotate(${Math.round(rotate)}deg)` : ""}">${text}</span></span>`,
    iconSize: [hit, hit],
    iconAnchor: [hit / 2, hit / 2],
    popupAnchor: [0, -size / 2],
  });
}

/** Bay Area framing — no external map tiles (works offline / when CDNs block). */
const BAY_BOUNDS: L.LatLngBoundsExpression = [
  [37.32, -122.62],
  [38.12, -121.68],
];

/** Rough SF Bay + delta outline for a digital god's-eye read. */
const BAY_SHORE: L.LatLngExpression[] = [
  [38.08, -122.52],
  [37.98, -122.35],
  [37.88, -122.22],
  [37.72, -122.18],
  [37.55, -122.35],
  [37.48, -122.55],
  [37.45, -122.85],
  [37.52, -123.05],
  [37.72, -122.95],
  [37.95, -122.72],
  [38.08, -122.52],
];

function addDigitalBasemap(map: L.Map): L.LayerGroup {
  const base = L.layerGroup().addTo(map);
  L.rectangle(BAY_BOUNDS, {
    color: "rgba(103, 232, 249, 0.22)",
    weight: 1,
    fillColor: "#0a1018",
    fillOpacity: 0.92,
  }).addTo(base);
  L.polygon(BAY_SHORE, {
    color: "rgba(34, 211, 238, 0.35)",
    weight: 1.5,
    fillColor: "rgba(15, 23, 42, 0.55)",
    fillOpacity: 0.6,
  }).addTo(base);
  const south = 37.32;
  const north = 38.12;
  const west = -122.62;
  const east = -121.68;
  for (let lat = south; lat <= north + 0.001; lat += 0.04) {
    L.polyline(
      [
        [lat, west],
        [lat, east],
      ],
      { color: "rgba(103, 232, 249, 0.07)", weight: 1, interactive: false },
    ).addTo(base);
  }
  for (let lng = west; lng <= east + 0.001; lng += 0.04) {
    L.polyline(
      [
        [south, lng],
        [north, lng],
      ],
      { color: "rgba(103, 232, 249, 0.07)", weight: 1, interactive: false },
    ).addTo(base);
  }
  return base;
}

/**
 * God's-eye map of the Bay inside IRIS: digital grid + markers (no raster tiles).
 */
export default function PulseMap({ pulse, lat, lon, layers, tracked, onCam }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const group = useRef<L.LayerGroup | null>(null);
  const camRef = useRef(onCam);
  camRef.current = onCam;

  useEffect(() => {
    const el = box.current;
    if (!el || map.current) return;

    const m = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      maxBounds: BAY_BOUNDS,
      maxBoundsViscosity: 0.85,
      minZoom: 8,
      maxZoom: 14,
    }).setView([lat, lon], 10);

    L.control
      .attribution({ position: "bottomleft" })
      .addTo(m)
      .setPrefix("")
      .addAttribution("IRIS digital grid");

    L.control.zoom({ position: "bottomright" }).addTo(m);
    addDigitalBasemap(m);
    group.current = L.layerGroup().addTo(m);

    m.on("popupopen", (e: L.LeafletEvent) => {
      const popupEl = e.popup.getElement();
      const img = popupEl?.querySelector("img[data-cam]") as HTMLImageElement | null;
      img?.addEventListener("click", () => camRef.current(img.dataset.cam!));
    });

    const fixSize = () => {
      m.invalidateSize({ animate: false });
    };
    fixSize();
    requestAnimationFrame(fixSize);
    const t = window.setTimeout(fixSize, 120);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fixSize) : null;
    ro?.observe(el);

    map.current = m;
    return () => {
      window.clearTimeout(t);
      ro?.disconnect();
      m.remove();
      map.current = null;
      group.current = null;
    };
  }, [lat, lon]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    m.setView([lat, lon], m.getZoom(), { animate: false });
    m.invalidateSize({ animate: false });
  }, [lat, lon]);

  useEffect(() => {
    const g = group.current;
    if (!g) return;
    g.clearLayers();
    L.marker([lat, lon], { icon: glyph("", "pin-you", undefined, 16), keyboard: false, interactive: false, zIndexOffset: -1000 }).addTo(g);

    if (layers.quakes) {
      for (const q of pulse.quakes) {
        if (q.lat === undefined || q.lon === undefined) continue;
        L.circleMarker([q.lat, q.lon], {
          radius: 4 + q.mag * 2.5,
          color: q.mag >= 3.5 ? "#f59e0b" : "#fbbf24",
          weight: 2,
          fillOpacity: 0.25,
        })
          .bindPopup(`<b>M${q.mag} quake</b><br>${esc(q.place)}<br>${ago(q.time)} · ${q.miles} mi away<br><a href="${esc(q.url)}" target="_blank" rel="noreferrer">USGS details</a>`)
          .addTo(g);
      }
    }
    if (layers.fires) {
      for (const f of pulse.fires) {
        if (f.lat === undefined || f.lon === undefined) continue;
        const size = f.acres ? `${f.acres.toLocaleString("en-US")} acres` : "size unknown";
        const held = f.contained !== undefined ? ` · ${f.contained}% contained` : "";
        L.marker([f.lat, f.lon], { icon: glyph("🔥", "pin-fire") })
          .bindPopup(`<b>${esc(f.name)}</b><br>${size}${held}<br>${f.miles} mi away`)
          .addTo(g);
      }
    }
    if (layers.cams) {
      for (const c of pulse.cams) {
        if (c.lat === undefined || c.lon === undefined) continue;
        L.marker([c.lat, c.lon], { icon: glyph("📷", "pin-cam", undefined, 22) })
          .bindPopup(
            `<b>${esc(c.route)} · ${esc(c.name)}</b><br><img data-cam="${esc(c.image)}" src="${esc(c.image)}" alt="Live traffic camera" class="pulse-pop-img"><br><span class="pulse-pop-hint">Tap the picture to enlarge</span>`,
            { maxWidth: 240 },
          )
          .addTo(g);
      }
    }
    if (layers.planes) {
      for (const p of pulse.flights?.all ?? pulse.flights?.nearest ?? []) {
        if (p.lat === undefined || p.lon === undefined) continue;
        const alt = p.altitudeFt !== undefined ? `${p.altitudeFt.toLocaleString("en-US")} ft` : "altitude unknown";
        const speed = p.speedKt ? ` · ${Math.round(p.speedKt * 1.15078)} mph` : "";
        L.marker([p.lat, p.lon], { icon: glyph("✈", "pin-plane", (p.track ?? 0) - 45, 22) })
          .bindPopup(
            `<b>${esc(p.callsign)}</b>${p.type ? ` · ${esc(p.type)}` : ""}<br>${alt}${speed}<br>${p.miles} mi away<br><a href="https://globe.adsb.lol/?icao=${encodeURIComponent(p.hex)}" target="_blank" rel="noreferrer">Follow live</a>`,
          )
          .addTo(g);
      }
    }
    if (layers.ships) {
      for (const s of pulse.ships ?? []) {
        const moving = (s.speedKt ?? 0) >= 0.5;
        const speed = s.speedKt !== undefined ? `${s.speedKt} kn` : "";
        const status = moving ? speed : s.status === "moored" ? "Docked" : s.status === "anchored" ? "At anchor" : speed;
        L.marker([s.lat, s.lon], { icon: glyph("⛴", moving ? "pin-ship" : "pin-ship pin-still", undefined, 22) })
          .bindPopup(
            `<b>${esc(s.name)}</b>${s.kind ? ` · ${esc(s.kind)}` : ""}<br>${esc(status)}${s.destination ? `<br>Heading to ${esc(s.destination)}` : ""}`,
          )
          .addTo(g);
      }
    }
    if (tracked) {
      const alt = tracked.altitudeFt !== undefined ? `${tracked.altitudeFt.toLocaleString("en-US")} ft` : "";
      L.marker([tracked.lat, tracked.lon], { icon: glyph("✈", "pin-plane pin-tracked", (tracked.track ?? 0) - 45, 30), zIndexOffset: 900 })
        .bindPopup(`<b>${esc(tracked.callsign)}</b><br>${alt}`)
        .addTo(g);
    }
  }, [pulse, lat, lon, layers, tracked]);

  useEffect(() => {
    const m = map.current;
    if (!m || !tracked) return;
    m.fitBounds(L.latLngBounds([lat, lon], [tracked.lat, tracked.lon]).pad(0.25), { maxZoom: 11 });
  }, [tracked, lat, lon]);

  return <div ref={box} className="pulse-map h-[340px] w-full overflow-hidden rounded-md border border-alfred-border/60" role="region" aria-label="Bay Area digital pulse map" />;
}
