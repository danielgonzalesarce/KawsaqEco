import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { COLORS } from '../constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  scan: { active: 'scan', inactive: 'scan-outline' },
  chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  mapa: { active: 'map', inactive: 'map-outline' },
  recompensas: { active: 'gift', inactive: 'gift-outline' },
};

export function TabBarIcon({
  route,
  focused,
  size,
}: {
  route: string;
  focused: boolean;
  size?: number;
}) {
  const icons = TAB_ICONS[route] ?? TAB_ICONS.index;
  const iconSize = size ?? 24;
  return (
    <Ionicons
      name={focused ? icons.active : icons.inactive}
      size={iconSize}
      color={focused ? COLORS.primary : COLORS.tabInactive}
    />
  );
}
