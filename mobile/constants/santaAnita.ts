/** Enfoque territorial del piloto KawsaqEco — Santa Anita, Lima. */

export const DISTRITO_FOCO = 'Santa Anita';

/** Radio máximo (metros) para confirmar entrega en acopio — debe coincidir con backend. */
export const ACOPIO_GEOFENCE_RADIUS_M = 150;

export const SANTA_ANITA_CENTER = {
  lat: -12.0439,
  lng: -76.9714,
};

export const SANTA_ANITA_MAP_DELTA = {
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

/** Horarios de recojo municipal referenciales (programa distrital). */
export const RECOJO_SANTA_ANITA = {
  residuosSolidos: 'Mar, Jue y Sáb 6:00–10:00',
  reciclables: 'Punto Limpio Los Frutales · Lun–Dom 7:00–19:00',
  municipalidad: 'Av. Los Frutales 200 · Lun–Vie 8:00–17:00',
};

export const ZONAS_SANTA_ANITA = [
  'Los Frutales',
  'Próceres',
  'Las Camelias',
  'Zona industrial',
] as const;
