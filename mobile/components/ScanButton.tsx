import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import Icon, { IconName } from './ui/Icon';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface Props {
  onPress: () => void;
  loading?: boolean;
  label?: string;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function ScanButton({
  onPress,
  loading,
  label = 'Escanear residuo',
  icon = 'camera',
  variant = 'primary',
}: Props) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  const iconColor = isPrimary ? COLORS.white : COLORS.primary;
  const textStyle = isPrimary ? styles.textLight : styles.textDark;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        isOutline && styles.outline,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="large" />
      ) : (
        <View style={styles.content}>
          <Icon name={icon} size={22} color={iconColor} />
          <Text style={[styles.textBase, textStyle]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.xl,
    minHeight: FONTS.buttonMinSize,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.lg,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  textBase: {
    fontSize: 17,
    fontWeight: '700',
  },
  textLight: { color: COLORS.white },
  textDark: { color: COLORS.primary },
});
