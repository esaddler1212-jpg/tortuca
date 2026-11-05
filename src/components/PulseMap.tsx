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

/**
 * God's-eye map of the Bay inside IRIS: quakes, fires, commute cams, planes
 * overhead and (with an AISStream key) ships, as tappable markers.
 */
export default function PulseMap({ pulse, lat, lon, layers, tracked, onCam }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const group = useRef<L.LayerGroup | null>(null);
  const camRef = useRef(onCam);
  camRef.current = onCam;

  // Create the map once.
  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([lat, lon], 10);
    L.control.zoom({ position: "bottomright" }).addTo(m);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      subdomains: "abcd",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(m);
    group.current = L.layerGroup().addTo(m);
    // Camera thumbnails in popups open the big viewer.
    m.on("popupopen", (e: L.LeafletEvent) => {
      const el = e.popup.getElement();
      const img = el?.querySelector("img[data-cam]") as HTMLImageElement | null;
      img?.addEventListener("click", () => camRef.current(img.dataset.cam!));
    });
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw markers when data or layer toggles change.
  useEffect(() => {
    const g = group.current;
    if (!g) return;
    g.clearLayers();
    // "You" sits under everything and lets taps through to markers nearby.
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

  // Bring a tracked flight into view.
  useEffect(() => {
    const m = map.current;
    if (!m || !tracked) return;
    m.fitBounds(L.latLngBounds([lat, lon], [tracked.lat, tracked.lon]).pad(0.25), { maxZoom: 10 });
  }, [tracked, lat, lon]);

  return <div ref={box} className="pulse-map h-[340px] w-full overflow-hidden rounded-md border border-alfred-border/60" role="region" aria-label="Bay Area map" />;
}
