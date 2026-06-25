import { type RefObject } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from './ui/Icon';
import { openGoogleMapsNavigation } from '../utils/navigation';
import { formatDistance } from '../utils/distance';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { DISTRITO_FOCO } from '../constants/santaAnita';

export interface AcopioMapPoint {
  id: string;
  nombre: string;
  distrito: string;
  lat: number;
  lng: number;
  distancia_m?: number;
}

interface Props {
  points: AcopioMapPoint[];
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  userLocation: { lat: number; lng: number } | null;
  highlightId: string | null;
  nearestIds: Set<string>;
  mapRef: RefObject<MapView | null>;
  showUserLocation?: boolean;
}

/** Android sin API key de Google Maps crashea con MapView nativo. */
export const USE_NATIVE_MAP = Platform.OS === 'ios';

function AndroidMapFallback({ points, highlightId, nearestIds }: Props) {
  const preview = points.slice(0, 6);

  return (
    <View style={styles.fallback}>
      <View style={styles.fallbackBanner}>
        <Icon name="map" size={22} color={COLORS.primary} />
        <View style={styles.fallbackTextWrap}>
          <Text style={styles.fallbackTitle}>{DISTRITO_FOCO}</Text>
          <Text style={styles.fallbackSub}>
            Centros de acopio · toca uno para abrir Google Maps
          </Text>
        </View>
      </View>

      {preview.length === 0 ? (
        <Text style={styles.fallbackEmpty}>No hay puntos para mostrar en el mapa.</Text>
      ) : (
        preview.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.fallbackRow,
              p.id === highlightId && styles.fallbackRowHighlight,
              nearestIds.has(p.id) && styles.fallbackRowNear,
            ]}
            onPress={() =>
              openGoogleMapsNavigation({ lat: p.lat, lng: p.lng, label: p.nombre }).catch(() => {})
            }
            activeOpacity={0.85}
          >
            <View style={styles.fallbackPin}>
              <Icon name="location" size={16} color={COLORS.white} />
            </View>
            <View style={styles.fallbackInfo}>
              <Text style={styles.fallbackName} numberOfLines={1}>
                {p.nombre}
              </Text>
              <Text style={styles.fallbackDistrito} numberOfLines={1}>
                {p.distrito}
              </Text>
            </View>
            {p.distancia_m != null && (
              <Text style={styles.fallbackDist}>{formatDistance(p.distancia_m)}</Text>
            )}
            <Icon name="navigate" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

export default function AcopioMapPanel(props: Props) {
  const { points, region, userLocation, highlightId, nearestIds, mapRef, showUserLocation } = props;

  if (!USE_NATIVE_MAP) {
    return <AndroidMapFallback {...props} />;
  }

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      region={region}
      showsUserLocation={!!showUserLocation && !!userLocation}
      showsMyLocationButton={false}
    >
      {points.map(p => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.lat, longitude: p.lng }}
          title={p.nombre}
          description={p.distancia_m != null ? formatDistance(p.distancia_m) : p.distrito}
          pinColor={
            p.id === highlightId ? COLORS.earth : nearestIds.has(p.id) ? '#F59E0B' : COLORS.primary
          }
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8F5E9',
    padding: SPACING.md,
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  fallbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  fallbackTextWrap: { flex: 1 },
  fallbackTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  fallbackSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  fallbackEmpty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONTS.minSize,
    padding: SPACING.lg,
  },
  fallbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  fallbackRowNear: { borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  fallbackRowHighlight: { borderWidth: 1, borderColor: COLORS.earth },
  fallbackPin: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInfo: { flex: 1 },
  fallbackName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  fallbackDistrito: { fontSize: 11, color: COLORS.textMuted },
  fallbackDist: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
