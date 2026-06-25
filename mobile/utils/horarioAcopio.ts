/** Indica si un centro de acopio está abierto según horario textual (Santa Anita). */

const DIAS = ['dom', 'lun', 'mar', 'mié', 'mie', 'jue', 'vie', 'sáb', 'sab'] as const;

function normalizeDay(d: number): string {
  const names = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  return names[d];
}

function parseHour(text: string): number | null {
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const ampm = m[3]?.toLowerCase();
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return h;
}

export function estaAbierto(horario: string, now = new Date()): boolean | null {
  if (!horario) return null;
  const lower = horario.toLowerCase();
  if (lower.includes('24') || lower.includes('siempre')) return true;

  const hoy = normalizeDay(now.getDay());
  const dayMatch = DIAS.some(d => lower.includes(d) && (hoy.startsWith(d.slice(0, 3)) || d.startsWith(hoy.slice(0, 3))));
  if (!dayMatch && (lower.includes('lun') || lower.includes('sáb') || lower.includes('sab'))) {
    const idx = now.getDay();
    const map = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const today = map[idx];
    const found = map.some(d => lower.includes(d.slice(0, 3)) && d === today);
    if (!found && !lower.includes('lun-vie') && !lower.includes('lun a vie')) {
      // horario genérico Lun-Vie
    }
  }

  const range = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–a]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (!range) return null;

  const start = parseHour(range[1]);
  const end = parseHour(range[2]);
  if (start == null || end == null) return null;

  const current = now.getHours() + now.getMinutes() / 60;
  if (end < start) return current >= start || current <= end;
  return current >= start && current <= end;
}

export function labelAbierto(horario: string): { abierto: boolean | null; texto: string } {
  const abierto = estaAbierto(horario);
  if (abierto === true) return { abierto: true, texto: 'Abierto ahora' };
  if (abierto === false) return { abierto: false, texto: 'Cerrado ahora' };
  return { abierto: null, texto: 'Consultar horario' };
}
