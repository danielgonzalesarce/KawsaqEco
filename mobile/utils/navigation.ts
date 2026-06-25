import { Alert, Linking, Platform } from 'react-native';

export interface NavigationTarget {
  lat: number;
  lng: number;
  label?: string;
}

/** Abre Google Maps con navegación hacia el destino (como "Cómo llegar"). */
export async function openGoogleMapsNavigation({ lat, lng, label }: NavigationTarget): Promise<void> {
  const dest = `${lat},${lng}`;
  const encodedLabel = label ? encodeURIComponent(label) : undefined;
  const webUrl =
    `https://www.google.com/maps/dir/?api=1&destination=${dest}` +
    (encodedLabel ? `&destination_place_id=&query=${encodedLabel}` : '') +
    '&travelmode=driving';

  const nativeUrl = Platform.select({
    ios: `comgooglemaps://?daddr=${dest}&directionsmode=driving`,
    android: `google.navigation:q=${dest}`,
    default: webUrl,
  })!;

  try {
    const canNative = await Linking.canOpenURL(nativeUrl);
    if (canNative) {
      await Linking.openURL(nativeUrl);
      return;
    }
  } catch {
    /* fallback web */
  }

  try {
    const supported = await Linking.canOpenURL(webUrl);
    if (supported) {
      await Linking.openURL(webUrl);
      return;
    }
  } catch {
    /* ignore */
  }

  Alert.alert(
    'No se pudo abrir Maps',
    'Instala Google Maps o abre el enlace en tu navegador.',
    [{ text: 'OK' }],
  );
}
