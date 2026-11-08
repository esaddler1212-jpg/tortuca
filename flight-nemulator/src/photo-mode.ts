let photoMode = false;

export function togglePhotoMode(): boolean {
  photoMode = !photoMode;
  return photoMode;
}

export function isPhotoMode(): boolean {
  return photoMode;
}

export async function capturePhoto(canvas: HTMLCanvasElement): Promise<string> {
  return canvas.toDataURL('image/png');
}

export async function downloadPhoto(canvas: HTMLCanvasElement, codename: string): Promise<void> {
  const data = await capturePhoto(canvas);
  const a = document.createElement('a');
  a.href = data;
  a.download = `flight-nemulator-${codename.replace(/\s+/g, '-').toLowerCase()}.png`;
  a.click();
}
