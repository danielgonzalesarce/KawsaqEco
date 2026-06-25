import { Animated, StyleSheet, Text, View } from 'react-native';
import RecyclingSymbol from './RecyclingSymbol';
import Icon from '../ui/Icon';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

interface RecyclingBinProps {
  fillLevel: Animated.Value;
  scale?: Animated.Value;
  large?: boolean;
  hideLabel?: boolean;
}

const BIN_GREEN = '#1B5E20';
const BIN_GREEN_DARK = '#0D3B14';
const BIN_GREEN_LIGHT = '#43A047';
const RECYCLE_GREEN = '#2E7D32';

export default function RecyclingBin({ fillLevel, scale, large, hideLabel }: RecyclingBinProps) {
  const bodyW = large ? 156 : 112;
  const bodyH = large ? 162 : 118;
  const lidW = bodyW + 26;

  const fillHeight = fillLevel.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const fillOpacity = fillLevel.interpolate({
    inputRange: [0, 0.04, 1],
    outputRange: [0, 1, 1],
  });

  const wrapperStyle = scale ? { transform: [{ scale }] } : undefined;

  return (
    <Animated.View style={[styles.wrapper, wrapperStyle]}>
      <View style={[styles.lidWrap, { width: lidW + 8 }]}>
        <View style={[styles.lid, { width: lidW }]}>
          <View style={[styles.lidRim, { width: lidW + 8 }]} />
          <View style={styles.lidSlot} />
        </View>
      </View>

      <View style={[styles.bodyOuter, { width: bodyW + 18 }]}>
        <View style={[styles.body, { width: bodyW, height: bodyH }]}>
          <View style={styles.fillContainer}>
            <Animated.View style={[styles.fill, { height: fillHeight, opacity: fillOpacity }]}>
              <View style={styles.fillShine} />
              <View style={styles.fillLeaves}>
                <Icon name="leaf" size={large ? 20 : 12} color="rgba(255,255,255,0.55)" />
                <Icon name="leaf" size={large ? 15 : 10} color="rgba(255,255,255,0.45)" />
                <Icon name="leaf" size={large ? 17 : 14} color="rgba(255,255,255,0.5)" />
              </View>
            </Animated.View>
          </View>

          <View style={[styles.symbolBand, large && styles.symbolBandLarge]}>
            <View style={[styles.symbolCircle, large && styles.symbolCircleLarge]}>
              <RecyclingSymbol size={large ? 46 : 36} color={RECYCLE_GREEN} />
            </View>
            <Text style={[styles.bandText, large && styles.bandTextLarge]}>RECICLA</Text>
          </View>

          <View style={styles.compartmentLine} />
          <View style={[styles.compartmentLine, styles.compartmentLineRight]} />
        </View>
      </View>

      <View style={[styles.wheels, { gap: bodyW * 0.46 }]}>
        <View style={[styles.wheel, large && styles.wheelLarge]} />
        <View style={[styles.wheel, large && styles.wheelLarge]} />
      </View>

      {!hideLabel && <Text style={styles.label}>Tacho de reciclaje</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  lidWrap: {
    zIndex: 3,
    marginBottom: -5,
    alignItems: 'center',
  },
  lid: {
    height: 22,
    backgroundColor: BIN_GREEN_DARK,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2.5,
    borderColor: BIN_GREEN_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  lidRim: {
    position: 'absolute',
    top: -7,
    height: 9,
    backgroundColor: BIN_GREEN,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: BIN_GREEN_LIGHT,
  },
  lidSlot: {
    width: 64,
    height: 8,
    backgroundColor: '#062010',
    borderRadius: 4,
  },
  bodyOuter: {
    alignItems: 'center',
    paddingTop: 2,
  },
  body: {
    backgroundColor: BIN_GREEN,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    borderWidth: 3.5,
    borderColor: BIN_GREEN_DARK,
    borderTopWidth: 0,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  fillContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    zIndex: 1,
  },
  fill: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderTopWidth: 3,
    borderTopColor: '#B7E4C7',
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  fillShine: {
    position: 'absolute',
    top: 6,
    left: 8,
    right: '40%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
  },
  fillLeaves: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  symbolBand: {
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginTop: 14,
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: RECYCLE_GREEN,
    zIndex: 2,
    ...SHADOWS.sm,
  },
  symbolBandLarge: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
  },
  symbolCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolCircleLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  bandText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '800',
    color: RECYCLE_GREEN,
    letterSpacing: 1.5,
  },
  bandTextLarge: {
    fontSize: 14,
  },
  compartmentLine: {
    position: 'absolute',
    left: 18,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    zIndex: 2,
  },
  compartmentLineRight: {
    left: undefined,
    right: 18,
  },
  wheels: {
    flexDirection: 'row',
    marginTop: -7,
    zIndex: 1,
  },
  wheel: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#37474F',
    borderWidth: 2.5,
    borderColor: '#90A4AE',
  },
  wheelLarge: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  label: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
});
