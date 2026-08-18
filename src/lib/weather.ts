import type { WeatherSnapshot } from "../types";

const WMO: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Moderate showers",
  82: "Violent showers",
  95: "Thunderstorm",
};

export function weatherLabel(code: number): string {
  return WMO[code] ?? "Variable conditions";
}

export interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function geocodeCity(name: string): Promise<GeoResult | null> {
  const params = new URLSearchParams({ name, count: "1", language: "en", format: "json" });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
    admin1?: string;
    country?: string;
  }> };
  const hit = data.results?.[0];
  if (!hit) return null;
  const label = [hit.name, hit.admin1, hit.country].filter(Boolean).join(", ");
  return {
    name: label,
    latitude: hit.latitude,
    longitude: hit.longitude,
    timezone: hit.timezone,
  };
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  timezone: string,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone,
    current: "temperature_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code",
    forecast_days: "1",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error("Weather unavailable");
  const data = (await res.json()) as {
    current: { temperature_2m: number; weather_code: number };
    daily: {
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      sunrise: string[];
      sunset: string[];
    };
  };
  return {
    temperature: data.current.temperature_2m,
    weatherCode: data.current.weather_code,
    high: data.daily.temperature_2m_max[0],
    low: data.daily.temperature_2m_min[0],
    sunrise: data.daily.sunrise[0],
    sunset: data.daily.sunset[0],
    fetchedAt: new Date().toISOString(),
  };
}

export function formatTime(isoLocal: string): string {
  const d = new Date(isoLocal);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
