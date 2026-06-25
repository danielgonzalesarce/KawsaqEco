import { View, Text, StyleSheet } from 'react-native';
import Icon from './ui/Icon';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface Props {
  posicion: number;
  nombre: string;
  puntos: number;
}

export default function LeaderboardRow({ posicion, nombre, puntos }: Props) {
  const isTop3 = posicion <= 3;
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <View style={[styles.row, isTop3 && styles.rowTop]}>
      <View style={[styles.rankBadge, isTop3 && { backgroundColor: medalColors[posicion - 1] + '30' }]}>
        {isTop3 ? (
          <Icon name="trophy" size={18} color={medalColors[posicion - 1]} />
        ) : (
          <Text style={styles.rank}>{posicion}</Text>
        )}
      </View>
      <Text style={styles.nombre} numberOfLines={1}>{nombre}</Text>
      <View style={styles.pointsBadge}>
        <Text style={styles.puntos}>{puntos.toLocaleString()}</Text>
        <Text style={styles.ptsLabel}>pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
    marginVertical: 3,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  rowTop: { borderWidth: 1, borderColor: COLORS.border },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  nombre: {
    flex: 1,
    fontSize: FONTS.minSize,
    fontWeight: '600',
    color: COLORS.text,
  },
  pointsBadge: { alignItems: 'flex-end' },
  puntos: { fontSize: FONTS.minSize, color: COLORS.primary, fontWeight: '800' },
  ptsLabel: { fontSize: 11, color: COLORS.textMuted },
});
