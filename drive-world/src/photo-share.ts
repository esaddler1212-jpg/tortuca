export type PhotoCardMeta = {
  vehicleName: string;
  mph: number;
  placeLabel: string;
  subtitle?: string;
};

export async function saveCruisePhotoCard(meta: PhotoCardMeta): Promise<boolean> {
  const game = document.getElementById('application-canvas') as HTMLCanvasElement | null;
  if (!game) return false;

  const footerH = 112;
  const out = document.createElement('canvas');
  out.width = game.width;
  out.height = game.height + footerH;
  const ctx = out.getContext('2d');
  if (!ctx) return false;

  ctx.drawImage(game, 0, 0);
  ctx.fillStyle = 'rgba(6, 10, 18, 0.92)';
  ctx.fillRect(0, game.height, out.width, footerH);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('City Nights', 20, game.height + 36);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#a8b4c8';
  const line2 = `${meta.vehicleName} · ${Math.round(meta.mph)} mph · ${meta.placeLabel}`;
  ctx.fillText(line2, 20, game.height + 62);
  if (meta.subtitle) {
    ctx.fillStyle = '#7a8aa4';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(meta.subtitle, 20, game.height + 88);
  }

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'));
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `city-nights-${Date.now()}.png`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
