import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanResult } from './api';

const STORAGE_KEY = '@kawsaq_recycling_history';
const MAX_ENTRIES = 100;

export type RecyclingEstado = 'escaneado' | 'entregado';

export interface RecyclingEntry {
  id: string;
  fecha: string;
  tipo: string;
  nombre_especifico: string;
  puntos: number;
  confianza: number;
  reciclable: boolean;
  instrucciones: string;
  acopio_nombre?: string;
  acopio_direccion?: string;
  acopio_lat?: number;
  acopio_lng?: number;
  co2_evitado_kg?: number;
  agua_ahorrada_lt?: number;
  estado: RecyclingEstado;
}

function acopioFromScan(scan: ScanResult) {
  const acopio = scan.acopio_cercano as {
    nombre?: string;
    direccion?: string;
    lat?: number;
    lng?: number;
  } | undefined;
  if (!acopio) return {};
  return {
    acopio_nombre: acopio.nombre,
    acopio_direccion: acopio.direccion,
    acopio_lat: acopio.lat,
    acopio_lng: acopio.lng,
  };
}

export async function getRecyclingHistory(): Promise<RecyclingEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecyclingEntry[];
  } catch {
    return [];
  }
}

export async function saveRecyclingEntry(scan: ScanResult): Promise<RecyclingEntry> {
  const entry: RecyclingEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fecha: new Date().toISOString(),
    tipo: scan.tipo,
    nombre_especifico: scan.nombre_especifico,
    puntos: scan.puntos,
    confianza: scan.confianza,
    reciclable: scan.reciclable,
    instrucciones: scan.instrucciones,
    co2_evitado_kg: scan.impacto?.co2_evitado_kg,
    agua_ahorrada_lt: scan.impacto?.agua_ahorrada_lt,
    estado: 'escaneado',
    ...acopioFromScan(scan),
  };

  const history = await getRecyclingHistory();
  history.unshift(entry);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
  return entry;
}

export async function getRecyclingEntry(entryId: string): Promise<RecyclingEntry | null> {
  const history = await getRecyclingHistory();
  return history.find(e => e.id === entryId) ?? null;
}

export async function markRecyclingDelivered(entryId: string): Promise<void> {
  const history = await getRecyclingHistory();
  const idx = history.findIndex(e => e.id === entryId);
  if (idx === -1) return;
  history[idx] = { ...history[idx], estado: 'entregado' };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export const ACOPIO_BONUS_PTS = 20;

export async function getRecyclingStats() {
  const history = await getRecyclingHistory();
  const puntos = history.reduce(
    (sum, e) => sum + e.puntos + (e.estado === 'entregado' ? ACOPIO_BONUS_PTS : 0),
    0,
  );
  const entregados = history.filter(e => e.estado === 'entregado').length;
  return { total: history.length, puntos, entregados };
}
