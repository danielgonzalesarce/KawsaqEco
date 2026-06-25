import { View, Text, StyleSheet } from 'react-native';
import Icon, { IconName } from './ui/Icon';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface Props {
  co2Kg: number;
  aguaLt: number;
  arboles: number;
  label?: string;
}

function StatItem({ icon, value, unit }: { icon: IconName; value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Icon name={icon} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

export default function ImpactCard({ co2Kg, aguaLt, arboles, label }: Props) {
  return (
    <View style={styles.card}>
      {label && (
        <View style={styles.labelRow}>
          <Icon name="earth" size={18} color={COLORS.primary} />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <View style={styles.row}>
        <StatItem icon="cloud-outline" value={co2Kg.toFixed(2)} unit="kg CO₂ evitado" />
        <View style={styles.divider} />
        <StatItem icon="water-outline" value={aguaLt.toFixed(0)} unit="L agua ahorrada" />
      </View>
      <View style={styles.treesRow}>
        <Icon name="leaf" size={18} color={COLORS.earth} />
        <Text style={styles.trees}>Equivale a {arboles.toFixed(1)} árboles plantados</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    ...SHADOWS.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.minSize,
    fontWeight: '700',
    color: COLORS.primary,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  divider: { width: 1, height: 48, backgroundColor: COLORS.border },
  value: { fontSize: 26, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  unit: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  treesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  trees: { fontSize: FONTS.minSize, color: COLORS.earth, fontWeight: '600' },
});
