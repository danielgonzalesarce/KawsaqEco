import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Icon, { IconName } from '../components/ui/Icon';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { verifyAcopio } from '../services/api';
import { getRecyclingEntry, markRecyclingDelivered } from '../services/recyclingHistory';
import { syncPointsFromServer, PointsSummary } from '../services/userPoints';
import { getAcopioVerifyLocation } from '../utils/gpsLocation';
import { haversineMeters, formatDistance } from '../utils/distance';
import { openGoogleMapsNavigation } from '../utils/navigation';
import { ACOPIO_GEOFENCE_RADIUS_M } from '../constants/santaAnita';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

const TIPO_ICONS: Record<string, IconName> = {
  plástico: 'water-outline',
  papel: 'document-text-outline',
  vidrio: 'wine-outline',
  metal: 'hardware-chip-outline',
  orgánico: 'nutrition-outline',
  electrónico: 'phone-portrait-outline',
};

interface AcopioCercano {
  id?: string;
  nombre: string;
  direccion: string;
  distancia_m: number;
  lat?: number;
  lng?: number;
}

type Phase = 'pending' | 'confirming' | 'success';

export default function ScanResultScreen() {
  const { data, entryId } = useLocalSearchParams<{ data: string; entryId?: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const [phase, setPhase] = useState<Phase>('pending');
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);
  const [offlineConfirm, setOfflineConfirm] = useState(false);
  const [proximityDist, setProximityDist] = useState<number | null>(null);
  const [canConfirm, setCanConfirm] = useState(false);
  const [proximityLoading, setProximityLoading] = useState(false);
  const [proximityHint, setProximityHint] = useState('Comprobando tu ubicación...');

  let result: Record<string, unknown> = {};
  try {
    result = JSON.parse(data || '{}');
  } catch {
    result = {};
  }

  const acopio = result.acopio_cercano as AcopioCercano | undefined;
  const puntos = Number(result.puntos || 5);
  const puntosExtra = 20;
  const puntosGanadosTotal = puntos + puntosExtra;
  const nombre = String(result.nombre_especifico || 'Residuo identificado');
  const tipo = String(result.tipo || 'residuo');

  const checkProximity = useCallback(async () => {
    if (phase !== 'pending') return;
    setProximityLoading(true);
    try {
      const gps = await getAcopioVerifyLocation();
      if (!gps.granted) {
        setCanConfirm(false);
        setProximityDist(null);
        setProximityHint('Activa el GPS y concede permiso de ubicación para confirmar la entrega.');
        return;
      }

      const targetLat = acopio?.lat;
      const targetLng = acopio?.lng;

      if (targetLat != null && targetLng != null) {
        const dist = haversineMeters(gps.lat, gps.lng, targetLat, targetLng);
        setProximityDist(dist);
        const near = dist <= ACOPIO_GEOFENCE_RADIUS_M;
        setCanConfirm(near);
        setProximityHint(
          near
            ? `Estás a ${formatDistance(dist)} del acopio. Puedes confirmar la entrega.`
            : `Acércate a menos de ${ACOPIO_GEOFENCE_RADIUS_M} m (ahora: ${formatDistance(dist)}).`,
        );
      } else {
        setProximityDist(null);
        setCanConfirm(true);
        setProximityHint('Confirma solo cuando hayas entregado el residuo en el punto de acopio.');
      }
    } finally {
      setProximityLoading(false);
    }
  }, [acopio?.lat, acopio?.lng, phase]);

  useEffect(() => {
    if (phase !== 'pending') return;
    checkProximity();
    const timer = setInterval(checkProximity, 12000);
    return () => clearInterval(timer);
  }, [checkProximity, phase]);

  async function loadPointsSummary() {
    const { summary } = await syncPointsFromServer();
    setPointsSummary(summary);
    return summary;
  }

  useEffect(() => {
    if (!entryId) return;
    getRecyclingEntry(entryId).then(async entry => {
      if (entry?.estado === 'entregado') {
        setPhase('success');
        await loadPointsSummary();
      }
    });
  }, [entryId]);

  useEffect(() => {
    if (phase === 'success' && pointsSummary == null) {
      loadPointsSummary();
    }
  }, [phase, pointsSummary]);

  useEffect(() => {
    navigation.setOptions({
      title: phase === 'success' ? '¡Reciclaje confirmado!' : 'Resultado del escaneo',
    });
  }, [navigation, phase]);

  function goToRecyclingCenter() {
    if (acopio?.lat && acopio?.lng) {
      router.push({
        pathname: '/(tabs)/mapa',
        params: {
          focusLat: String(acopio.lat),
          focusLng: String(acopio.lng),
          focusNombre: acopio.nombre,
          tipo,
        },
      });
    } else {
      router.push('/(tabs)/mapa');
    }
  }

  function openMapsDirections() {
    if (!acopio?.lat || !acopio?.lng) {
      goToRecyclingCenter();
      return;
    }
    openGoogleMapsNavigation({
      lat: acopio.lat,
      lng: acopio.lng,
      label: acopio.nombre,
    }).catch(() => goToRecyclingCenter());
  }

  async function handleAcopioConfirm() {
    if (phase === 'confirming' || phase === 'success') return;
    if (!canConfirm) {
      Alert.alert(
        'Aún no estás en el acopio',
        proximityHint || `Debes estar a menos de ${ACOPIO_GEOFENCE_RADIUS_M} m del punto de reciclaje.`,
      );
      return;
    }

    setPhase('confirming');
    try {
      const gps = await getAcopioVerifyLocation();
      if (!gps.granted) {
        throw new Error('GPS no disponible');
      }

      await verifyAcopio({
        lat: gps.lat,
        lng: gps.lng,
        acopio_id: acopio?.id,
      });
      if (entryId) await markRecyclingDelivered(entryId);
      const { summary } = await syncPointsFromServer();
      setPointsSummary(summary);
      setOfflineConfirm(false);
      setPhase('success');
    } catch (e: unknown) {
      setOfflineConfirm(true);
      setPhase('pending');
      const msg =
        e instanceof Error
          ? e.message
          : 'Verifica tu conexión e inicia sesión. Los puntos solo se acreditan cuando el servidor confirma la entrega.';
      Alert.alert('No se pudo confirmar', msg);
      checkProximity();
    }
  }

  function goToHistory() {
    router.replace('/mis-reciclajes');
  }

  function scanAnother() {
    router.replace('/(tabs)/scan');
  }

  function goHome() {
    router.replace('/(tabs)');
  }

  if (phase === 'success') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.successContent}>
        <View style={styles.successHero}>
          <View style={styles.successIconWrap}>
            <Icon name="checkmark-circle" size={56} color={COLORS.white} />
          </View>
          <Text style={styles.successTitle}>¡Reciclaje completado!</Text>
          <Text style={styles.successProduct}>{nombre}</Text>
          <Text style={styles.successSub}>
            Entregaste tu residuo al acopio. Gracias por cuidar Santa Anita.
          </Text>
        </View>

        <View style={styles.pointsBreakdown}>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsRowLabel}>Puntos por escaneo</Text>
            <Text style={styles.pointsRowValue}>+{puntos}</Text>
          </View>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsRowLabel}>Puntos por acopio</Text>
            <Text style={styles.pointsRowValue}>+{puntosExtra}</Text>
          </View>
          <View style={styles.pointsDivider} />
          <View style={styles.pointsRow}>
            <Text style={styles.pointsTotalLabel}>Total de esta acción</Text>
            <Text style={styles.pointsTotalValue}>+{puntosGanadosTotal} pts</Text>
          </View>
          {pointsSummary != null ? (
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Tu saldo actual</Text>
              <Text style={styles.balanceValue}>
                {pointsSummary.total_points.toLocaleString()} pts
              </Text>
              <Text style={styles.balanceNivel}>
                {pointsSummary.emoji} {pointsSummary.nivel}
              </Text>
            </View>
          ) : (
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Calculando saldo...</Text>
            </View>
          )}
          {offlineConfirm && (
            <Text style={styles.offlineNote}>
              Confirmado en el dispositivo. Los puntos se sincronizarán al reconectar.
            </Text>
          )}
        </View>

        {result.impacto ? (
          <Card style={styles.impactCard}>
            <View style={styles.cardHeader}>
              <Icon name="leaf" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Impacto de este reciclaje</Text>
            </View>
            <Text style={styles.cardText}>
              {(result.impacto as { co2_evitado_kg: number }).co2_evitado_kg} kg CO₂ evitado ·{' '}
              {(result.impacto as { agua_ahorrada_lt: number }).agua_ahorrada_lt} L agua ahorrada
            </Text>
          </Card>
        ) : null}

        <View style={styles.successActions}>
          <Button
            label="Ver mis reciclajes"
            icon="time-outline"
            onPress={goToHistory}
            fullWidth
          />
          <Button
            label="Escanear otro producto"
            icon="scan-outline"
            onPress={scanAnother}
            variant="secondary"
            fullWidth
            style={styles.actionGap}
          />
          <Button
            label="Ir al inicio"
            icon="home-outline"
            onPress={goHome}
            variant="outline"
            fullWidth
            style={styles.actionGap}
          />
        </View>
      </ScrollView>
    );
  }

  const tipoColors: Record<string, string> = {
    plástico: '#3B82F6',
    papel: '#F59E0B',
    vidrio: '#10B981',
    metal: '#6B7280',
    orgánico: '#84CC16',
    electrónico: '#8B5CF6',
  };

  const confianza = Number(result.confianza || 0);
  const sugerirRetake = Boolean(result.sugerir_retake) || confianza < 0.6;
  const regulacion = result.regulacion as {
    normativa?: string;
    resumen?: string;
    contenedor?: string;
    titulo?: string;
  } | undefined;
  const modoIa = String(result.modo_ia || 'demo');
  const tipoIcon = TIPO_ICONS[tipo] ?? 'cube-outline';
  const badgeColor = tipoColors[tipo] || COLORS.primary;
  const isConfirming = phase === 'confirming';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.pointsHero}>
        <View style={styles.pointsIcon}>
          <Icon name="star" size={32} color={COLORS.white} />
        </View>
        <Text style={styles.pointsLabel}>Puntos por reciclar este producto</Text>
        <Text style={styles.pointsValue}>+{puntos}</Text>
        <Text style={styles.pointsBonus}>
          Llévalo al centro de reciclaje y gana +{puntosExtra} pts extra
        </Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total posible:</Text>
          <Text style={styles.totalValue}>{puntosGanadosTotal} pts</Text>
        </View>
      </View>

      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Icon name={tipoIcon} size={16} color={COLORS.white} />
        <Text style={styles.badgeText}>{tipo.toUpperCase()}</Text>
      </View>

      <Text style={styles.nombre}>{nombre}</Text>
      <View style={styles.confidenceRow}>
        <Icon
          name={sugerirRetake ? 'alert-circle' : 'checkmark-circle'}
          size={16}
          color={sugerirRetake ? COLORS.warning : COLORS.success}
        />
        <Text style={[styles.confianza, sugerirRetake && styles.confianzaLow]}>
          Confianza: {Math.round(confianza * 100)}% · IA {modoIa}
        </Text>
      </View>

      {sugerirRetake && (
        <Card style={styles.retakeCard}>
          <View style={styles.cardHeader}>
            <Icon name="camera-outline" size={18} color={COLORS.warning} />
            <Text style={styles.cardTitle}>Imagen poco clara</Text>
          </View>
          <Text style={styles.cardText}>
            La confianza es baja. Acerca el objeto, mejora la luz o enfoca un solo residuo.
          </Text>
          <Button
            label="Tomar otra foto"
            icon="camera"
            onPress={scanAnother}
            variant="outline"
            fullWidth
            style={styles.retakeBtn}
          />
        </Card>
      )}

      <View style={styles.stepCard}>
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDone]}>
            <Icon name="checkmark" size={14} color={COLORS.white} />
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>1. Producto identificado</Text>
            <Text style={styles.stepDesc}>+{puntos} pts ya sumados a tu cuenta</Text>
          </View>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepPending]}>
            <Text style={styles.stepNum}>2</Text>
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>2. Llevar al centro de reciclaje</Text>
            <Text style={styles.stepDesc}>Confirma cuando hayas entregado el residuo</Text>
          </View>
        </View>
      </View>

      <Button
        label="Ir al centro de reciclaje"
        icon="navigate"
        onPress={goToRecyclingCenter}
        fullWidth
        style={styles.acopioPrimary}
        disabled={isConfirming}
      />

      {acopio ? (
        <Card accent>
          <View style={styles.cardHeader}>
            <Icon name="location" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Centro más cercano</Text>
          </View>
          <Text style={styles.cardText}>{acopio.nombre}</Text>
          <Text style={styles.cardSub}>{acopio.direccion}</Text>
          <Text style={styles.cardSub}>{acopio.distancia_m}m de distancia</Text>
          <Button
            label="Ir"
            icon="navigate"
            onPress={openMapsDirections}
            fullWidth
            style={styles.mapsBtn}
            disabled={isConfirming}
          />
        </Card>
      ) : null}

      {regulacion?.normativa ? (
        <Card accent>
          <View style={styles.cardHeader}>
            <Icon name="document-text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Normativa · Santa Anita</Text>
          </View>
          <Text style={styles.regNorm}>{regulacion.normativa}</Text>
          <Text style={styles.cardText}>{regulacion.resumen}</Text>
          {regulacion.contenedor ? (
            <Text style={styles.cardSub}>Contenedor: {regulacion.contenedor}</Text>
          ) : null}
        </Card>
      ) : null}

      <Card accent>
        <View style={styles.cardHeader}>
          <Icon name="list-outline" size={18} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Instrucciones</Text>
        </View>
        <Text style={styles.cardText}>{String(result.instrucciones || '')}</Text>
      </Card>

      {result.dato_impacto ? (
        <View style={styles.impactTipCard}>
          <Icon name="leaf-outline" size={18} color={COLORS.primary} />
          <Text style={styles.impactTipText}>{String(result.dato_impacto)}</Text>
        </View>
      ) : null}

      {result.impacto ? (
        <Card>
          <View style={styles.cardHeader}>
            <Icon name="leaf" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Impacto estimado</Text>
          </View>
          <Text style={styles.cardText}>
            {(result.impacto as { co2_evitado_kg: number }).co2_evitado_kg} kg CO₂ evitado ·{' '}
            {(result.impacto as { agua_ahorrada_lt: number }).agua_ahorrada_lt} L agua
          </Text>
        </Card>
      ) : null}

      <View
        style={[
          styles.geofenceBanner,
          canConfirm ? styles.geofenceOk : styles.geofencePending,
        ]}
      >
        {proximityLoading ? (
          <ActivityIndicator size="small" color={canConfirm ? COLORS.success : COLORS.primary} />
        ) : (
          <Icon
            name={canConfirm ? 'checkmark-circle' : 'navigate-circle-outline'}
            size={22}
            color={canConfirm ? COLORS.success : COLORS.primary}
          />
        )}
        <View style={styles.geofenceTextWrap}>
          <Text style={styles.geofenceTitle}>
            {canConfirm ? 'Ubicación verificada' : 'Verificación GPS'}
          </Text>
          <Text style={styles.geofenceHint}>{proximityHint}</Text>
          {proximityDist != null && (
            <Text style={styles.geofenceDist}>
              Radio permitido: {ACOPIO_GEOFENCE_RADIUS_M} m
            </Text>
          )}
        </View>
      </View>

      <Button
        label={isConfirming ? 'Confirmando entrega...' : 'Ya lo llevé al acopio (+20 pts)'}
        icon="checkmark-circle-outline"
        onPress={handleAcopioConfirm}
        variant="secondary"
        fullWidth
        loading={isConfirming}
        disabled={isConfirming || !canConfirm}
        style={styles.acopioBtn}
      />

      <Button
        label="Ver mis reciclajes"
        icon="time-outline"
        onPress={() => router.push('/mis-reciclajes')}
        variant="outline"
        fullWidth
        style={styles.historyBtn}
        disabled={isConfirming}
      />

      <Button
        label="Escanear otro producto"
        icon="scan-outline"
        onPress={scanAnother}
        variant="ghost"
        fullWidth
        style={styles.scanAgain}
        disabled={isConfirming}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  successContent: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  pointsHero: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.lg,
  },
  pointsIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  pointsLabel: { fontSize: 14, color: COLORS.accent, fontWeight: '600' },
  pointsValue: { fontSize: 48, fontWeight: '800', color: COLORS.white, letterSpacing: -1 },
  pointsBonus: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  totalLabel: { fontSize: 13, color: COLORS.accent },
  totalValue: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  badgeText: { color: COLORS.white, fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  nombre: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: SPACING.lg,
  },
  confianza: { fontSize: 14, color: COLORS.textSecondary },
  confianzaLow: { color: COLORS.warning, fontWeight: '600' },
  retakeCard: { marginBottom: SPACING.sm, borderColor: COLORS.warning, borderWidth: 1 },
  retakeBtn: { marginTop: SPACING.sm },
  regNorm: { fontSize: 13, fontWeight: '700', color: COLORS.earth, marginBottom: 6 },
  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: { backgroundColor: COLORS.success },
  stepPending: { backgroundColor: COLORS.earth },
  stepNum: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: FONTS.minSize, fontWeight: '700', color: COLORS.text },
  stepDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  stepLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 13,
    marginVertical: 4,
  },
  acopioPrimary: { marginBottom: SPACING.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  cardText: { fontSize: FONTS.minSize, color: COLORS.text, lineHeight: 22 },
  cardSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  mapsBtn: { marginTop: SPACING.sm },
  impactTipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.overlay,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  impactTipText: { fontSize: FONTS.minSize, color: COLORS.primary, lineHeight: 22, flex: 1 },
  geofenceBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
  },
  geofenceOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  geofencePending: {
    backgroundColor: COLORS.overlay,
    borderColor: COLORS.border,
  },
  geofenceTextWrap: { flex: 1 },
  geofenceTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  geofenceHint: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, lineHeight: 20 },
  geofenceDist: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  acopioBtn: { marginTop: SPACING.md },
  historyBtn: { marginTop: SPACING.sm },
  scanAgain: { marginTop: SPACING.sm, marginBottom: SPACING.lg },
  successHero: {
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.lg,
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
  },
  successProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  pointsBreakdown: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  pointsRowLabel: { fontSize: FONTS.minSize, color: COLORS.textSecondary },
  pointsRowValue: { fontSize: FONTS.minSize, fontWeight: '700', color: COLORS.primary },
  pointsDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  pointsTotalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  pointsTotalValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  balanceBox: {
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: COLORS.overlay,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
  },
  balanceLabel: { fontSize: 13, color: COLORS.textMuted },
  balanceValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  balanceNivel: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  offlineNote: {
    fontSize: 12,
    color: COLORS.warning,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  impactCard: { marginBottom: SPACING.lg },
  successActions: { gap: 0 },
  actionGap: { marginTop: SPACING.sm },
});
