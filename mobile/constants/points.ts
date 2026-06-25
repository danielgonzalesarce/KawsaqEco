export const PUNTOS = {
  SCAN_RESIDUO: 5,
  ACOPIO_VERIFICADO: 20,
  RACHA_7_DIAS: 50,
  REFERIR_AMIGO: 100,
};

export const NIVELES = [
  { min: 0, nombre: 'Semilla', emoji: '🌱' },
  { min: 200, nombre: 'Brote', emoji: '🌿' },
  { min: 500, nombre: 'Árbol', emoji: '🌳' },
  { min: 1000, nombre: 'Guardián', emoji: '🦅' },
  { min: 2500, nombre: 'Héroe Kawsaq', emoji: '⭐' },
];

export function getNivel(puntos: number) {
  let nivel = NIVELES[0];
  for (const n of NIVELES) {
    if (puntos >= n.min) nivel = n;
  }
  return nivel;
}
