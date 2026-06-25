import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPoints } from './api';

const SUMMARY_KEY = '@kawsaq_points_summary';

export interface PointsSummary {
  total_points: number;
  nivel: string;
  emoji: string;
  puntos_faltantes: number;
  proximo_nivel?: string | null;
}

const DEFAULT_SUMMARY: PointsSummary = {
  total_points: 0,
  nivel: 'Semilla',
  emoji: '🌱',
  puntos_faltantes: 200,
  proximo_nivel: 'Brote',
};

async function saveSummary(summary: PointsSummary) {
  await AsyncStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
}

function mapApiSummary(data: Record<string, unknown>): PointsSummary {
  return {
    total_points: Number(data.total_points ?? 0),
    nivel: String(data.nivel ?? 'Semilla'),
    emoji: String(data.emoji ?? '🌱'),
    puntos_faltantes: Number(data.puntos_faltantes ?? 200),
    proximo_nivel: data.proximo_nivel != null ? String(data.proximo_nivel) : null,
  };
}

export async function getCachedPointsSummary(): Promise<PointsSummary> {
  try {
    const raw = await AsyncStorage.getItem(SUMMARY_KEY);
    if (raw) return JSON.parse(raw) as PointsSummary;
  } catch {
    /* ignore */
  }
  return DEFAULT_SUMMARY;
}

/** Fuente de verdad: backend. Caché local solo para modo offline. */
export async function syncPointsFromServer(): Promise<{ summary: PointsSummary; fromServer: boolean }> {
  try {
    const data = await getPoints();
    const summary = mapApiSummary(data as Record<string, unknown>);
    await saveSummary(summary);
    return { summary, fromServer: true };
  } catch {
    const cached = await getCachedPointsSummary();
    return { summary: cached, fromServer: false };
  }
}

/** @deprecated Usa syncPointsFromServer — mantiene compatibilidad temporal. */
export async function reconcilePointsFromHistory(): Promise<PointsSummary> {
  const { summary } = await syncPointsFromServer();
  return summary;
}
