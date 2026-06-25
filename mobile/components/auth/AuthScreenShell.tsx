import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COMPACT_HEIGHT, authStyles } from './authStyles';
import { SPACING } from '../../constants/theme';

interface AuthScreenShellProps {
  children: ReactNode;
  contentStyle?: ViewStyle;
  topInset?: 'sm' | 'lg';
  /** Fuerza layout compacto (p. ej. registro). */
  compact?: boolean;
}

export default function AuthScreenShell({
  children,
  contentStyle,
  topInset = 'lg',
  compact: compactProp,
}: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = compactProp ?? height < AUTH_COMPACT_HEIGHT;

  return (
    <View style={authStyles.flex}>
      <View style={authStyles.blobTop} pointerEvents="none" />
      <View style={authStyles.blobBottom} pointerEvents="none" />
      <KeyboardAvoidingView
        style={authStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          contentContainerStyle={[
            compact ? authStyles.containerCompact : authStyles.container,
            {
              paddingTop: insets.top + (compact || topInset === 'sm' ? SPACING.sm : SPACING.md),
              paddingBottom: insets.bottom + SPACING.sm,
            },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function useAuthCompact() {
  const { height } = useWindowDimensions();
  return height < AUTH_COMPACT_HEIGHT;
}
