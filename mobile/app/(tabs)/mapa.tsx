import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  TextInput,
  Platform,
} from 'react-native';
import MapView from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router';
import Icon from '../../components/ui/Icon';
import AcopioMapPanel, { USE_NATIVE_MAP } from '../../components/AcopioMapPanel';
import { getAcopioPoints } from '../../services/api';
import { openGoogleMapsNavigation } from '../../utils/navigation';
import { formatDistance, withDistanceFromUser } from '../../utils/distance';
import { resolveGpsForMap } from '../../utils/gpsLocation';
import { labelAbierto } from '../../utils/horarioAcopio';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { DISTRITO_FOCO, SANTA_ANITA_CENTER, ZONAS_SANTA_ANITA } from '../../constants/santaAnita';

interface AcopioPoint {
  id: string;
  nombre: string;
  distrito: string;
  direccion: string;
  tipos_residuo: string[];
  horario: string;
  lat: number;
  lng: number;
  distancia_m?: number;
  zona?: string;
  tipo_entidad?: string;
}

const NEARBY_COUNT = 3;
type ViewMode = 'mapa' | 'lista' | 'ambos';

const RADIO_OPTIONS = [
  { id: '1', label: '1 km', radio: 1000, todos: false, limit: 10 },
  { id: '3', label: '3 km', radio: 3000, todos: false, limit: 15 },
  { id: 'all', label: `Todo ${DISTRITO_FOCO}`, radio: 8000, todos: true, limit: 20 },
] as const;

