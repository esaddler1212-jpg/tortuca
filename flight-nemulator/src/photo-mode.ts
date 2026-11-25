let photoMode = false;
let filterId: PhotoFilterId = 'none';

export type PhotoFilterId = 'none' | 'sunset' | 'noir' | 'lattice';

const FILTER_CSS: Record<PhotoFilterId, string> = {
  none: 'none',
  sunset: 'saturate(1.15) contrast(1.05) sepia(0.22) hue-rotate(-8deg)',
  noir: 'grayscale(0.85) contrast(1.2)',
  lattice: 'saturate(1.25) contrast(1.08) hue-rotate(18deg)'
};

export function togglePhotoMode(): boolean {
  photoMode = !photoMode;
  return photoMode;
}

export function isPhotoMode(): boolean {
  return photoMode;
}

export function shouldPauseSimulation(): boolean {
  return photoMode;
}

export function cyclePhotoFilter(): PhotoFilterId {
  const order: PhotoFilterId[] = ['none', 'sunset', 'noir', 'lattice'];
  const i = order.indexOf(filterId);
  filterId = order[(i + 1) % order.length]!;
  return filterId;
}

export function activePhotoFilter(): PhotoFilterId {
  return filterId;
}

export function photoFilterCss(): string {
  return FILTER_CSS[filterId];
}

export async function capturePhoto(canvas: HTMLCanvasElement): Promise<string> {
  return canvas.toDataURL('image/png');
}

export async function downloadPhoto(
  canvas: HTMLCanvasElement,
  codename: string,
  filterCss = photoFilterCss()
): Promise<void> {
  const w = canvas.width;
  const h = canvas.height;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  if (!ctx) return;
  ctx.filter = filterCss;
  ctx.drawImage(canvas, 0, 0);
  const data = off.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = data;
  a.download = `battleworld-${codename.replace(/\s+/g, '-').toLowerCase()}.png`;
  a.click();
}