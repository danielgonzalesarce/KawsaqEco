import { AuthResponse } from './auth';
import { DISTRITO_FOCO } from '../constants/santaAnita';

/** Sesión demo local cuando el backend no responde (solo navegación UI). */
export function createLocalDemoSession(): AuthResponse {
  return {
    access_token: 'demo-local-offline',
    token_type: 'bearer',
    user: {
      id: 'demo-user',
      email: 'demo@kawsaqeco.com',
      nombre: 'Usuario Demo',
      distrito: DISTRITO_FOCO,
    },
  };
}

export const USB_SETUP_HINT =
  '1) Celular por USB con Depuración USB\n' +
  '2) En mobile/: npm run start:all\n' +
  '3) Espera "Tunel USB listo" y abre KawsaqEco';
