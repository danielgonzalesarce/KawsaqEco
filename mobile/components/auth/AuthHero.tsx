import { View, Text, StyleSheet } from 'react-native';
import BrandLeafLogo from '../BrandLeafLogo';
import Icon, { IconName } from '../ui/Icon';
import { authStyles } from './authStyles';
import { useAuthCompact } from './AuthScreenShell';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface Benefit {
  icon: IconName;
  text: string;
}

interface AuthHeroProps {
  title: string;
  subtitle: string;
  benefits?: Benefit[];
  badge?: string;
  compact?: boolean;
}

export default function AuthHero({ title, subtitle, benefits, badge, compact: compactProp }: AuthHeroProps) {
  const autoCompact = useAuthCompact();
  const compact = compactProp ?? autoCompact;

  return (
    <View style={[styles.hero, compact && styles.heroCompact]}>
      {badge && !compact ? (
        <View style={styles.badge}>
          <Icon name="leaf-outline" size={12} color={COLORS.primary} />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <BrandLeafLogo size={compact ? 'md' : 'lg'} animated={!compact} />
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={[styles.subtitle, compact && styles.subtitleCompact]} numberOfLines={2}>
        {subtitle}
      </Text>
      {benefits && benefits.length > 0 ? (
        <View style={[authStyles.benefitRow, compact && authStyles.benefitRowCompact]}>
          {benefits.map(b => (
            <View key={b.text} style={[authStyles.benefitChip, compact && authStyles.benefitChipCompact]}>
              <Icon name={b.icon} size={compact ? 12 : 14} color={COLORS.accent} />
              <Text style={[authStyles.benefitText, compact && authStyles.benefitTextCompact]}>{b.text}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: SPACING.lg },
  heroCompact: { marginBottom: SPACING.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.overlay,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.sm,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 20,
    marginTop: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
    paddingHorizontal: SPACING.sm,
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
