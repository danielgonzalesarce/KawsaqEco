import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '../../components/TabBarIcon';
import SettingsMenu from '../../components/SettingsMenu';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarIcon: ({ focused }) => <TabBarIcon route={route.name} focused={focused} />,
        sceneContainerStyle: { backgroundColor: COLORS.background },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: 56 + tabBarBottom,
          paddingTop: 6,
          paddingBottom: tabBarBottom,
          ...SHADOWS.md,
        },
        tabBarItemStyle: { flex: 1 },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerRight: () => <SettingsMenu />,
      })}
    >
      <Tabs.Screen name="scan" options={{ title: 'Escanear' }} />
      <Tabs.Screen name="chat" options={{ title: 'Kawsaq' }} />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon route="index" focused={focused} size={focused ? 28 : 24} />
          ),
        }}
      />
      <Tabs.Screen name="mapa" options={{ title: 'Acopio' }} />
      <Tabs.Screen name="recompensas" options={{ title: 'Canjear' }} />
    </Tabs>
  );
}

