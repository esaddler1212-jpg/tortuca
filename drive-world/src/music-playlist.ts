import { loadSettings, saveSettings } from './game-settings';

export type PlaylistTrack = { file: string; title: string; aceStepBed?: boolean };

let tracks: PlaylistTrack[] = [];
let index = 0;
let audio: HTMLAudioElement | null = null;
let loaded = false;

export async function loadPlaylistCatalog(): Promise<PlaylistTrack[]> {
  if (loaded) return tracks;
  try {
    const res = await fetch('./music/playlist.json');
    if (!res.ok) return [];
    const data = (await res.json()) as { tracks?: PlaylistTrack[] };
    tracks = (data.tracks ?? []).filter((t) => t.file && t.title) as PlaylistTrack[];
  } catch {
    tracks = [];
  }
  loaded = true;
  return tracks;
}

export function playlistAvailable(): boolean {
  return tracks.length > 0;
}

export function currentPlaylistTrack(): PlaylistTrack | null {
  return tracks[index] ?? null;
}

function ensureAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.loop = false;
    audio.addEventListener('ended', () => {
      void nextPlaylistTrack(true);
    });
  }
  return audio;
}

export async function playPlaylist(fromIndex = 0): Promise<boolean> {
  await loadPlaylistCatalog();
  if (!tracks.length) return false;
  index = fromIndex % tracks.length;
  const a = ensureAudio();
  const t = tracks[index]!;
  a.src = `./music/${t.file}`;
  a.volume = playlistVolume();
  try {
    await a.play();
    return true;
  } catch {
    return false;
  }
}

function playlistVolume(): number {
  const s = loadSettings();
  return Math.min(1, (s.musicVolume ?? 0.55) * (s.masterVolume ?? 0.85));
}

export function stopPlaylist(): void {
  if (!audio) return;
  audio.pause();
  audio.removeAttribute('src');
}

export async function nextPlaylistTrack(auto = false): Promise<PlaylistTrack | null> {
  await loadPlaylistCatalog();
  if (!tracks.length) return null;
  if (!auto) index = (index + 1) % tracks.length;
  else index = (index + 1) % tracks.length;
  const ok = await playPlaylist(index);
  return ok ? tracks[index]! : null;
}

export async function prevPlaylistTrack(): Promise<PlaylistTrack | null> {
  await loadPlaylistCatalog();
  if (!tracks.length) return null;
  index = (index - 1 + tracks.length) % tracks.length;
  const ok = await playPlaylist(index);
  return ok ? tracks[index]! : null;
}

export function setPlaylistVolume(): void {
  if (audio) audio.volume = playlistVolume();
}

export function isPlaylistPlaying(): boolean {
  return Boolean(audio && !audio.paused && audio.src);
}

export function setUsePlaylist(enabled: boolean): void {
  const s = loadSettings();
  saveSettings({ ...s, musicUsePlaylist: enabled });
}

export function aceStepBedFile(): string | null {
  const tagged = tracks.find((t) => t.aceStepBed);
  if (tagged) return tagged.file;
  return tracks.find((t) => t.file.includes('ace-step'))?.file ?? null;
}

export function playlistIndexForFile(file: string): number {
  return tracks.findIndex((t) => t.file === file);
}

export function playlistStartIndex(): number {
  const s = loadSettings();
  const preferred = s.musicAceStepBedFile ?? aceStepBedFile();
  if (!preferred) return 0;
  const idx = playlistIndexForFile(preferred);
  return idx >= 0 ? idx : 0;
}

/** cn-d09 — jump to the ACE-Step finish bed and enable playlist mode in settings. */
export async function playAceStepBed(): Promise<boolean> {
  await loadPlaylistCatalog();
  const file = aceStepBedFile();
  if (!file) return false;
  const idx = playlistIndexForFile(file);
  if (idx < 0) return false;
  const s = loadSettings();
  saveSettings({ ...s, musicUsePlaylist: true, musicAceStepBedFile: file });
  return playPlaylist(idx);
}

export function playlistHudLabel(): string | null {
  const t = currentPlaylistTrack();
  return t?.title ?? null;
}
