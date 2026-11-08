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
