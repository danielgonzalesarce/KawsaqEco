import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from '../ui/Icon';
import OnboardingVisual from './OnboardingVisual';
import type { OnboardingSlide } from '../../constants/onboarding';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface OnboardingSlideCardProps {
  slide: OnboardingSlide;
  greeting?: string | null;
}

export default function OnboardingSlideCard({ slide, greeting }: OnboardingSlideCardProps) {
  const showGreeting = slide.id === '1' && greeting;

  return (
    <ScrollView
      style={styles.slide}
      contentContainerStyle={styles.slideContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <OnboardingVisual slideId={slide.id} icon={slide.icon} accent={slide.accent} />

      <View style={[styles.quechuaBox, { borderLeftColor: slide.accent }]}>
        <View style={styles.quechuaHeader}>
          <Icon name="language-outline" size={13} color={slide.accent} />
          <Text style={[styles.quechuaLabel, { color: slide.accent }]}>Runasimi · Quechua</Text>
        </View>
        <Text style={styles.quechua}>{slide.quechua}</Text>
      </View>

      {showGreeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
      <Text style={[styles.title, showGreeting && styles.titleSub]}>{slide.espanol}</Text>
      <Text style={styles.descripcion}>{slide.descripcion}</Text>

      <View style={styles.highlights}>
        {slide.highlights.map(h => (
          <View key={h.text} style={styles.highlightChip}>
            <View style={[styles.highlightIcon, { backgroundColor: `${slide.accent}18` }]}>
              <Icon name={h.icon} size={14} color={slide.accent} />
            </View>
            <Text style={styles.highlightText}>{h.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  slideContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  quechuaBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  quechuaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  quechuaLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  quechua: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.4,
    marginBottom: SPACING.sm,
  },
  titleSub: {
    fontSize: 20,
    marginBottom: SPACING.sm,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  descripcion: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 23,
    marginBottom: SPACING.md,
  },
  highlights: { gap: SPACING.sm },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  highlightIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
