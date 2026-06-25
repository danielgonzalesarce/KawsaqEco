import { View, Text, StyleSheet } from 'react-native';
import Icon, { IconName } from './Icon';
import { COLORS, SPACING } from '../../constants/theme';

interface SectionTitleProps {
  title: string;
  icon?: IconName;
}

export default function SectionTitle({ title, icon }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      {icon && <Icon name={icon} size={20} color={COLORS.primary} />}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
});
