import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from '../../components/ui/Icon';
import Card from '../../components/ui/Card';
import { getHome, HomeSummary } from '../../services/api';
import { getUnifiedUserStats } from '../../services/userStats';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { DISTRITO_FOCO, RECOJO_SANTA_ANITA } from '../../constants/santaAnita';

const QUICK_ACTIONS: { label: string; icon: IconName; route: string; tab?: boolean }[] = [
  { label: 'Escanear', icon: 'scan', route: '/(tabs)/scan', tab: true },
  { label: 'Canjear', icon: 'gift', route: '/(tabs)/recompensas', tab: true },
  { label: 'Acopio', icon: 'map', route: '/(tabs)/mapa', tab: true },
  { label: 'Mi impacto', icon: 'analytics', route: '/dashboard' },
];

const HOME_FALLBACK: HomeSummary = {
  puntos: 0,
  nivel: 'Semilla',
  emoji: '🌱',
  co2_evitado_kg: 0,
  agua_ahorrada_lt: 0,
  arboles_equivalentes: 0,
  distrito_foco: DISTRITO_FOCO,
  puntos_acopio: 5,
  tip_personalizado: 'Escanea tu primer residuo y gana puntos canjeables en Santa Anita.',
  escaneos_total: 0,
  ranking_top: [],
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [data, setData] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const home = await getHome();
      const stats = await getUnifiedUserStats();
      setData({
        ...home,
        escaneos_total: Math.max(home.escaneos_total, stats.escaneos),
        co2_evitado_kg: home.co2_evitado_kg > 0 ? home.co2_evitado_kg : stats.co2_evitado_kg,
        agua_ahorrada_lt: home.agua_ahorrada_lt > 0 ? home.agua_ahorrada_lt : stats.agua_ahorrada_lt,
      });
      setOffline(false);
    } catch {
      const stats = await getUnifiedUserStats();
      setData({
        ...HOME_FALLBACK,
        puntos: stats.puntos,
        escaneos_total: stats.escaneos,
        nivel: stats.nivel,
        emoji: stats.emoji,
        co2_evitado_kg: stats.co2_evitado_kg,
        agua_ahorrada_lt: stats.agua_ahorrada_lt,
      });
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) load();
    }, [load, loading]),
  );

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tu resumen...</Text>
      </View>
    );
  }

  const d = data ?? HOME_FALLBACK;

  // Altura útil: pantalla − header tabs (~56) − tab bar (~60) − safe areas
  const tabBarHeight = 60 + insets.bottom;
  const headerHeight = 56 + insets.top;
  const contentMinHeight = Math.max(windowHeight - headerHeight - tabBarHeight, 520);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { minHeight: contentMinHeight, paddingBottom: insets.bottom + SPACING.md },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          colors={[COLORS.primary]}
        />
      }
    >
      <View style={styles.page}>
        <View style={styles.topBlock}>
          {offline && (
            <View style={styles.offlineBanner}>
              <Icon name="cloud-offline-outline" size={16} color={COLORS.warning} />
              <Text style={styles.offlineText}>
                Sin conexión — conecta USB, ejecuta npm run start:all y verifica el backend
              </Text>
            </View>
          )}

          <View style={styles.hero}>
            <Text style={styles.greeting}>¡Allin p'unchay!</Text>
            <Text style={styles.subGreeting}>Piloto KawsaqEco · {DISTRITO_FOCO}</Text>
          </View>

          <View style={styles.profileRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelEmoji}>{d.emoji}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.nivel}>{d.nivel}</Text>
              <Text style={styles.puntos}>
                {d.puntos.toLocaleString()} puntos · {d.escaneos_total} escaneos
              </Text>
            </View>
            <TouchableOpacity
              style={styles.impactChip}
              onPress={() => router.push('/dashboard')}
            >
              <Icon name="leaf" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.rewardsBanner}
            onPress={() => router.push('/(tabs)/recompensas')}
          >
            <Icon name="gift" size={24} color={COLORS.white} />
            <View style={styles.rewardsBody}>
              <Text style={styles.rewardsTitle}>{d.puntos.toLocaleString()} pts canjeables</Text>
              <Text style={styles.rewardsSub}>Canjea en bodegas, transporte y ecoparque de Santa Anita</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.saInfo}>
            <Icon name="location" size={18} color={COLORS.primary} />
            <Text style={styles.saInfoText}>
              {d.puntos_acopio ?? 5} puntos de acopio · Recojo {RECOJO_SANTA_ANITA.residuosSolidos}
            </Text>
          </View>
        </View>

        <View style={styles.middleBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>Acciones rápidas</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity
                key={a.label}
                style={styles.actionCard}
                onPress={() => router.push(a.route as never)}
              >
                <View style={styles.actionIcon}>
                  <Icon name={a.icon} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Tu impacto</Text>
          <View style={styles.statsRow}>
            <StatBox icon="cloud-outline" value={d.co2_evitado_kg.toFixed(1)} unit="kg CO₂" />
            <StatBox icon="water-outline" value={String(d.agua_ahorrada_lt.toFixed(0))} unit="L agua" />
            <StatBox icon="leaf" value={d.arboles_equivalentes.toFixed(1)} unit="árboles eq." />
          </View>

          {(d.proyeccion_anual_co2 ?? 0) > 0 && (
            <Card style={styles.projCard}>
              <View style={styles.tipHeader}>
                <Icon name="trending-up" size={18} color={COLORS.primary} />
                <Text style={styles.tipTitle}>Proyección anual</Text>
              </View>
              <Text style={styles.tipText}>
                Si mantienes este ritmo, evitarías ~{d.proyeccion_anual_co2?.toFixed(1)} kg CO₂ al año.
              </Text>
            </Card>
          )}

          {d.retos && d.retos.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Retos de la semana</Text>
              {d.retos.slice(0, 2).map(reto => (
                <View key={reto.id} style={styles.retoRow}>
                  <View style={styles.retoInfo}>
                    <Text style={styles.retoName}>{reto.nombre}</Text>
                    <Text style={styles.retoDesc}>{reto.descripcion}</Text>
                    <View style={styles.retoTrack}>
                      <View style={[styles.retoFill, { width: `${reto.porcentaje}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.retoPts}>+{reto.puntos_recompensa}</Text>
                </View>
              ))}
            </>
          )}

          {(d.residuo_frecuente || d.reto_sugerido) && (
            <Card style={styles.persCard}>
              <View style={styles.tipHeader}>
                <Icon name="person-circle" size={18} color={COLORS.earth} />
                <Text style={styles.tipTitle}>Personalizado para ti</Text>
              </View>
              {d.residuo_frecuente ? (
                <Text style={styles.tipText}>Reciclas más: {d.residuo_frecuente}</Text>
              ) : null}
              {d.reto_sugerido ? (
                <Text style={styles.tipText}>Reto: {d.reto_sugerido}</Text>
              ) : null}
              {(d.racha_dias ?? 0) > 0 && (
                <Text style={styles.rachaText}>🔥 Racha: {d.racha_dias} días</Text>
              )}
            </Card>
          )}
        </View>

        <View style={styles.bottomBlock}>
          {d.tip_personalizado ? (
            <Card style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Icon name="bulb" size={18} color={COLORS.earth} />
                <Text style={styles.tipTitle}>Tip del día</Text>
              </View>
              <Text style={styles.tipText}>{d.tip_personalizado}</Text>
            </Card>
          ) : null}

          {(d.usuarios_comunidad ?? 0) > 0 && (
            <View style={styles.communityCard}>
              <Icon name="people" size={22} color={COLORS.primary} />
              <View style={styles.communityBody}>
                <Text style={styles.communityTitle}>Comunidad KawsaqEco</Text>
                <Text style={styles.communitySub}>
                  {d.usuarios_comunidad}+ vecinos activos en {DISTRITO_FOCO}
                </Text>
              </View>
            </View>
          )}

          {d.ranking_top.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Top vecinos {DISTRITO_FOCO}</Text>
              {d.ranking_top.map(r => (
                <View key={r.nombre} style={styles.rankRow}>
                  <Text style={styles.rankPos}>#{r.posicion}</Text>
                  <Text style={styles.rankName}>{r.nombre}</Text>
                  <Text style={styles.rankPts}>{r.total_points.toLocaleString()} pts</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function StatBox({ icon, value, unit }: { icon: IconName; value: string; unit: string }) {
  return (
    <View style={styles.statBox}>
      <Icon name={icon} size={18} color={COLORS.primaryLight} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  page: {
    flex: 1,
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  topBlock: { gap: SPACING.sm },
  middleBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  bottomBlock: { gap: SPACING.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textMuted, fontSize: FONTS.minSize },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FEF3C7',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  offlineText: { fontSize: 12, color: COLORS.earth, flex: 1 },
  hero: { marginBottom: SPACING.xs },
  greeting: { fontSize: 28, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  subGreeting: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.lg,
  },
  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelEmoji: { fontSize: 28 },
  profileInfo: { flex: 1, marginLeft: SPACING.sm },
  nivel: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  puntos: { fontSize: 13, color: COLORS.accent, marginTop: 2 },
  impactChip: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.earth,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  rewardsBody: { flex: 1 },
  rewardsTitle: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  rewardsSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  saInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  saInfoText: { flex: 1, fontSize: 12, color: COLORS.accent, lineHeight: 18 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  sectionLabelFirst: { marginTop: 0 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  actionCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  statUnit: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  projCard: { marginBottom: SPACING.sm },
  persCard: { marginBottom: SPACING.sm },
  rachaText: { fontSize: 14, fontWeight: '700', color: COLORS.earth, marginTop: 6 },
  retoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
    marginBottom: 6,
    ...SHADOWS.sm,
  },
  retoInfo: { flex: 1 },
  retoName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  retoDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  retoTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  retoFill: { height: '100%', backgroundColor: COLORS.primary },
  retoPts: { fontWeight: '800', color: COLORS.earth, marginLeft: SPACING.sm },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  communityBody: { flex: 1 },
  communityTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  communitySub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  tipCard: { marginBottom: 0 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  tipTitle: { fontSize: 14, fontWeight: '700', color: COLORS.earth },
  tipText: { fontSize: FONTS.minSize, color: COLORS.text, lineHeight: 22 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    marginBottom: 4,
    ...SHADOWS.sm,
  },
  rankPos: { width: 32, fontWeight: '800', color: COLORS.primary },
  rankName: { flex: 1, fontWeight: '600', color: COLORS.text },
  rankPts: { fontWeight: '700', color: COLORS.earth },
});
