import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Icon from '../ui/Icon';
import RecyclingBin from './RecyclingBin';
import { COLORS } from '../../constants/theme';

export const LEAVES_TO_FILL = 8;

const LEAF_COLORS = [COLORS.accent, '#52B788', COLORS.primaryLight, '#74C69D', '#95D5B2', '#40916C'];

interface LeafSpec {
  id: number;
  leftPct: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  sway: number;
}

function buildLeafSpecs(count: number): LeafSpec[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    leftPct: 0.06 + Math.random() * 0.88,
    size: 42 + Math.floor(Math.random() * 18),
    color: LEAF_COLORS[id % LEAF_COLORS.length],
    delay: id * 165,
    duration: 520 + Math.random() * 280,
    sway: 16 + Math.random() * 22,
  }));
}

interface FallingLeafProps {
  spec: LeafSpec;
  screenWidth: number;
  targetY: number;
  onCollected: () => void;
  active: boolean;
}

function FallingLeaf({ spec, screenWidth, targetY, onCollected, active }: FallingLeafProps) {
  const translateY = useRef(new Animated.Value(-spec.size - 60)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const doneRef = useRef(false);

  useEffect(() => {
    if (!active || doneRef.current) return;

    translateY.setValue(-spec.size - 50 - Math.random() * 40);
    translateX.setValue(0);
    rotate.setValue(0);
    opacity.setValue(0);
    scale.setValue(1);

    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: targetY,
          duration: spec.duration,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: spec.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: spec.sway,
            duration: spec.duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -spec.sway * 0.6,
            duration: spec.duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.1, duration: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: targetY + 16, duration: 100, useNativeDriver: true }),
      ]),
    ]);

    const timer = setTimeout(() => {
      anim.start(({ finished }) => {
        if (finished && !doneRef.current) {
          doneRef.current = true;
          onCollected();
        }
      });
    }, spec.delay);

    return () => {
      clearTimeout(timer);
      anim.stop();
    };
  }, [active, onCollected, opacity, rotate, scale, spec, targetY, translateX, translateY]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', `${200 + spec.sway}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.leaf,
        {
          left: spec.leftPct * screenWidth - spec.size / 2,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate: spin }, { scale }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.leafShadow}>
        <Icon name="leaf" size={spec.size} color={spec.color} />
      </View>
    </Animated.View>
  );
}

interface LeavesToBinSceneProps {
  bottomInset?: number;
  onFull?: () => void;
}

export default function LeavesToBinScene({ bottomInset = 0, onFull }: LeavesToBinSceneProps) {
  const { width, height } = useWindowDimensions();
  const specs = useMemo(() => buildLeafSpecs(LEAVES_TO_FILL), []);

  const fillLevel = useRef(new Animated.Value(0)).current;
  const collectedRef = useRef(0);
  const fullRef = useRef(false);
  const [isFull, setIsFull] = useState(false);

  const binBottom = bottomInset + height * 0.1;
  const binTotalHeight = 220;
  const targetY = height - binBottom - binTotalHeight + 24;

  const handleCollected = useCallback(() => {
    if (fullRef.current) return;

    collectedRef.current += 1;
    const level = collectedRef.current / LEAVES_TO_FILL;

    Animated.spring(fillLevel, {
      toValue: level,
      friction: 8,
      tension: 120,
      useNativeDriver: false,
    }).start(() => {
      if (level >= 1 && !fullRef.current) {
        fullRef.current = true;
        setIsFull(true);
        onFull?.();
      }
    });
  }, [fillLevel, onFull]);

  return (
    <View style={styles.scene} pointerEvents="none">
      <View style={styles.groundEllipse} />

      {specs.map((spec) => (
        <FallingLeaf
          key={spec.id}
          spec={spec}
          screenWidth={width}
          targetY={targetY}
          onCollected={handleCollected}
          active={!isFull}
        />
      ))}

      <View style={[styles.binWrap, { bottom: binBottom }]}>
        <RecyclingBin fillLevel={fillLevel} large hideLabel />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  groundEllipse: {
    position: 'absolute',
    bottom: '8%',
    alignSelf: 'center',
    width: '75%',
    height: 28,
    backgroundColor: 'rgba(27,67,50,0.08)',
    borderRadius: 999,
  },
  leaf: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  leafShadow: {
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  binWrap: {
    position: 'absolute',
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
});
