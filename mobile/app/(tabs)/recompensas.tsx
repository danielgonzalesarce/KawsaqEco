import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import {
  getRewards,
  redeemReward,
  getRewardsBalance,
  getRedemptionHistory,
  RedemptionHistoryItem,
} from '../../services/api';
import { DISTRITO_FOCO } from '../../constants/santaAnita';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

interface Reward {
  id: string;
  nombre: string;
  descripcion: string;
  puntos_requeridos: number;
  tipo: string;
  partner: string;
  valor_monetario: number;
  stock: number;
}

const TIPO_ICONS: Record<string, string> = {
  descuento: 'pricetag-outline',
  recarga: 'phone-portrait-outline',
  producto: 'cube-outline',
  insignia: 'ribbon-outline',
  experiencia: 'leaf-outline',
  sorteo: 'ticket-outline',
};

export default function RecompensasTab() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [puntos, setPuntos] = useState(0);
  const [historial, setHistorial] = useState<RedemptionHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [catalog, balance, history] = await Promise.all([
      getRewards().catch(() => []),
      getRewardsBalance().catch(() => ({ puntos: 0 })),
      getRedemptionHistory().catch(() => []),
    ]);
    setRewards(catalog);
    setPuntos(balance.puntos);
    setHistorial(history);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleRedeem(reward: Reward) {
    if (puntos < reward.puntos_requeridos) {
      Alert.alert('Puntos insuficientes', `Necesitas ${reward.puntos_requeridos} pts. Tienes ${puntos}.`);
      return;
    }
    Alert.alert(
      'Canjear recompensa',
      `¿Canjear "${reward.nombre}" por ${reward.puntos_requeridos} pts?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Canjear',
          onPress: async () => {
            try {
              const res = await redeemReward(reward.id);
              setPuntos(res.puntos_restantes);
              await load();
              Alert.alert(
                '¡Canje exitoso!',
                `Presenta tu código en ${reward.partner}:\n\n${res.codigo_canje}\n\nPuntos restantes: ${res.puntos_restantes}`,
              );
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Intenta de nuevo';
              Alert.alert('No se pudo canjear', msg);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.balanceCard}>
          <Icon name="star" size={28} color={COLORS.earth} />
          <View style={styles.balanceText}>
            <Text style={styles.balanceLabel}>Tus puntos canjeables</Text>
            <Text style={styles.balanceValue}>{puntos.toLocaleString()} pts</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>
          Beneficios locales en {DISTRITO_FOCO} · Pilares 03 y 09
        </Text>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
        ListHeaderComponent={
          historial.length > 0 ? (
            <View style={styles.historyBlock}>
              <Text style={styles.sectionTitle}>Últimos canjes</Text>
              {historial.slice(0, 3).map(h => (
                <View key={h.codigo} style={styles.historyRow}>
                  <Icon name="checkmark-circle" size={18} color={COLORS.success} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyName}>{h.reward_nombre}</Text>
                    <Text style={styles.historyCode}>Código: {h.codigo}</Text>
                  </View>
                  <Text style={styles.historyPts}>-{h.puntos_gastados}</Text>
                </View>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const canAfford = puntos >= item.puntos_requeridos;
          const agotado = item.stock === 0;
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.rewardIcon}>
                  <Icon
                    name={(TIPO_ICONS[item.tipo] ?? 'gift-outline') as Parameters<typeof Icon>[0]['name']}
                    size={22}
                    color={COLORS.earth}
                  />
                </View>
                <View style={styles.cardTitleArea}>
                  <Text style={styles.nombre}>{item.nombre}</Text>
                  <Text style={styles.partner}>{item.partner}</Text>
                </View>
                <View style={[styles.pointsBadge, canAfford && styles.pointsBadgeOk]}>
                  <Text style={styles.puntos}>{item.puntos_requeridos}</Text>
                  <Text style={styles.ptsLabel}>pts</Text>
                </View>
              </View>
              <Text style={styles.desc}>{item.descripcion}</Text>
              {item.valor_monetario > 0 && (
                <View style={styles.valorRow}>
                  <Icon name="cash-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.valor}>Valor: S/ {item.valor_monetario.toFixed(2)}</Text>
                </View>
              )}
              {agotado ? (
                <Text style={styles.agotado}>Agotado temporalmente</Text>
              ) : (
                <Button
                  label={canAfford ? 'Canjear ahora' : `Te faltan ${item.puntos_requeridos - puntos} pts`}
                  icon="arrow-forward"
                  onPress={() => handleRedeem(item)}
                  fullWidth
                  style={styles.btn}
                  disabled={!canAfford}
                />
              )}
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="gift-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Cargando catálogo...</Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.footerTip}>
            <Icon name="information-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.footerText}>
              Gana puntos escaneando residuos y completando retos semanales.
            </Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.md, paddingBottom: SPACING.sm },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  balanceText: { flex: 1 },
  balanceLabel: { fontSize: 13, color: COLORS.textSecondary },
  balanceValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  headerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  list: { padding: SPACING.md, paddingTop: 0, paddingBottom: SPACING.xl },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  historyBlock: { marginBottom: SPACING.md },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: 6,
  },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  historyCode: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  historyPts: { fontSize: 14, fontWeight: '700', color: COLORS.warning },
  card: { marginBottom: SPACING.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleArea: { flex: 1 },
  nombre: { fontSize: FONTS.minSize, fontWeight: '700', color: COLORS.primary },
  partner: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  pointsBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  pointsBadgeOk: { backgroundColor: COLORS.overlay },
  puntos: { fontSize: FONTS.minSize, fontWeight: '800', color: COLORS.earth },
  ptsLabel: { fontSize: 10, color: COLORS.textMuted },
  desc: { fontSize: FONTS.minSize, color: COLORS.text, marginTop: SPACING.sm, lineHeight: 22 },
  valorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm },
  valor: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  agotado: {
    marginTop: SPACING.md,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  btn: { marginTop: SPACING.md },
  empty: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm },
  emptyText: { fontSize: FONTS.minSize, color: COLORS.textMuted },
  footerTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.sm,
  },
  footerText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
