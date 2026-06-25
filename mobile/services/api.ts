import axios from 'axios';

import { API_BASE_URL } from './config';
import { getUserDistrito } from './userProfile';
import { getAuthToken, AuthResponse, AuthUser } from './auth';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async config => {
  const token = await getAuthToken();
  if (token && token !== 'demo-local-offline' && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ChallengeItem {
  id: string;
  nombre: string;
  descripcion: string;
  meta: number;
  puntos_recompensa: number;
  tipo: string;
  icono: string;
  progreso: number;
  completado: boolean;
  porcentaje: number;
}

export interface HomeSummary {
  puntos: number;
  nivel: string;
  emoji: string;
  co2_evitado_kg: number;
  agua_ahorrada_lt: number;
  arboles_equivalentes: number;
  distrito_foco?: string;
  puntos_acopio?: number;
  tip_personalizado: string;
  escaneos_total: number;
  ranking_top: { nombre: string; total_points: number; posicion: number }[];
  residuo_frecuente?: string;
  reto_sugerido?: string;
  proyeccion_anual_co2?: number;
  retos?: ChallengeItem[];
  usuarios_comunidad?: number;
  racha_dias?: number;
  modo_ia_scan?: string;
}

export interface ScanResult {
  tipo: string;
  confianza: number;
  nombre_especifico: string;
  instrucciones: string;
  reciclable: boolean;
  puntos: number;
  dato_impacto?: string;
  acopio_cercano?: Record<string, unknown>;
  impacto?: { co2_evitado_kg: number; agua_ahorrada_lt: number };
  regulacion?: {
    tipo: string;
    titulo: string;
    normativa: string;
    resumen: string;
    contenedor: string;
  };
  modo_ia?: string;
  sugerir_retake?: boolean;
}

export interface RegulacionInfo {
  tipo: string;
  titulo: string;
  normativa: string;
  resumen: string;
  contenedor: string;
  multa_aprox?: string;
  fuente?: string;
}

function networkMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'El servidor tardó demasiado. Verifica que el backend esté corriendo.';
    }
    if (!error.response) {
      return (
        `Sin conexión al servidor (${API_BASE_URL}).\n\n` +
        'USB: conecta el celular y ejecuta en mobile/:\n' +
        'npm run start:all\n\n' +
        '¿Backend activo? uvicorn en puerto 8000'
      );
    }
    const detail = error.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d: { msg?: string }) => d.msg || 'Datos inválidos').join('. ');
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Error de conexión con el servidor.';
}

export async function scanImage(imageBase64: string, lat?: number, lng?: number): Promise<ScanResult> {
  try {
    const { data } = await api.post('/api/scan', {
      image_base64: imageBase64,
      lat,
      lng,
    });
    return data;
  } catch (error) {
    throw new Error(networkMessage(error));
  }
}

export async function sendChat(
  message: string,
  history: { role: string; content: string }[] = [],
  options?: { lat?: number; lng?: number },
) {
  try {
    const distrito = await getUserDistrito();
    const { data } = await api.post('/api/chat', {
      message,
      conversation_history: history,
      distrito: distrito ?? undefined,
      lat: options?.lat,
      lng: options?.lng,
    });
    return data as { reply: string; suggested_actions: string[] };
  } catch (error) {
    throw new Error(networkMessage(error));
  }
}

export async function getPoints() {
  const { data } = await api.get('/api/points/me');
  return data;
}

export async function verifyAcopio(body: { lat: number; lng: number; acopio_id?: string }) {
  const { data } = await api.post('/api/points/acopio-verificado', {
    lat: body.lat,
    lng: body.lng,
    acopio_id: body.acopio_id,
  });
  return data;
}

export async function checkAcopioGeofence(
  lat: number,
  lng: number,
  acopioId?: string,
): Promise<{
  ok: boolean;
  distancia_m: number;
  radio_max_m: number;
  acopio_id?: string;
  acopio_nombre?: string;
}> {
  const { data } = await api.get('/api/points/acopio-geofence', {
    params: { lat, lng, acopio_id: acopioId },
  });
  return data;
}

export async function getImpact() {
  const { data } = await api.get('/api/impact/me');
  return data;
}

export async function getAcopioPoints(
  lat: number,
  lng: number,
  tipo?: string,
  options?: { todos?: boolean; limit?: number; radio?: number },
) {
  const { data } = await api.get('/api/acopio', {
    params: {
      lat,
      lng,
      tipo,
      radio: options?.radio ?? 5000,
      limit: options?.limit ?? 20,
      todos: options?.todos ?? true,
    },
  });
  return data;
}

export interface RedemptionHistoryItem {
  codigo: string;
  reward_id: string;
  reward_nombre: string;
  puntos_gastados: number;
  fecha: string;
}

export async function getRewardsBalance(): Promise<{ user_id: string; puntos: number }> {
  const { data } = await api.get('/api/rewards/balance/me');
  return data;
}

export async function getRedemptionHistory(): Promise<RedemptionHistoryItem[]> {
  const { data } = await api.get('/api/rewards/history/me');
  return data;
}

export async function getHome(): Promise<HomeSummary> {
  const { data } = await api.get('/api/home');
  return data;
}

export async function getRewards() {
  const { data } = await api.get('/api/rewards');
  return data;
}

export async function redeemReward(rewardId: string) {
  const { data } = await api.post('/api/rewards/redeem', { reward_id: rewardId });
  return data;
}

export async function getRanking() {
  const { data } = await api.get('/api/ranking/comunidad');
  return data;
}

export async function getPersonalization() {
  const { data } = await api.get('/api/personalization/me');
  return data;
}

export async function getChallenges() {
  const { data } = await api.get('/api/challenges/me');
  return data as { retos: ChallengeItem[] };
}

export async function getRegulacion(tipo: string): Promise<RegulacionInfo> {
  const { data } = await api.get(`/api/regulaciones/${encodeURIComponent(tipo)}`);
  return data;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await api.get('/', { timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}

export async function getAuthConfig(): Promise<{
  firebase: boolean;
  google_web_client_id: string | null;
  project_id: string;
}> {
  const { data } = await api.get('/api/auth/config');
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
    return data;
  } catch (error) {
    throw new Error(networkMessage(error));
  }
}

export async function loginPhone(telefono: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/api/auth/login-phone', { telefono, password });
    return data;
  } catch (error) {
    throw new Error(networkMessage(error));
  }
}

export async function loginGoogle(idToken: string, nombre?: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/api/auth/google', {
      id_token: idToken,
      nombre,
    });
    return data;
  } catch (error) {
    throw new Error(networkMessage(error));
  }
}

export async function registerUser(body: {
  email: string;
  password: string;
  nombre: string;
  distrito?: string;
}): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/api/auth/register', body);
    return data;
  } catch (error) {
    throw new Error(networkMessage(error));
  }
}

export async function registerPhone(body: {
  telefono: string;
  password: string;
  nombre: string;
  distrito?: string;
}): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/api/auth/register-phone', body);
    return data;
  } catch (error) {
    throw new Error(networkMessage(error));
  }
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/api/auth/me');
  return data;
}