export default function MapaScreen() {
  const params = useLocalSearchParams<{
    focusLat?: string;
    focusLng?: string;
    focusNombre?: string;
    tipo?: string;
  }>();
  const mapRef = useRef<MapView>(null);
  const { height: screenHeight } = useWindowDimensions();
  const mapHeight = Math.min(Math.max(screenHeight * 0.34, 200), 280);
  const [viewMode, setViewMode] = useState<ViewMode>(USE_NATIVE_MAP ? 'ambos' : 'lista');
  const [points, setPoints] = useState<AcopioPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [zonaFilter, setZonaFilter] = useState<string>('todas');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [radioId, setRadioId] = useState<(typeof RADIO_OPTIONS)[number]['id']>('all');
  const [region, setRegion] = useState({
    latitude: SANTA_ANITA_CENTER.lat,
    longitude: SANTA_ANITA_CENTER.lng,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  const focusLat = params.focusLat ? parseFloat(params.focusLat) : null;
  const focusLng = params.focusLng ? parseFloat(params.focusLng) : null;
  const focusNombre = params.focusNombre ?? '';
  const tipoFiltro = params.tipo?.toLowerCase();

  const centerOnUser = useCallback((lat: number, lng: number, delta = 0.12) => {
    setRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: delta,
      longitudeDelta: delta,
    });
    if (USE_NATIVE_MAP) {
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta },
        500,
      );
    }
  }, []);

  const radioOption = RADIO_OPTIONS.find(r => r.id === radioId) ?? RADIO_OPTIONS[1];

  const fetchAcopios = useCallback(
    async (userLat: number, userLng: number, hasGps: boolean) => {
      try {
        const data = await getAcopioPoints(userLat, userLng, tipoFiltro || undefined, {
          radio: radioOption.radio,
          todos: radioOption.todos,
          limit: radioOption.limit,
        });
        const withDist = hasGps
          ? withDistanceFromUser(data as AcopioPoint[], userLat, userLng)
          : [...(data as AcopioPoint[])].sort(
              (a, b) => (a.distancia_m ?? 0) - (b.distancia_m ?? 0),
            );
        setPoints(withDist);

        if (focusLat && focusLng) {
          const match = withDist.find(
            p =>
              p.nombre === focusNombre ||
              (Math.abs(p.lat - focusLat) < 0.001 && Math.abs(p.lng - focusLng) < 0.001),
          );
          if (match) setHighlightId(match.id);
          if (USE_NATIVE_MAP) {
            mapRef.current?.animateToRegion(
              { latitude: focusLat, longitude: focusLng, latitudeDelta: 0.06, longitudeDelta: 0.06 },
              600,
            );
          }
        } else if (hasGps && withDist.length > 0 && USE_NATIVE_MAP) {
          const nearest = withDist[0];
          mapRef.current?.fitToCoordinates(
            [
              { latitude: userLat, longitude: userLng },
              { latitude: nearest.lat, longitude: nearest.lng },
            ],
            { edgePadding: { top: 80, right: 40, bottom: 40, left: 40 }, animated: true },
          );
        }
      } catch {
        setPoints([]);
      }
    },
    [focusLat, focusLng, focusNombre, tipoFiltro, radioOption],
  );

  useEffect(() => {
    (async () => {
      setLocating(true);
      setLoading(true);

      let userLat = focusLat ?? SANTA_ANITA_CENTER.lat;
      let userLng = focusLng ?? SANTA_ANITA_CENTER.lng;
      let hasGps = false;

      const gps = await resolveGpsForMap();
      if (gps.hasGps && gps.userLocation) {
        userLat = gps.userLocation.lat;
        userLng = gps.userLocation.lng;
        hasGps = true;
        setUserLocation(gps.userLocation);
        setLocationLabel(gps.locationLabel);
      } else if (!focusLat) {
        Alert.alert(
          'Permiso de ubicación',
          `Activa la ubicación para ver los acopios más cercanos en ${DISTRITO_FOCO}.`,
        );
      }

      if (hasGps && !focusLat) {
        centerOnUser(userLat, userLng, 0.15);
      } else if (focusLat && focusLng) {
        setRegion(r => ({
          ...r,
          latitude: focusLat,
          longitude: focusLng,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }));
      }

      await fetchAcopios(userLat, userLng, hasGps);
      setLocating(false);
      setLoading(false);
    })();
  }, [focusLat, focusLng, focusNombre, tipoFiltro, centerOnUser, fetchAcopios]);

  const filtered = useMemo(() => {
    let list = [...points];

    if (zonaFilter !== 'todas') {
      const key = zonaFilter.toLowerCase();
      list = list.filter(
        p =>
          p.zona?.toLowerCase() === key ||
          p.nombre.toLowerCase().includes(key) ||
          p.direccion.toLowerCase().includes(key),
      );
    }

    if (!radioOption.todos) {
      list = list.filter(p => (p.distancia_m ?? 0) <= radioOption.radio);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        p =>
          p.nombre.toLowerCase().includes(q) ||
          p.distrito.toLowerCase().includes(q) ||
          p.direccion.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => (a.distancia_m ?? 999999) - (b.distancia_m ?? 999999));
  }, [points, zonaFilter, searchQuery, radioOption]);

  const nearestIds = useMemo(
    () => new Set(filtered.slice(0, NEARBY_COUNT).map(p => p.id)),
    [filtered],
  );

  const highlighted = useMemo(
    () => (highlightId ? points.find(p => p.id === highlightId) : null),
    [points, highlightId],
  );

  async function handleNavigate(item: AcopioPoint) {
    try {
      await openGoogleMapsNavigation({
        lat: item.lat,
        lng: item.lng,
        label: item.nombre,
      });
    } catch {
      Alert.alert('Error', 'No pudimos abrir Google Maps.');
    }
  }

  async function handleRefreshNearby() {
    setLoading(true);
    const gps = await resolveGpsForMap();
    if (gps.userLocation) {
      setUserLocation(gps.userLocation);
      setLocationLabel(gps.locationLabel);
      centerOnUser(gps.userLocation.lat, gps.userLocation.lng, 0.12);
      await fetchAcopios(gps.userLocation.lat, gps.userLocation.lng, true);
    } else if (userLocation) {
      centerOnUser(userLocation.lat, userLocation.lng, 0.12);
      await fetchAcopios(userLocation.lat, userLocation.lng, true);
    }
    setLoading(false);
  }

  function handleRadioChange(id: (typeof RADIO_OPTIONS)[number]['id']) {
    setRadioId(id);
    if (userLocation) {
      setLoading(true);
      fetchAcopios(userLocation.lat, userLocation.lng, true).finally(() => setLoading(false));
    }
  }

  const renderCard = (item: AcopioPoint, isNearby: boolean) => {
    const horarioStatus = labelAbierto(item.horario);
    return (
    <View
      key={item.id}
      style={[
        styles.card,
        item.id === highlightId && styles.cardHighlight,
        isNearby && styles.cardNearby,
      ]}
    >
      {isNearby && userLocation && (
        <View style={styles.nearbyBadge}>
          <Icon name="star" size={12} color={COLORS.white} />
          <Text style={styles.nearbyBadgeText}>Cerca de ti</Text>
        </View>
      )}
      <View style={styles.cardTop}>
        <View style={styles.pinIcon}>
          <Icon
            name={item.tipo_entidad === 'municipalidad' ? 'business' : 'pin'}
            size={18}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          {item.id === highlightId && (
            <Text style={styles.recommended}>Recomendado para tu escaneo</Text>
          )}
          <View style={styles.metaRow}>
            <Icon name="map-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.distrito}>{item.distrito}</Text>
            {item.zona ? (
              <Text style={styles.zonaTag}>{DISTRITO_FOCO}</Text>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <Icon name="time-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.horario}>{item.horario}</Text>
            {horarioStatus.abierto != null && (
              <View style={[styles.openBadge, horarioStatus.abierto ? styles.openOn : styles.openOff]}>
                <Text style={styles.openBadgeText}>{horarioStatus.texto}</Text>
              </View>
            )}
          </View>
        </View>
        {item.distancia_m != null && (
          <View style={[styles.distBadge, isNearby && styles.distBadgeNear]}>
            <Text style={[styles.dist, isNearby && styles.distNear]}>
              {formatDistance(item.distancia_m)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.addressRow}>
        <Icon name="navigate-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.direccion}>{item.direccion}</Text>
      </View>
      <View style={styles.tags}>
        {(item.tipos_residuo ?? []).slice(0, 5).map(tipo => (
          <View key={tipo} style={styles.tag}>
            <Text style={styles.tagText}>{tipo}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={styles.goBtn}
        onPress={() => handleNavigate(item)}
        activeOpacity={0.85}
      >
        <Icon name="navigate" size={18} color={COLORS.white} />
        <Text style={styles.goBtnText}>Ir</Text>
      </TouchableOpacity>
    </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barra superior compacta */}
      <View style={styles.topBar}>
        <View style={styles.topBarInfo}>
          <Icon name={userLocation ? 'locate' : 'location-outline'} size={16} color={COLORS.primary} />
          <Text style={styles.topBarText} numberOfLines={1}>
            {locating
              ? 'Detectando ubicación...'
              : userLocation && locationLabel
                ? `Estás en ${locationLabel}`
                : userLocation
                  ? 'Ubicación detectada'
                  : 'Activa GPS para ver cercanos'}
          </Text>
        </View>
        <View style={styles.viewToggle}>
          {(['mapa', 'ambos', 'lista'] as ViewMode[]).map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.toggleBtn, viewMode === mode && styles.toggleBtnActive]}
              onPress={() => setViewMode(mode)}
            >
              <Icon
                name={mode === 'mapa' ? 'map' : mode === 'lista' ? 'list' : 'layers'}
                size={16}
                color={viewMode === mode ? COLORS.white : COLORS.primary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.searchRow}>
        <Icon name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Buscar en ${DISTRITO_FOCO}...`}
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radioRow}>
        {RADIO_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.radioChip, radioId === opt.id && styles.radioChipActive]}
            onPress={() => handleRadioChange(opt.id)}
          >
            <Icon
              name={opt.id === 'all' ? 'map' : 'radio-button-on'}
              size={14}
              color={radioId === opt.id ? COLORS.white : COLORS.primary}
            />
            <Text style={[styles.radioChipText, radioId === opt.id && styles.radioChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {focusNombre && highlighted && (
        <View style={styles.focusBanner}>
          <Text style={styles.focusText} numberOfLines={1}>{highlighted.nombre}</Text>
          <TouchableOpacity style={styles.focusGoBtn} onPress={() => handleNavigate(highlighted)}>
            <Text style={styles.focusGoText}>Ir</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mapa — altura fija, no compite con la lista */}
      {viewMode !== 'lista' && (
        <View style={[styles.mapWrap, { height: viewMode === 'mapa' ? undefined : mapHeight, flex: viewMode === 'mapa' ? 1 : undefined }]}>
          <AcopioMapPanel
            mapRef={mapRef}
            points={filtered}
            region={region}
            userLocation={userLocation}
            highlightId={highlightId}
            nearestIds={nearestIds}
            showUserLocation
          />

          {userLocation && (
            <TouchableOpacity style={styles.floatingLocate} onPress={handleRefreshNearby}>
              <Icon name="locate" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          <View style={styles.filtersOverlay}>
            <TouchableOpacity
              style={[styles.filterChip, zonaFilter === 'todas' && styles.filterChipActive]}
              onPress={() => setZonaFilter('todas')}
            >
              <Text style={[styles.filterChipText, zonaFilter === 'todas' && styles.filterChipTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            {ZONAS_SANTA_ANITA.map(z => (
              <TouchableOpacity
                key={z}
                style={[styles.filterChip, zonaFilter === z && styles.filterChipActive]}
                onPress={() => setZonaFilter(z)}
              >
                <Text style={[styles.filterChipText, zonaFilter === z && styles.filterChipTextActive]}>
                  {z}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Lista — scroll independiente debajo del mapa */}
      {viewMode !== 'mapa' && (
        <>
          <View style={styles.listHeader}>
            <Icon name="location" size={16} color={COLORS.primary} />
            <Text style={styles.listTitle}>
              {loading
                ? 'Cargando...'
                : `${filtered.length} centros · ${radioOption.label} · por distancia`}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                userLocation && filtered.length > 0 ? (
                  <View style={styles.nearbyHeader}>
                    <Icon name="star" size={16} color={COLORS.accent} />
                    <Text style={styles.nearbyTitle}>
                      Más cercano: {filtered[0]?.nombre} ({formatDistance(filtered[0]?.distancia_m ?? 0)})
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item, index }) => renderCard(item, index < NEARBY_COUNT && !!userLocation)}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Icon name="map-outline" size={40} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? 'Sin resultados para tu búsqueda'
                      : `No hay centros en un radio de ${radioOption.label}`}
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  topBarInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  topBarText: { fontSize: 13, color: COLORS.text, fontWeight: '500', flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.minSize,
    color: COLORS.text,
    paddingVertical: 4,
  },
  radioRow: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    maxHeight: 40,
  },
  radioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radioChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  radioChipText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  radioChipTextActive: { color: COLORS.white },
  viewToggle: { flexDirection: 'row', gap: 4 },
  toggleBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: COLORS.primary },
  focusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.earth,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  focusText: { fontSize: 13, fontWeight: '600', color: COLORS.white, flex: 1 },
  focusGoBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  focusGoText: { fontSize: 13, fontWeight: '800', color: COLORS.earth },
  mapWrap: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  floatingLocate: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  filtersOverlay: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: COLORS.white },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listTitle: { fontSize: 13, fontWeight: '600', color: COLORS.primary, flex: 1 },
  list: { flex: 1 },
  listContent: { paddingVertical: SPACING.sm, paddingBottom: SPACING.xl },
  loader: { padding: SPACING.lg },
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.sm + 2,
    backgroundColor: COLORS.overlay,
    borderRadius: RADIUS.md,
  },
  nearbyTitle: { fontSize: 13, fontWeight: '600', color: COLORS.primary, flex: 1 },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginVertical: 3,
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  cardNearby: { borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  cardHighlight: { borderWidth: 2, borderColor: COLORS.earth },
  nearbyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  },
  nearbyBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  recommended: { fontSize: 11, color: COLORS.earth, fontWeight: '600', marginTop: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  pinIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  nombre: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' },
  distrito: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  zonaTag: { fontSize: 10, color: COLORS.earth, marginLeft: 4 },
  horario: { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  openBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  openOn: { backgroundColor: '#DCFCE7' },
  openOff: { backgroundColor: '#FEE2E2' },
  openBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.text },
  distBadge: {
    backgroundColor: COLORS.overlay,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distBadgeNear: { backgroundColor: '#FEF3C7' },
  dist: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  distNear: { color: '#B45309' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  direccion: { fontSize: 12, color: COLORS.textSecondary, flex: 1, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 10, color: COLORS.earth, textTransform: 'capitalize' },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  goBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  empty: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm },
  emptyText: { fontSize: FONTS.minSize, color: COLORS.textMuted },
});
