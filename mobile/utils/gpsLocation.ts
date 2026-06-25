import * as Location from 'expo-location';
import { SANTA_ANITA_CENTER } from '../constants/santaAnita';

const GPS_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('gps_timeout')), ms);
    }),
  ]);
}

/** Ubicación para escaneo — no bloquea si el GPS tarda o falla. */
export async function getScanLocation(): Promise<{ lat: number; lng: number }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return SANTA_ANITA_CENTER;

    const loc = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      GPS_TIMEOUT_MS,
    );
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch {
    return SANTA_ANITA_CENTER;
  }
}

/** GPS del usuario para el mapa de acopio en Santa Anita. */
export async function resolveGpsForMap(): Promise<{
  userLocation: { lat: number; lng: number } | null;
  locationLabel: string | null;
  hasGps: boolean;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { userLocation: null, locationLabel: null, hasGps: false };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;

    let locationLabel: string | null = null;
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (place) {
        locationLabel = place.district ?? place.subregion ?? place.name ?? null;
      }
    } catch {
      /* sin geocoding */
    }

    return {
      userLocation: { lat, lng },
      locationLabel,
      hasGps: true,
    };
  } catch {
    return { userLocation: null, locationLabel: null, hasGps: false };
  }
}

/** GPS de alta precisión para confirmar entrega en acopio (sin fallback). */
export async function getAcopioVerifyLocation(): Promise<{
  lat: number;
  lng: number;
  granted: boolean;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { lat: 0, lng: 0, granted: false };
    }

    const loc = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      GPS_TIMEOUT_MS,
    );
    return {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      granted: true,
    };
  } catch {
    return { lat: 0, lng: 0, granted: false };
  }
}
