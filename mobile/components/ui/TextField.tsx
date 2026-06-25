import { StyleSheet, TextInput, TextInputProps, View, Text, TouchableOpacity } from 'react-native';
import Icon, { IconName } from './Icon';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  icon?: IconName;
  error?: string;
  hint?: string;
  trailingIcon?: IconName;
  onTrailingPress?: () => void;
  dense?: boolean;
}

export default function TextField({
  label,
  icon,
  error,
  hint,
  trailingIcon,
  onTrailingPress,
  dense,
  style,
  ...props
}: TextFieldProps) {
  return (
    <View style={[styles.wrap, dense && styles.wrapDense]}>
      <Text style={[styles.label, dense && styles.labelDense]}>{label}</Text>
      <View style={[styles.inputRow, dense && styles.inputRowDense, error ? styles.inputError : null, props.editable === false && styles.inputDisabled]}>
        {icon ? <Icon name={icon} size={20} color={error ? COLORS.error : COLORS.textMuted} /> : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          {...props}
        />
        {trailingIcon && onTrailingPress ? (
          <TouchableOpacity onPress={onTrailingPress} hitSlop={8} accessibilityRole="button">
            <Icon name={trailingIcon} size={20} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.md },
  wrapDense: { marginBottom: SPACING.sm },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  labelDense: { fontSize: 13, marginBottom: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    minHeight: FONTS.buttonMinSize,
  },
  inputRowDense: {
    minHeight: 44,
    paddingHorizontal: SPACING.sm + 4,
    borderRadius: RADIUS.md,
  },
  inputError: { borderColor: COLORS.error, backgroundColor: 'rgba(239, 68, 68, 0.04)' },
  inputDisabled: { opacity: 0.7 },
  input: {
    flex: 1,
    fontSize: FONTS.minSize,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  error: { fontSize: 12, color: COLORS.error, marginTop: 4, fontWeight: '600' },
  hint: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
});
