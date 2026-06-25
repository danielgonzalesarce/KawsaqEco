/** Contenido del onboarding — 3 slides tras el registro (piloto Santa Anita). */

import { IconName } from '../components/ui/Icon';

export interface OnboardingHighlight {
  icon: IconName;
  text: string;
}

export interface OnboardingSlide {
  id: string;
  stepLabel: string;
  icon: IconName;
  accent: string;
  quechua: string;
  espanol: string;
  descripcion: string;
  highlights: OnboardingHighlight[];
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    stepLabel: 'Bienvenida',
    icon: 'leaf-outline',
    accent: '#52B788',
    quechua: "Allin p'unchay! KawsaqEco nisqawan kanki — kawsay qonqeyku.",
    espanol: 'Bienvenido a KawsaqEco',
    descripcion:
      'En quechua, Kawsaq significa «el que da vida». Únete al piloto de reciclaje en Santa Anita y transforma tus hábitos en impacto real.',
    highlights: [
      { icon: 'location-outline', text: 'Piloto en Santa Anita' },
      { icon: 'people-outline', text: 'Comunidad vecinal' },
      { icon: 'heart-outline', text: 'Cada acción cuenta' },
    ],
  },
  {
    id: '2',
    stepLabel: 'Escanea',
    icon: 'camera-outline',
    accent: '#40916C',
    quechua: "Sawq'ay hinaspa escaneay — yawarmanta yachayku imatachus reciclanankupaq.",
    espanol: 'Escanea con tu cámara',
    descripcion:
      'Nuestra IA reconoce plástico, papel, vidrio, metal y más. Te dice cómo separarlo y te muestra el acopio más cercano en el distrito.',
    highlights: [
      { icon: 'scan-outline', text: 'Clasificación instantánea' },
      { icon: 'map-outline', text: 'Acopios en Santa Anita' },
      { icon: 'add-circle-outline', text: '+5 pts por escaneo' },
    ],
  },
  {
    id: '3',
    stepLabel: 'Recompensas',
    icon: 'trophy-outline',
    accent: '#BC6C25',
    quechua: 'Puntokunata ganay, recompensakunata canjey — Santa Anita llaqtapi.',
    espanol: 'Gana puntos y canjea',
    descripcion:
      'Sube de Semilla a Héroe Kawsaq reciclando. Canjea descuentos en bodegas, recargas de transporte y experiencias en ecoparques locales.',
    highlights: [
      { icon: 'trending-up-outline', text: '5 niveles de progreso' },
      { icon: 'gift-outline', text: 'Premios en tu barrio' },
      { icon: 'podium-outline', text: 'Ranking comunitario' },
    ],
  },
];

export const ONBOARDING_LEVELS = ['Semilla', 'Brote', 'Árbol', 'Bosque', 'Héroe Kawsaq'] as const;

export const ONBOARDING_STORAGE_KEY = '@kawsaqeco/onboarding_complete';
