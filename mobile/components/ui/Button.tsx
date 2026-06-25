import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Icon, { IconName } from './Icon';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface ButtonProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export default function Button({
  onPress,
  label,
  loading,
  disabled,
  variant = 'primary',
  icon,
  style,
  fullWidth,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary && styles.primary,
        variant === 'secondary' && styles.secondary,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary || variant === 'secondary' ? COLORS.white : COLORS.primary} />
      ) : (
        <>
          {icon && (
            <Icon
              name={icon}
              size={20}
              color={isPrimary || variant === 'secondary' ? COLORS.white : COLORS.primary}
            />
          )}
          <Text
            style={[
              styles.label,
              (isPrimary || variant === 'secondary') && styles.labelLight,
              (isOutline || isGhost) && styles.labelPrimary,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    minHeight: FONTS.buttonMinSize,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
  },
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  secondary: {
    backgroundColor: COLORS.earth,
    ...SHADOWS.sm,
  },
  outline: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  fullWidth: { width: '100%' },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelLight: { color: COLORS.white },
  labelPrimary: { color: COLORS.primary },
});
