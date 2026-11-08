import { GAMES, type GameTile } from './games';

const rail = document.getElementById('game-rail') as HTMLDivElement;
const detail = document.getElementById('game-detail') as HTMLElement;
const clockEl = document.getElementById('clock') as HTMLElement;
const welcomeEl = document.getElementById('welcome') as HTMLElement;

let index = 0;
let launchLock = false;
const prevButtons = new Map<number, boolean>();

function greetingForHour(h: number): string {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function tickClock(): void {
  const now = new Date();
  welcomeEl.textContent = greetingForHour(now.getHours());
  clockEl.textContent = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatLastPlayed(iso: string | null): string {
  if (!iso) return 'Not played yet on this device';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'Played recently';
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60_000);
  if (mins < 2) return 'Played just now';
  if (mins < 60) return `Played ${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `Played ${hrs} hr ago`;
  return `Played ${new Date(t).toLocaleDateString()}`;
}

function renderDetail(game: GameTile): void {
  const last = formatLastPlayed(localStorage.getItem(game.lastPlayedKey));
  detail.innerHTML = `
    <h2 class="detail-title">${game.title}</h2>
    <p class="detail-tagline">${game.tagline}</p>
    <p class="detail-meta">${last}</p>
    <button type="button" class="detail-play" id="play-btn">Play</button>
  `;
  detail.querySelector('#play-btn')?.addEventListener('click', () => launch(game));
}

function setFocus(i: number): void {
  index = (i + GAMES.length) % GAMES.length;
  const tiles = rail.querySelectorAll<HTMLElement>('.ps-tile');
  tiles.forEach((el, j) => {
    const selected = j === index;
    el.classList.toggle('is-selected', selected);
    el.setAttribute('aria-selected', selected ? 'true' : 'false');
    el.tabIndex = selected ? 0 : -1;
  });
  rail.style.setProperty('--focus-index', String(index));
  renderDetail(GAMES[index]!);
}

function launch(game: GameTile): void {
  if (launchLock) return;
  launchLock = true;
  localStorage.setItem(game.lastPlayedKey, new Date().toISOString());
  window.location.assign(game.href);
}

function buildRail(): void {
  rail.innerHTML = GAMES.map(
    (g, i) => `
    <button
      type="button"
      class="ps-tile ${g.artClass}"
      role="option"
      data-index="${i}"
      aria-selected="${i === 0 ? 'true' : 'false'}"
      aria-label="${g.title}"
    >
      <span class="tile-shine" aria-hidden="true"></span>
      <span class="tile-label">${g.title}</span>
    </button>
  `
  ).join('');

  rail.querySelectorAll<HTMLButtonElement>('.ps-tile').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.index);
      setFocus(i);
      launch(GAMES[i]!);
    });
    btn.addEventListener('focus', () => {
      const i = Number(btn.dataset.index);
      if (i !== index) setFocus(i);
    });
  });
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    setFocus(index + 1);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    setFocus(index - 1);
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    launch(GAMES[index]!);
  }
}

function btnEdge(gp: Gamepad, i: number): boolean {
  const pressed = Boolean(gp.buttons[i]?.pressed);
  const was = prevButtons.get(i) ?? false;
  prevButtons.set(i, pressed);
  return pressed && !was;
}

/** Standard Gamepad: D-pad / left stick + cross (0) */
function pollGamepad(): void {
  const gp = navigator.getGamepads?.()[0];
  if (!gp) return;
  const ax = gp.axes[0] ?? 0;
  const ay = gp.axes[1] ?? 0;
  let moved = false;
  if (btnEdge(gp, 14) || ax < -0.75) {
    setFocus(index - 1);
    moved = true;
  } else if (btnEdge(gp, 15) || ax > 0.75) {
    setFocus(index + 1);
    moved = true;
  } else if (!moved && (btnEdge(gp, 12) || ay < -0.75)) {
    setFocus(index - 1);
  } else if (!moved && (btnEdge(gp, 13) || ay > 0.75)) {
    setFocus(index + 1);
  }
  if (btnEdge(gp, 0)) launch(GAMES[index]!);
}

function boot(): void {
  tickClock();
  window.setInterval(tickClock, 30_000);
  buildRail();
  setFocus(0);
  rail.querySelector<HTMLElement>('.ps-tile.is-selected')?.focus();
  window.addEventListener('keydown', onKey);
  window.addEventListener('gamepadconnected', () => {
    window.requestAnimationFrame(function loop() {
      pollGamepad();
      window.requestAnimationFrame(loop);
    });
  });
  if (navigator.getGamepads?.()[0]) {
    window.requestAnimationFrame(function loop() {
      pollGamepad();
      window.requestAnimationFrame(loop);
    });
  }
}

boot();
