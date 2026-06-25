import { useCallback, useEffect, useState } from 'react';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { ANDROID_PACKAGE_NAME, GOOGLE_CLOUD_CLIENTS_URL } from '../constants/googleOAuth';

const DEVELOPER_ERROR_HELP =
  'Google Sign-In no está configurado para Android.\n\n' +
  '1. Ejecuta en mobile: npm run google:setup\n' +
  '2. Agrega la huella SHA-1 de tu keystore debug en Firebase\n' +
  '   (Proyecto kawsaqeco → app Android com.kawsaqeco.app)\n' +
  '3. Descarga google-services.json y reemplázalo en mobile/\n' +
  '4. Recompila: npm run android:dev\n\n' +
  `Consola: ${GOOGLE_CLOUD_CLIENTS_URL}\n` +
  `Paquete: ${ANDROID_PACKAGE_NAME}`;

/** Google Sign-In nativo — solo se carga en development build, no en Expo Go. */
export function useGoogleSignInDevClient(webClientId: string) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!webClientId) return;

    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
    setReady(true);
  }, [webClientId]);

  const signInWithGoogle = useCallback(async (): Promise<string> => {
    if (!ready) {
      throw new Error('Google Sign-In aún no está listo. Espera un momento.');
    }

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        throw new Error('Inicio con Google cancelado');
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error(
          'No se recibió token de Google.\n\nCrea un cliente OAuth Android en Google Cloud con:\n• Nombre del paquete: com.kawsaqeco.app\n• SHA-1 de tu debug keystore (ver docs/google-oauth-setup.md)',
        );
      }

      return idToken;
    } catch (e: unknown) {
      const err = e as { code?: string | number; message?: string };
      const message = err.message || '';
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Inicio con Google cancelado');
      }
      if (err.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google Sign-In ya está en curso');
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services no está disponible en este dispositivo');
      }
      if (
        err.code === 10 ||
        err.code === '10' ||
        message.includes('DEVELOPER_ERROR')
      ) {
        throw new Error(DEVELOPER_ERROR_HELP);
      }
      throw new Error(message || 'No se pudo conectar con Google');
    }
  }, [ready]);

  return {
    signInWithGoogle,
    googleReady: ready,
  };
}
