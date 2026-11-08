const PLAY_HREF = 'flight-nemulator/';
const LAST_KEY = 'battleworld-portal:last-played';

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

function launch(): void {
  localStorage.setItem(LAST_KEY, new Date().toISOString());
  window.location.assign(PLAY_HREF);
}

function boot(): void {
  const meta = document.getElementById('last-played');
  if (meta) meta.textContent = formatLastPlayed(localStorage.getItem(LAST_KEY));

  document.getElementById('play-btn')?.addEventListener('click', launch);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      launch();
    }
  });
}

boot();
