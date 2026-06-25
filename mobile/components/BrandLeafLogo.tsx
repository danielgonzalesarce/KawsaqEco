import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Icon from './ui/Icon';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface BrandLeafLogoProps {
  size?: 'md' | 'lg' | 'xl';
  animated?: boolean;
}

const SIZES = {
  md: { outer: 88, inner: 72, icon: 40, ring: 3 },
  lg: { outer: 108, inner: 88, icon: 52, ring: 4 },
  xl: { outer: 128, inner: 104, icon: 64, ring: 4 },
};

export default function BrandLeafLogo({ size = 'lg', animated = false }: BrandLeafLogoProps) {
  const dims = SIZES[size];
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!animated) return;

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1.06,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.65,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.35,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    breathe.start();
    return () => breathe.stop();
  }, [animated, glow, pulse]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          width: dims.outer + 20,
          height: dims.outer + 20,
          transform: [{ scale: pulse }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            width: dims.outer + 16,
            height: dims.outer + 16,
            borderRadius: (dims.outer + 16) / 2,
            opacity: glow,
          },
        ]}
      />
      <View
        style={[
          styles.ring,
          {
            width: dims.outer,
            height: dims.outer,
            borderRadius: dims.outer / 2,
            borderWidth: dims.ring,
          },
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              width: dims.inner,
              height: dims.inner,
              borderRadius: dims.inner / 2,
            },
          ]}
        >
          <View style={styles.highlight} />
          <Icon name="leaf" size={dims.icon} color={COLORS.white} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
  },
  ring: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  inner: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: '70%',
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.full,
  },
});
