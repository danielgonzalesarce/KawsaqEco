import { TouchableOpacity, Text, View } from 'react-native';
import Icon, { IconName } from '../ui/Icon';
import { authStyles } from './authStyles';
import { COLORS } from '../../constants/theme';

export type AuthMode = 'email' | 'phone';

interface AuthModeTabsProps {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
  compact?: boolean;
}

const TABS: { key: AuthMode; label: string; icon: IconName }[] = [
  { key: 'email', label: 'Correo', icon: 'mail-outline' },
  { key: 'phone', label: 'Teléfono', icon: 'call-outline' },
];

export default function AuthModeTabs({ mode, onChange, compact }: AuthModeTabsProps) {
  return (
    <View style={[authStyles.tabs, compact && authStyles.tabsCompact]}>
      {TABS.map((tab) => {
        const active = mode === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[authStyles.tab, compact && authStyles.tabCompact, active && authStyles.tabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.85}
          >
            <Icon name={tab.icon} size={compact ? 14 : 16} color={active ? COLORS.primary : COLORS.textMuted} />
            <Text style={[authStyles.tabText, compact && authStyles.tabTextCompact, active && authStyles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
