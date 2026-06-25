import { getRecyclingHistory, getRecyclingStats } from './recyclingHistory';
import { syncPointsFromServer } from './userPoints';

export interface UnifiedUserStats {
  puntos: number;
  escaneos: number;
  entregados: number;
  nivel: string;
  emoji: string;
  puntos_faltantes: number;
  proximo_nivel: string | null;
  co2_evitado_kg: number;
  agua_ahorrada_lt: number;
}

/** Puntos y nivel desde el backend; actividad local solo para conteos e impacto offline. */
export async function getUnifiedUserStats(): Promise<UnifiedUserStats> {
  const [history, stats, pointsResult] = await Promise.all([
    getRecyclingHistory(),
    getRecyclingStats(),
    syncPointsFromServer(),
  ]);

  const summary = pointsResult.summary;

  let co2 = 0;
  let agua = 0;
  for (const entry of history) {
    co2 += entry.co2_evitado_kg ?? 0;
    agua += entry.agua_ahorrada_lt ?? 0;
  }

  return {
    puntos: summary.total_points,
    escaneos: stats.total,
    entregados: stats.entregados,
    nivel: summary.nivel,
    emoji: summary.emoji,
    puntos_faltantes: summary.puntos_faltantes,
    proximo_nivel: summary.proximo_nivel ?? null,
    co2_evitado_kg: Math.round(co2 * 100) / 100,
    agua_ahorrada_lt: Math.round(agua * 10) / 10,
  };
}
