import { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import ScanButton from '../../components/ScanButton';
import Icon from '../../components/ui/Icon';
import { scanImage, checkApiHealth } from '../../services/api';
import { saveRecyclingEntry } from '../../services/recyclingHistory';
import { syncPointsFromServer } from '../../services/userPoints';
import { getScanLocation } from '../../utils/gpsLocation';
import { DISTRITO_FOCO } from '../../constants/santaAnita';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const userClosedCamera = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [aiMode, setAiMode] = useState<'gemini' | 'demo'>('demo');

  useEffect(() => {
    checkApiHealth().then(async ok => {
      if (!ok) return;
      try {
        const { data } = await (await import('../../services/api')).api.get('/');
        const mode = data?.ai?.scan;
        if (mode && mode !== 'demo') setAiMode('gemini');
      } catch {
        /* ignore */
      }
    });
  }, []);

  async function processImage(base64: string) {
    setLoading(true);
    try {
      const { lat, lng } = await getScanLocation();
      const result = await scanImage(`data:image/jpeg;base64,${base64}`, lat, lng);
      const entry = await saveRecyclingEntry(result);
      await syncPointsFromServer();
      setShowCamera(false);
      router.replace({
        pathname: '/scan-result',
        params: {
          data: JSON.stringify(result),
          entryId: entry.id,
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No pudimos analizar la imagen.';
      Alert.alert('Error de escaneo', msg);
    } finally {
      setLoading(false);
    }
  }

  const openCamera = useCallback(async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para escanear residuos.');
        return;
      }
    }
    setShowCamera(true);
  }, [permission?.granted, requestPermission]);

  useFocusEffect(
    useCallback(() => {
      if (!userClosedCamera.current) {
        openCamera();
      }
      return () => {
        userClosedCamera.current = false;
      };
    }, [openCamera]),
  );

  async function takePhoto() {
    if (loading) return;
    if (!cameraReady) {
      Alert.alert('Espera un momento', 'La cámara aún se está iniciando.');
      return;
    }
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
        quality: 0.55,
      });
      if (!photo?.base64) {
        Alert.alert('No se pudo capturar', 'Intenta de nuevo con mejor iluminación.');
        return;
      }
      await processImage(photo.base64);
    } catch {
      Alert.alert('Error de cámara', 'No pudimos tomar la foto. Intenta de nuevo.');
    }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].base64) {
      setShowCamera(false);
      await processImage(result.assets[0].base64);
    }
  }

  if (showCamera && permission?.granted) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />

        {loading && (
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.analyzingTitle}>Analizando producto...</Text>
            <Text style={styles.analyzingSub}>Calculando puntos por reciclar</Text>
          </View>
        )}

        {!loading && (
          <View style={styles.cameraOverlay}>
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.cameraHint}>Apunta al producto y toca capturar</Text>
            <Text style={styles.cameraSub}>Te mostraremos los puntos al instante</Text>
          </View>
        )}

        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => router.push('/mis-reciclajes')}
          >
            <Icon name="time-outline" size={18} color={COLORS.white} />
            <Text style={styles.historyText}>Mis reciclajes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.galleryBtn}
            onPress={pickFromGallery}
            disabled={loading}
          >
            <Icon name="images-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureBtn}
            onPress={takePhoto}
            disabled={loading || !cameraReady}
          >
            {loading ? (
              <Icon name="hourglass-outline" size={32} color={COLORS.primary} />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.galleryBtn}
            onPress={() => {
              userClosedCamera.current = true;
              setShowCamera(false);
            }}
            disabled={loading}
          >
            <Icon name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tagline}>Recicla, actúa, da vida</Text>
        <Text style={styles.subtitle}>KawsaqEco · {DISTRITO_FOCO}</Text>
      </View>

      <View style={[styles.aiBanner, aiMode === 'demo' && styles.aiBannerDemo]}>
        <Icon name="eye" size={16} color={COLORS.white} />
        <Text style={styles.aiBannerText}>
          CV {aiMode === 'gemini' ? 'Gemini activa' : 'modo demo'} · robusta ante ruido visual
        </Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Icon name="leaf" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.heroTitle}>Escanea tu residuo</Text>
        <Text style={styles.heroText}>
          Identificamos el material, calculamos tus puntos y te guiamos al centro de reciclaje.
        </Text>
      </View>

      <View style={styles.actions}>
        <ScanButton onPress={openCamera} loading={loading} icon="scan" />
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>
        <ScanButton
          onPress={pickFromGallery}
          label="Elegir de galería"
          icon="images-outline"
          variant="secondary"
        />
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => router.push('/mis-reciclajes')}
        >
          <Icon name="list-outline" size={18} color={COLORS.primary} />
          <Text style={styles.historyLinkText}>Ver mis reciclajes</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.scanning}>
          <Icon name="flash-outline" size={18} color={COLORS.primaryLight} />
          <Text style={styles.scanningText}>Analizando con IA...</Text>
        </View>
      )}

      <View style={styles.tips}>
        <View style={styles.tipRow}>
          <Icon name="bulb-outline" size={16} color={COLORS.earth} />
          <Text style={styles.tipText}>Buena luz = mejor identificación</Text>
        </View>
      </View>
    </View>
  );
}

const cornerSize = 24;
const cornerWidth = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: SPACING.md },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  aiBannerDemo: { backgroundColor: COLORS.earth },
  aiBannerText: { color: COLORS.white, fontSize: 13, fontWeight: '600', flex: 1 },
  tagline: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  heroText: {
    fontSize: FONTS.minSize,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: { alignItems: 'center', gap: SPACING.md },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    gap: SPACING.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textMuted },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
  },
  historyLinkText: { fontSize: FONTS.minSize, color: COLORS.primary, fontWeight: '600' },
  scanning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  scanningText: { fontSize: FONTS.minSize, color: COLORS.primary, fontWeight: '500' },
  tips: { marginTop: SPACING.xl, alignItems: 'center' },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipText: { fontSize: 13, color: COLORS.textSecondary },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    zIndex: 10,
  },
  analyzingTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginTop: SPACING.sm },
  analyzingSub: { color: COLORS.accent, fontSize: 14 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: cornerSize,
    height: cornerSize,
    borderColor: COLORS.accent,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: cornerWidth,
    borderLeftWidth: cornerWidth,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: cornerWidth,
    borderRightWidth: cornerWidth,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: cornerWidth,
    borderLeftWidth: cornerWidth,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: cornerWidth,
    borderRightWidth: cornerWidth,
    borderBottomRightRadius: 8,
  },
  cameraHint: {
    color: COLORS.white,
    fontSize: 15,
    marginTop: SPACING.lg,
    fontWeight: '600',
  },
  cameraSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 4,
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  historyText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  cameraControls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  galleryBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
