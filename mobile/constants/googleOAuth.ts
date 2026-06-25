/** Cliente OAuth Web de Google — fallback si el backend no responde /api/auth/config */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
  '932892906896-3afmp7n59r5l8tf8s5ih95elntdvbear.apps.googleusercontent.com';

export const GOOGLE_CLOUD_CLIENTS_URL =
  'https://console.cloud.google.com/auth/clients?project=kawsaqeco';

export const GOOGLE_CLOUD_AUDIENCE_URL =
  'https://console.cloud.google.com/auth/audience?project=kawsaqeco';

export const FIREBASE_GOOGLE_AUTH_URL =
  'https://console.firebase.google.com/project/kawsaqeco/authentication/providers';

/** Paquete Android para el cliente OAuth en Google Cloud. */
export const ANDROID_PACKAGE_NAME = 'com.kawsaqeco.app';
