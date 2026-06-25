/** Distancia en metros entre dos coordenadas (Haversine). */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const r = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function withDistanceFromUser<T extends { lat: number; lng: number }>(
  points: T[],
  userLat: number,
  userLng: number,
): (T & { distancia_m: number })[] {
  return points
    .map(p => ({
      ...p,
      distancia_m: Math.round(haversineMeters(userLat, userLng, p.lat, p.lng)),
    }))
    .sort((a, b) => a.distancia_m - b.distancia_m);
}
