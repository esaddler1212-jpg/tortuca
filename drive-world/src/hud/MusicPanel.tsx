import { useEffect, useState } from 'react';

import { MUSIC_STATIONS, cycleMusicStation, getMusicState, setMusicVolume, startMusic, toggleMusicPlay } from '../game-music';
import { loadPlaylistCatalog, nextPlaylistTrack, playlistAvailable, prevPlaylistTrack } from '../music-playlist';
import { loadSettings, saveSettings } from '../game-settings';

export function MusicPanel() {
  const [s, setS] = useState(loadSettings());
  const [state, setState] = useState(getMusicState());
  const [hasPlaylist, setHasPlaylist] = useState(false);

  useEffect(() => {
    void loadPlaylistCatalog().then(() => setHasPlaylist(playlistAvailable()));
  }, []);

  const apply = (next: typeof s) => {
    setS(next);
    saveSettings(next);
    window.dispatchEvent(new CustomEvent('drive-world:settings', { detail: next }));
  };

  return (
    <details className="music-panel">
      <summary>Music</summary>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={s.musicUsePlaylist && hasPlaylist}
          disabled={!hasPlaylist}
          onChange={(e) => {
            const on = e.target.checked && hasPlaylist;
            apply({ ...s, musicUsePlaylist: on });
            if (on) void startMusic(s.musicStation === 'off' ? 'ambient' : s.musicStation);
            else void startMusic(s.musicStation);
          }}
        />
        Use my playlist {hasPlaylist ? '' : '(add tracks to public/music/)'}
      </label>
      <div className="music-actions">
        <button type="button" className="sync-btn" onClick={() => setState({ ...getMusicState(), playing: toggleMusicPlay() })}>
          {state.playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="sync-btn"
          onClick={() => {
            if (s.musicUsePlaylist && hasPlaylist) void nextPlaylistTrack();
            else setState({ ...getMusicState(), station: cycleMusicStation(1), label: '' });
          }}
        >
          Next
        </button>
        {s.musicUsePlaylist && hasPlaylist ? (
          <button type="button" className="sync-btn" onClick={() => void prevPlaylistTrack()}>
            Prev
          </button>
        ) : null}
      </div>
      {!s.musicUsePlaylist ? (
        <label className="slider-row">
          Station
          <select
            value={s.musicStation}
            onChange={(e) => {
              const station = e.target.value as (typeof s)['musicStation'];
              apply({ ...s, musicStation: station });
              void startMusic(station);
              setState(getMusicState());
            }}
          >
            {MUSIC_STATIONS.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="slider-row">
        Music vol
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((s.musicVolume ?? 0.55) * 100)}
          onChange={(e) => {
            const v = Number(e.target.value) / 100;
            apply({ ...s, musicVolume: v });
            setMusicVolume(v);
          }}
        />
      </label>
    </details>
  );
}
