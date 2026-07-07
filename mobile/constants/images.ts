/** Capturas de pantalla de la app — organizadas por módulo. */

export const APP_IMAGES = {
  splash: require('../assets/images/splash.jpeg'),
  auth: {
    login: require('../assets/images/auth/login.jpeg'),
    register: require('../assets/images/auth/register.jpeg'),
  },
  onboarding: {
    '1': require('../assets/images/onboarding/onboarding-1.jpeg'),
    '2': require('../assets/images/onboarding/onboarding-2.jpeg'),
    '3': require('../assets/images/onboarding/onboarding-3.jpeg'),
  },
  screens: {
    home: require('../assets/images/screens/home.jpeg'),
    dashboard: require('../assets/images/screens/dashboard.jpeg'),
    scan: require('../assets/images/screens/scan.jpeg'),
    chat: require('../assets/images/screens/chat.jpeg'),
    mapa: require('../assets/images/screens/mapa.jpeg'),
    misReciclajes: require('../assets/images/screens/mis-reciclajes.jpeg'),
    recompensas: require('../assets/images/screens/recompensas.jpeg'),
  },
} as const;
