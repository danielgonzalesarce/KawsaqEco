import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Share, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import ImpactCard from '../components/ImpactCard';
import LeaderboardRow from '../components/LeaderboardRow';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import SectionTitle from '../components/ui/SectionTitle';
import Card from '../components/ui/Card';
import { getImpact, getRanking, getPersonalization, getChallenges, ChallengeItem } from '../services/api';
import { getUnifiedUserStats } from '../services/userStats';
import { syncPointsFromServer } from '../services/userPoints';
import { useAuth } from '../hooks/useAuth';
import { DISTRITO_FOCO } from '../constants/santaAnita';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

const LEVEL_ICONS: Record<string, string> = {
  Semilla: 'leaf-outline',
  Brote: 'trending-up-outline',
  Árbol: 'leaf',
  Bosque: 'globe-outline',
  'Héroe Kawsaq': 'trophy',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [points, setPoints] = useState({
    total_points: 0,
    nivel: 'Semilla',
    emoji: '🌱',
    puntos_faltantes: 200,
  });
  const [impact, setImpact] = useState({
    co2_evitado_kg: 0,
    agua_ahorrada_lt: 0,
    arboles_equivalentes: 0,
    residuos_por_tipo: {} as Record<string, number>,
  });
  const [ranking, setRanking] = useState<{ nombre: string; total_points: number; posicion: number }[]>([]);
  const [tip, setTip] = useState('');
  const [residuoFreq, setResiduoFreq] = useState('');
  const [retoSugerido, setRetoSugerido] = useState('');
  const [proyeccionCo2, setProyeccionCo2] = useState(0);
  const [retos, setRetos] = useState<ChallengeItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const [pointsData, imp, rank, pers, ch] = await Promise.all([
        syncPointsFromServer(),
        getImpact(),
        getRanking(),
        getPersonalization(),
        getChallenges().catch(() => ({ retos: [] as ChallengeItem[] })),
      ]);
      const summary = pointsData.summary;
      setPoints({
        total_points: summary.total_points,
        nivel: summary.nivel,
        emoji: summary.emoji,
        puntos_faltantes: summary.puntos_faltantes,
      });
      setImpact({
        co2_evitado_kg: imp.co2_evitado_kg,
        agua_ahorrada_lt: imp.agua_ahorrada_lt,
        arboles_equivalentes: imp.arboles_equivalentes,
        residuos_por_tipo: imp.residuos_por_tipo,
      });
      setRanking(rank);
      setTip(pers.tip_personalizado || '');
      setResiduoFreq(pers.residuo_frecuente || '');
      setRetoSugerido(pers.reto_sugerido || '');
      setProyeccionCo2(imp.proyeccion_anual_co2 ?? 0);
      setRetos(ch.retos ?? []);
    } catch {
      const stats = await getUnifiedUserStats();
      setPoints({
        total_points: stats.puntos,
        nivel: stats.nivel,
        emoji: stats.emoji,
        puntos_faltantes: stats.puntos_faltantes,
      });
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function shareImpact() {
    const msg = `🌱 En KawsaqEco he evitado ${impact.co2_evitado_kg} kg de CO₂ y ahorrado ${impact.agua_ahorrada_lt} L de agua reciclando en ${DISTRITO_FOCO}. ¡Únete!`;
    await Share.share({ message: msg });
  }

  const levelIcon = (LEVEL_ICONS[points.nivel] ?? 'leaf-outline') as Parameters<typeof Icon>[0]['name'];
  const progressPct = points.puntos_faltantes > 0
    ? Math.max(10, 100 - (points.puntos_faltantes / 200) * 100)
    : 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      <View style={styles.profileCard}>
        {user?.nombre ? <Text style={styles.userName}>{user.nombre}</Text> : null}
        <View style={styles.levelIconWrap}>
          <Icon name={levelIcon} size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.nivel}>{points.nivel}</Text>
        <Text style={styles.pts}>{points.total_points.toLocaleString()} puntos</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        {points.puntos_faltantes > 0 && (
          <Text style={styles.next}>
            Faltan {points.puntos_faltantes} pts para el siguiente nivel
          </Text>
        )}
      </View>

      {tip || residuoFreq ? (
        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Icon name="bulb" size={18} color={COLORS.earth} />
            <Text style={styles.tipTitle}>Personalización por hábitos</Text>
          </View>
          {residuoFreq ? <Text style={styles.tip}>Residuo frecuente: {residuoFreq}</Text> : null}
          {tip ? <Text style={styles.tip}>{tip}</Text> : null}
          {retoSugerido ? <Text style={styles.reto}>Reto sugerido: {retoSugerido}</Text> : null}
        </Card>
      ) : null}

      <ImpactCard
        co2Kg={impact.co2_evitado_kg}
        aguaLt={impact.agua_ahorrada_lt}
        arboles={impact.arboles_equivalentes}
        label="Tu impacto ambiental"
      />

      {proyeccionCo2 > 0 && (
        <Card style={styles.projCard}>
          <View style={styles.tipHeader}>
            <Icon name="analytics" size={18} color={COLORS.primary} />
            <Text style={styles.tipTitle}>Proyección anual CO₂</Text>
          </View>
          <Text style={styles.projValue}>{proyeccionCo2.toFixed(1)} kg CO₂/año</Text>
          <Text style={styles.projSub}>Estimado si mantienes tu ritmo de reciclaje actual</Text>
        </Card>
      )}

      {retos.length > 0 && (
        <>
          <SectionTitle title="Retos activos" icon="game-controller-outline" />
          {retos.map(reto => (
            <View key={reto.id} style={styles.retoRow}>
              <View style={styles.retoLeft}>
                <Text style={styles.retoName}>{reto.nombre}</Text>
                <Text style={styles.retoDesc}>{reto.progreso}/{reto.meta} · +{reto.puntos_recompensa} pts</Text>
                <View style={styles.retoTrack}>
                  <View style={[styles.retoFill, { width: `${reto.porcentaje}%` }]} />
                </View>
              </View>
              {reto.completado && <Icon name="checkmark-circle" size={22} color={COLORS.success} />}
            </View>
          ))}
        </>
      )}

      <SectionTitle title="Residuos por tipo" icon="bar-chart-outline" />
      {Object.entries(impact.residuos_por_tipo || {}).map(([tipo, count]) => (
        <View key={tipo} style={styles.typeRow}>
          <View style={styles.typeLeft}>
            <Icon name="cube-outline" size={16} color={COLORS.primaryLight} />
            <Text style={styles.typeName}>{tipo}</Text>
          </View>
          <Text style={styles.typeCount}>{count} escaneos</Text>
        </View>
      ))}
      {Object.keys(impact.residuos_por_tipo || {}).length === 0 && (
        <Text style={styles.empty}>Escanea tu primer residuo para ver estadísticas</Text>
      )}

      <Button
        label="Compartir mi impacto"
        icon="share-social-outline"
        onPress={shareImpact}
        variant="outline"
        fullWidth
        style={styles.rewardsBtn}
      />

      <Button
        label="Ver mis reciclajes"
        icon="time-outline"
        onPress={() => router.push('/mis-reciclajes')}
        variant="outline"
        fullWidth
        style={styles.rewardsBtn}
      />

      <Button
        label="Canjear recompensas"
        icon="gift-outline"
        onPress={() => router.push('/(tabs)/recompensas')}
        variant="secondary"
        fullWidth
        style={styles.rewardsBtn}
      />

      <SectionTitle title="Ranking distrital" icon="medal-outline" />
      {ranking.map(r => (
        <LeaderboardRow
          key={r.nombre}
          posicion={r.posicion}
          nombre={r.nombre}
          puntos={r.total_points}
        />
      ))}

      <Card style={styles.compare}>
        <View style={styles.compareHeader}>
          <Icon name="analytics-outline" size={20} color={COLORS.primary} />
          <Text style={styles.compareTitle}>Comparativa nacional</Text>
        </View>
        {[
          { icon: 'location' as const, text: `Piloto ${DISTRITO_FOCO}` },
          { icon: 'globe-outline' as const, text: 'Promedio OCDE: 34% reciclaje' },
          { icon: 'flag-outline' as const, text: 'Meta Perú 2030: 15%' },
        ].map(item => (
          <View key={item.text} style={styles.compareRow}>
            <Icon name={item.icon} size={16} color={COLORS.textSecondary} />
            <Text style={styles.compareText}>{item.text}</Text>
          </View>
        ))}
      </Card>

      <Button
        label="Cerrar sesión"
        icon="log-out-outline"
        variant="outline"
        fullWidth
        style={styles.logoutBtn}
        onPress={() =>
          Alert.alert('Cerrar sesión', '¿Salir de tu cuenta?', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Salir',
              style: 'destructive',
              onPress: async () => {
                await logout();
                router.replace('/login');
              },
            },
          ])
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.lg,
  },
  levelIconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  nivel: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  userName: { fontSize: 14, color: COLORS.accent, marginBottom: SPACING.sm, fontWeight: '600' },
  pts: { fontSize: FONTS.minSize, color: COLORS.accent, marginTop: 4, fontWeight: '500' },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },
  next: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: SPACING.sm },
  tipCard: { marginBottom: SPACING.sm },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  tipTitle: { fontSize: 14, fontWeight: '700', color: COLORS.earth },
  tip: { fontSize: FONTS.minSize, color: COLORS.text, lineHeight: 22 },
  reto: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginTop: 8 },
  projCard: { marginBottom: SPACING.sm },
  projValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  projSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  retoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    marginVertical: 3,
    ...SHADOWS.sm,
  },
  retoLeft: { flex: 1 },
  retoName: { fontSize: FONTS.minSize, fontWeight: '700' },
  retoDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  retoTrack: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    marginTop: 6,
    overflow: 'hidden',
  },
  retoFill: { height: '100%', backgroundColor: COLORS.primary },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    marginVertical: 3,
    ...SHADOWS.sm,
  },
  typeLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  typeName: { fontSize: FONTS.minSize, textTransform: 'capitalize', fontWeight: '500' },
  typeCount: { fontSize: 14, color: COLORS.textSecondary },
  empty: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic', padding: SPACING.sm },
  rewardsBtn: { marginTop: SPACING.md },
  logoutBtn: { marginTop: SPACING.lg, marginBottom: SPACING.md },
  compare: { marginTop: SPACING.lg, marginBottom: SPACING.xl },
  compareHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  compareTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginVertical: 4 },
  compareText: { fontSize: FONTS.minSize, color: COLORS.text, flex: 1 },
});
