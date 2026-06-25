import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Icon from '../ui/Icon';
import { COLORS } from '../../constants/theme';

const RIPPLE_COUNT = 4;
const ORBIT_ICONS = [
  { name: 'leaf' as const, angle: 0, color: COLORS.accent, radius: 72 },
  { name: 'reload' as const, angle: 120, color: COLORS.primaryLight, radius: 88 },
  { name: 'earth' as const, angle: 240, color: '#74C69D', radius: 80 },
];

function RippleRing({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2.4,
            duration: 2400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.3, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
      pointerEvents="none"
    />
  );
}

function OrbitIcon({
  name,
  angle,
  color,
  radius,
  rotation,
}: {
  name: 'leaf' | 'reload' | 'earth';
  angle: number;
  color: string;
  radius: number;
  rotation: Animated.AnimatedInterpolation<string>;
}) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <Animated.View
      style={[
        styles.orbitIcon,
        {
          transform: [
            { translateX: x },
            { translateY: y },
            { rotate: rotation },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.orbitBubble, { backgroundColor: color + '22', borderColor: color + '55' }]}>
        <Icon name={name} size={16} color={color} />
      </View>
    </Animated.View>
  );
}

interface EcoRippleBackgroundProps {
  size?: number;
  showOrbit?: boolean;
}

export default function EcoRippleBackground({ size = 200, showOrbit = true }: EcoRippleBackgroundProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const recycleSpin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const orbit = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const recycle = Animated.loop(
      Animated.timing(recycleSpin, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.85, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    orbit.start();
    recycle.start();
    pulse.start();
    return () => {
      orbit.stop();
      recycle.stop();
      pulse.stop();
    };
  }, [glow, recycleSpin, spin]);

  const orbitRotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const recycleRotation = recycleSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  return (
    <View style={[styles.wrapper, { width: size * 2.2, height: size * 2.2 }]} pointerEvents="none">
      {Array.from({ length: RIPPLE_COUNT }).map((_, i) => (
        <RippleRing key={i} delay={i * 600} />
      ))}

      <Animated.View style={[styles.glow, { width: size * 0.9, height: size * 0.9, opacity: glow }]} />

      {showOrbit && (
        <Animated.View style={[styles.orbitContainer, { transform: [{ rotate: orbitRotation }] }]}>
          {ORBIT_ICONS.map((item) => (
            <OrbitIcon key={item.name} {...item} rotation={orbitRotation} />
          ))}
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.centerIcon,
          {
            width: size * 0.55,
            height: size * 0.55,
            borderRadius: size * 0.275,
            transform: [{ rotate: recycleRotation }],
          },
        ]}
      >
        <Icon name="reload" size={size * 0.28} color={COLORS.white} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
  },
  orbitContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitIcon: {
    position: 'absolute',
  },
  orbitBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    zIndex: 3,
  },
});
