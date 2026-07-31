import { getDailyQuote } from "../../shared/dailyQuote";
import type { AlfredUserData } from "../../shared/userDataTypes";
import type { StoredSession } from "./_shared";
import { computeServerLeaveBy } from "../../shared/leaveByLite";

export interface DigestContent {
  subject: string;
  html: string;
  text: string;
}

function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export async function fetchWeather(
  lat: number,
  lon: number,
): Promise<{ temp: number; high: number; sunset: string; label: string } | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("current", "temperature_2m,weather_code");
    url.searchParams.set("daily", "temperature_2m_max,sunset");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "1");
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
      daily?: { temperature_2m_max?: number[]; sunset?: string[] };
    };
    const code = data.current?.weather_code ?? 0;
    const labels: Record<number, string> = {
      0: "clear", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
      45: "foggy", 61: "rain", 71: "snow", 80: "showers", 95: "thunderstorm",
    };
    return {
      temp: data.current?.temperature_2m ?? 0,
      high: data.daily?.temperature_2m_max?.[0] ?? 0,
      sunset: data.daily?.sunset?.[0] ?? "",
      label: labels[code] ?? "variable",
    };
  } catch {
    return null;
  }
}

export async function buildMorningDigest(
  session: StoredSession,
  userData: AlfredUserData,
): Promise<DigestContent | null> {
  const settings = userData.settings;
  if (!settings?.morningDigestEnabled || !session.email) return null;

  const tz = settings.timezone;
  const quote = getDailyQuote(tz);
  const pending = (userData.todos ?? []).filter((t) => !t.done);
  const topTasks = pending.slice(0, 3).map((t) => t.title);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  const urgent = pending.filter((t) => t.dueDate === today);
  const weather = await fetchWeather(settings.latitude, settings.longitude);
  const leavePlan = computeServerLeaveBy(settings, new Date());

  const lines: string[] = [];
  lines.push("Good morning.");
  lines.push(`"${quote.text}" — ${quote.author}`);
  if (weather) {
    lines.push(
      `Weather in ${settings.city}: ${Math.round(weather.temp)}° and ${weather.label}. High around ${Math.round(weather.high)}°.`,
    );
  }
  if (leavePlan) {
    lines.push(
      `Leave by ${formatTime(leavePlan.leaveBy, tz)} for ${leavePlan.destination} (arrive ${formatTime(leavePlan.arriveBy, tz)}).`,
    );
  } else {
    lines.push(`Wake alarm ${settings.wakeTime}.`);
  }
  if (topTasks.length > 0) {
    lines.push(`Top tasks: ${topTasks.join("; ")}.`);
  } else {
    lines.push("Your task list is clear.");
  }
  if (urgent.length > 0) {
    lines.push(`${urgent.length} task${urgent.length === 1 ? "" : "s"} due today.`);
  }
  lines.push(`Leave-by uses ${settings.useLiveCommute ? "live" : "manual"} commute (${settings.commuteMinutes} min + ${settings.arriveBufferMinutes} min buffer).`);
  lines.push(`Open Alfred for your full command center.`);

  const subject = `Alfred morning briefing — ${new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(new Date())}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; color: #1a1a1a;">
      <p style="color: #22d3ee; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Alfred</p>
      <h1 style="font-size: 24px;">Good morning</h1>
      <blockquote style="border-left: 3px solid #22d3ee; padding-left: 16px; color: #444; font-style: italic;">
        "${quote.text}"<br/><span style="font-size: 13px;">— ${quote.author}</span>
      </blockquote>
      ${weather ? `<p>Weather in ${settings.city}: ${Math.round(weather.temp)}° (${weather.label}). High ${Math.round(weather.high)}°.</p>` : ""}
      ${leavePlan ? `<p><strong>Leave by ${formatTime(leavePlan.leaveBy, tz)}</strong> for ${leavePlan.destination}.</p>` : `<p>Wake alarm: ${settings.wakeTime}</p>`}
      <h2 style="font-size: 16px; color: #22d3ee;">Today's focus</h2>
      <ul>${topTasks.length ? topTasks.map((t) => `<li>${t}</li>`).join("") : "<li>All clear</li>"}</ul>
      ${urgent.length ? `<p><strong>${urgent.length}</strong> due today.</p>` : ""}
      <p style="color: #666; font-size: 13px;">Commute: ${settings.commuteMinutes} min drive + ${settings.arriveBufferMinutes} min buffer${settings.useLiveCommute ? " (live traffic when available)" : ""}.</p>
      <p style="margin-top: 24px; font-size: 13px; color: #888;">— Alfred, at your service.</p>
    </div>
  `;

  return { subject, html, text: lines.join("\n\n") };
}

export function buildLeaveReminder(
  settings: AlfredUserData["settings"],
  leaveBy: Date,
  destination: string,
): { title: string; body: string } {
  return {
    title: "Time to leave",
    body: `Leave by ${formatTime(leaveBy, settings?.timezone ?? "America/Los_Angeles")} for ${destination}.`,
  };
}

export function buildUrgentReminder(urgentCount: number): { title: string; body: string } {
  return {
    title: "Urgent items before school",
    body: `${urgentCount} urgent item${urgentCount === 1 ? "" : "s"} need attention today.`,
  };
}

export function buildWindDownReminder(
  settings: AlfredUserData["settings"],
  windDownStart: Date,
  lightsOut: Date,
): { title: string; body: string } {
  const tz = settings?.timezone ?? "America/Los_Angeles";
  return {
    title: "Wind-down time",
    body: `Start your evening routine. Lights out ${formatTime(lightsOut, tz)} (wind down ${formatTime(windDownStart, tz)}).`,
  };
}
