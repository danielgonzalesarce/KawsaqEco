import { View, Text, StyleSheet } from 'react-native';
import BrandLeafLogo from '../BrandLeafLogo';
import Icon, { IconName } from '../ui/Icon';
import { ONBOARDING_LEVELS } from '../../constants/onboarding';
import { DISTRITO_FOCO } from '../../constants/santaAnita';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface OnboardingVisualProps {
  slideId: string;
  icon: IconName;
  accent: string;
}

export default function OnboardingVisual({ slideId, icon, accent }: OnboardingVisualProps) {
  if (slideId === '1') {
    return (
      <View style={styles.wrap}>
        <BrandLeafLogo size="lg" animated />
        <View style={[styles.pilotBadge, { borderColor: accent }]}>
          <Icon name="location" size={14} color={accent} />
          <Text style={[styles.pilotText, { color: accent }]}>Piloto · {DISTRITO_FOCO}</Text>
        </View>
      </View>
    );
  }

  if (slideId === '2') {
    return (
      <View style={styles.wrap}>
        <View style={styles.phone}>
          <View style={styles.phoneNotch} />
          <View style={[styles.phoneScreen, { borderColor: accent }]}>
            <View style={[styles.scanFrame, { borderColor: accent }]}>
              <Icon name="scan-outline" size={36} color={accent} />
            </View>
            <View style={styles.scanResult}>
              <View style={[styles.scanChip, { backgroundColor: `${accent}18` }]}>
                <Icon name="water-outline" size={14} color={accent} />
                <Text style={[styles.scanChipText, { color: accent }]}>Plástico PET</Text>
              </View>
              <View style={styles.scanChipMuted}>
                <Icon name="add-circle" size={14} color={COLORS.success} />
                <Text style={styles.scanChipMutedText}>+5 pts</Text>
              </View>
            </View>
          </View>
          <View style={[styles.phoneBtn, { backgroundColor: accent }]}>
            <Icon name={icon} size={22} color={COLORS.white} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Icon name="trophy" size={20} color={accent} />
          <Text style={[styles.levelTitle, { color: accent }]}>Tu progreso</Text>
        </View>
        <View style={styles.levelTrack}>
          {ONBOARDING_LEVELS.map((level, i) => (
            <View key={level} style={styles.levelStep}>
              <View
                style={[
                  styles.levelDot,
                  i <= 1 && { backgroundColor: accent, borderColor: accent },
                  i === 2 && { borderColor: accent },
                ]}
              >
                {i <= 1 ? <Icon name="checkmark" size={10} color={COLORS.white} /> : null}
              </View>
              {i < ONBOARDING_LEVELS.length - 1 ? (
                <View style={[styles.levelLine, i < 1 && { backgroundColor: accent }]} />
              ) : null}
            </View>
          ))}
        </View>
        <View style={styles.levelLabels}>
          <Text style={styles.levelLabelActive}>{ONBOARDING_LEVELS[0]}</Text>
          <Text style={styles.levelLabelMuted}>→ {ONBOARDING_LEVELS[4]}</Text>
        </View>
        <View style={styles.rewardRow}>
          <View style={[styles.rewardItem, { backgroundColor: `${accent}12` }]}>
            <Icon name="storefront-outline" size={18} color={accent} />
            <Text style={styles.rewardText}>Bodegas</Text>
          </View>
          <View style={[styles.rewardItem, { backgroundColor: `${accent}12` }]}>
            <Icon name="bus-outline" size={18} color={accent} />
            <Text style={styles.rewardText}>Transporte</Text>
          </View>
          <View style={[styles.rewardItem, { backgroundColor: `${accent}12` }]}>
            <Icon name="leaf-outline" size={18} color={accent} />
            <Text style={styles.rewardText}>Ecoparque</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    marginBottom: SPACING.lg,
  },
  pilotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    ...SHADOWS.sm,
  },
  pilotText: { fontSize: 13, fontWeight: '800' },
  phone: {
    width: 168,
    height: 210,
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.xl,
    padding: 8,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  phoneNotch: {
    width: 56,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  scanFrame: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanResult: { flexDirection: 'row', gap: 6 },
  scanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  scanChipText: { fontSize: 11, fontWeight: '700' },
  scanChipMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  scanChipMutedText: { fontSize: 11, fontWeight: '700', color: COLORS.success },
  phoneBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  levelCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
  levelTitle: { fontSize: 15, fontWeight: '800' },
  levelTrack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  levelStep: { flexDirection: 'row', alignItems: 'center' },
  levelDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelLine: {
    width: 22,
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  levelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  levelLabelActive: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  levelLabelMuted: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  rewardRow: { flexDirection: 'row', gap: SPACING.sm },
  rewardItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  rewardText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary },
});
