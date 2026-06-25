import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import OnboardingSlideCard from '../components/onboarding/OnboardingSlideCard';
import { ONBOARDING_SLIDES } from '../constants/onboarding';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../hooks/useAuth';
import { setUserDistrito } from '../services/userProfile';
import { DISTRITO_FOCO } from '../constants/santaAnita';
import { authStyles } from '../components/auth/authStyles';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');
const TOTAL = ONBOARDING_SLIDES.length;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(1 / TOTAL)).current;

  const isLast = currentIndex === TOTAL - 1;
  const slide = ONBOARDING_SLIDES[currentIndex];
  const greeting = user?.nombre ? `¡Hola, ${user.nombre.split(' ')[0]}!` : null;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentIndex + 1) / TOTAL,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [currentIndex, progressAnim]);

  async function handleFinish() {
    await setUserDistrito(DISTRITO_FOCO);
    await completeOnboarding();
    router.replace('/(tabs)');
  }

  function goTo(index: number) {
    listRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  }

  function handleNext() {
    if (isLast) {
      handleFinish();
      return;
    }
    goTo(currentIndex + 1);
  }

  function handleBack() {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={authStyles.blobTop} pointerEvents="none" />
      <View style={authStyles.blobBottom} pointerEvents="none" />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.headerTop}>
          {currentIndex > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={12}>
              <Icon name="chevron-back" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          <View style={styles.stepMeta}>
            <Text style={styles.stepLabel}>{slide.stepLabel}</Text>
            <Text style={styles.stepCount}>
              {currentIndex + 1} / {TOTAL}
            </Text>
          </View>

          <TouchableOpacity style={styles.skip} onPress={handleFinish} hitSlop={12}>
            <Text style={styles.skipText}>Omitir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <OnboardingSlideCard slide={item} greeting={item.id === '1' ? greeting : null} />
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((s, i) => (
            <TouchableOpacity key={s.id} onPress={() => goTo(i)} hitSlop={8}>
              <View
                style={[
                  styles.dot,
                  i === currentIndex && [styles.dotActive, { backgroundColor: slide.accent }],
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label={isLast ? '¡Empezar en Santa Anita!' : 'Continuar'}
          onPress={handleNext}
          icon={isLast ? 'arrow-forward' : 'chevron-forward'}
          fullWidth
        />

        {isLast ? (
          <Text style={styles.footerHint}>
            Tu primer paso: escanea un residuo y gana tus primeros puntos
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backPlaceholder: { width: 40 },
  stepMeta: { alignItems: 'center' },
  stepLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stepCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  skip: {
    minHeight: FONTS.buttonMinSize,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    zIndex: 1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 24,
  },
  footerHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -4,
  },
});
