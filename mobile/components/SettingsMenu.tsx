import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from './ui/Icon';
import { useAuth } from '../hooks/useAuth';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { DISTRITO_FOCO } from '../constants/santaAnita';

interface MenuItem {
  id: string;
  label: string;
  icon: IconName;
  route?: string;
  destructive?: boolean;
  onPress?: () => void;
}

export default function SettingsMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [visible, setVisible] = useState(false);

  function close() {
    setVisible(false);
  }

  function navigate(route: string) {
    close();
    router.push(route as never);
  }

  function confirmLogout() {
    close();
    Alert.alert('Cerrar sesión', '¿Salir de tu cuenta en KawsaqEco?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  const items: MenuItem[] = [
    { id: 'impacto', label: 'Mi impacto', icon: 'analytics-outline', route: '/dashboard' },
    { id: 'reciclajes', label: 'Mis reciclajes', icon: 'leaf-outline', route: '/mis-reciclajes' },
    { id: 'recompensas', label: 'Canjear puntos', icon: 'gift-outline', route: '/(tabs)/recompensas' },
    {
      id: 'logout',
      label: 'Cerrar sesión',
      icon: 'log-out-outline',
      destructive: true,
      onPress: confirmLogout,
    },
  ];

  function handleItem(item: MenuItem) {
    if (item.onPress) {
      item.onPress();
      return;
    }
    if (item.route) {
      navigate(item.route);
    }
  }

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        accessibilityLabel="Configuración"
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="ellipsis-vertical" size={22} color={COLORS.white} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.handle} />

            <View style={styles.profile}>
              <View style={styles.avatar}>
                <Icon name="person" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.nombre ?? 'Vecino KawsaqEco'}
                </Text>
                <Text style={styles.profileMeta} numberOfLines={1}>
                  {user?.email ?? 'Piloto'} · {DISTRITO_FOCO}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Configuración</Text>

            {items.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                onPress={() => handleItem(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, item.destructive && styles.rowIconDanger]}>
                  <Icon
                    name={item.icon}
                    size={20}
                    color={item.destructive ? COLORS.error : COLORS.primary}
                  />
                </View>
                <Text style={[styles.rowLabel, item.destructive && styles.rowLabelDanger]}>
                  {item.label}
                </Text>
                {!item.destructive && (
                  <Icon name="chevron-forward" size={18} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.cancelBtn} onPress={close}>
              <Text style={styles.cancelText}>Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    marginRight: SPACING.md,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    ...SHADOWS.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  profileMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: '#FEE2E2' },
  rowLabel: { flex: 1, fontSize: FONTS.minSize, fontWeight: '600', color: COLORS.text },
  rowLabelDanger: { color: COLORS.error },
  cancelBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelText: { fontSize: FONTS.minSize, fontWeight: '600', color: COLORS.textSecondary },
});
