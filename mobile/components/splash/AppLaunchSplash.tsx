import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandLeafLogo from '../BrandLeafLogo';
import LeavesToBinScene from './LeavesToBinScene';
import { COLORS } from '../../constants/theme';

interface AppLaunchSplashProps {
  ready: boolean;
  onFinish: () => void;
}

export default function AppLaunchSplash({ ready, onFinish }: AppLaunchSplashProps) {
  const insets = useSafeAreaInsets();
  const fadeOut = useRef(new Animated.Value(1)).current;
  const logoY = useRef(new Animated.Value(-16)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const [binFull, setBinFull] = useState(false);
  const exiting = useRef(false);

  const handleBinFull = useCallback(() => setBinFull(true), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoY, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoY]);

  useEffect(() => {
    const forceExit = setTimeout(() => {
      if (exiting.current) return;
      exiting.current = true;
      onFinish();
    }, 5500);
    return () => clearTimeout(forceExit);
  }, [onFinish]);

  useEffect(() => {
    if (!ready) return;

    // Respaldo: no bloquear la app si la animación no termina (p. ej. en algunos Android).
    const safetyTimer = setTimeout(() => {
      if (exiting.current) return;
      exiting.current = true;
      onFinish();
    }, 4500);

    return () => clearTimeout(safetyTimer);
  }, [ready, onFinish]);

  useEffect(() => {
    if (!ready || !binFull || exiting.current) return;
    exiting.current = true;

    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, 280);

    return () => clearTimeout(timer);
  }, [binFull, fadeOut, onFinish, ready]);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeOut, paddingBottom: insets.bottom }]}>
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <Animated.View
        style={[
          styles.logoWrap,
          { paddingTop: insets.top + 28, opacity: logoOpacity, transform: [{ translateY: logoY }] },
        ]}
        pointerEvents="none"
      >
        <BrandLeafLogo size="md" animated />
      </Animated.View>

      <LeavesToBinScene bottomInset={insets.bottom} onFull={handleBinFull} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: COLORS.background,
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: '#C7EDD0',
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: '#E8F5E9',
  },
  logoWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
});
