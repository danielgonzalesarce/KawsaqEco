import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * URL del backend FastAPI.
 * - Producción / EAS Build: EXPO_PUBLIC_API_URL (HTTPS obligatorio)
 * - Emulador Android: 10.0.2.2
 * - USB + adb reverse: 127.0.0.1
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (__DEV__ && Platform.OS === 'android') {
    const isEmulator = !Constants.isDevice;
    return isEmulator ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
  }

  if (__DEV__) {
    return 'http://localhost:8000';
  }

  // Build de producción sin variable → fallo visible en logs
  console.error(
    '[KawsaqEco] Falta EXPO_PUBLIC_API_URL. Configúrala en EAS: eas secret:create --name EXPO_PUBLIC_API_URL',
  );
  return 'https://CONFIGURE-EXPO-PUBLIC-API-URL';
}

export const API_BASE_URL = getApiBaseUrl();

if (__DEV__) {
  console.log('[KawsaqEco] API ->', API_BASE_URL);
}
