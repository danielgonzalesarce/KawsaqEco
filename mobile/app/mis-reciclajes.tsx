import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Icon, { IconName } from '../components/ui/Icon';
import Button from '../components/ui/Button';
import {
  getRecyclingHistory,
  getRecyclingStats,
  RecyclingEntry,
} from '../services/recyclingHistory';
import { getUnifiedUserStats } from '../services/userStats';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

const TIPO_ICONS: Record<string, IconName> = {
  plástico: 'water-outline',
  papel: 'document-text-outline',
  vidrio: 'wine-outline',
  metal: 'hardware-chip-outline',
  orgánico: 'nutrition-outline',
  electrónico: 'phone-portrait-outline',
};

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MisReciclajesScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<RecyclingEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, puntos: 0, entregados: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [items, unified] = await Promise.all([
      getRecyclingHistory(),
      getUnifiedUserStats(),
    ]);
    setHistory(items);
    setStats({
      total: unified.escaneos,
      puntos: unified.puntos,
      entregados: unified.entregados,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function goToAcopio(entry: RecyclingEntry) {
    if (entry.acopio_lat && entry.acopio_lng) {
      router.push({
        pathname: '/(tabs)/mapa',
        params: {
          focusLat: String(entry.acopio_lat),
          focusLng: String(entry.acopio_lng),
          focusNombre: entry.acopio_nombre ?? '',
          tipo: entry.tipo,
        },
      });
    } else {
      router.push('/(tabs)/mapa');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>escaneos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.puntos}</Text>
          <Text style={styles.statLabel}>puntos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.entregados}</Text>
          <Text style={styles.statLabel}>entregados</Text>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="leaf-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aún no has reciclado nada</Text>
            <Text style={styles.emptyText}>
              Escanea un producto y aparecerá aquí con los puntos que ganaste.
            </Text>
            <Button
              label="Escanear ahora"
              icon="scan"
              onPress={() => router.push('/(tabs)/scan')}
              style={styles.emptyBtn}
            />
          </View>
        }
        renderItem={({ item }) => {
          const icon = TIPO_ICONS[item.tipo] ?? 'cube-outline';
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}>
                  <Icon name={icon} size={20} color={COLORS.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.nombre}>{item.nombre_especifico}</Text>
                  <Text style={styles.meta}>
                    {item.tipo} · {formatFecha(item.fecha)}
                  </Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>+{item.puntos}</Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    item.estado === 'entregado' ? styles.statusDone : styles.statusPending,
                  ]}
                >
                  <Icon
                    name={item.estado === 'entregado' ? 'checkmark-circle' : 'time-outline'}
                    size={14}
                    color={item.estado === 'entregado' ? COLORS.success : COLORS.warning}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: item.estado === 'entregado' ? COLORS.success : COLORS.warning },
                    ]}
                  >
                    {item.estado === 'entregado' ? 'Entregado al acopio' : 'Pendiente de llevar'}
                  </Text>
                </View>
              </View>

              {item.acopio_nombre ? (
                <TouchableOpacity style={styles.acopioRow} onPress={() => goToAcopio(item)}>
                  <Icon name="navigate" size={16} color={COLORS.primary} />
                  <Text style={styles.acopioLink}>{item.acopio_nombre}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  summary: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    margin: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', color: COLORS.white },
  statLabel: { fontSize: 12, color: COLORS.accent, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  nombre: { fontSize: FONTS.minSize, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, textTransform: 'capitalize' },
  pointsBadge: {
    backgroundColor: COLORS.overlay,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  statusRow: { marginTop: SPACING.sm },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusDone: { backgroundColor: '#D1FAE5' },
  statusText: { fontSize: 12, fontWeight: '600' },
  acopioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  acopioLink: { fontSize: 13, color: COLORS.primary, fontWeight: '600', flex: 1 },
  empty: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: FONTS.minSize, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: SPACING.md },
});
