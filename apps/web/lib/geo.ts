// Байршлын туслахууд (Улаанбаатар)
export const UB_CENTER: [number, number] = [47.9184, 106.9177];
// Монголын хил орчим (буруу координат хадгалахаас сэргийлнэ)
export function parseLatLng(latRaw: unknown, lngRaw: unknown): { lat: number; lng: number } | null {
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 41 || lat > 53 || lng < 87 || lng > 120) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}
