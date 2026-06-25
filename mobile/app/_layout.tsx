import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppLaunchSplash from '../components/splash/AppLaunchSplash';
import { COLORS } from '../constants/theme';
import { initAuth } from '../services/auth';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const safety = setTimeout(() => setAppReady(true), 3500);
    initAuth().finally(() => {
      clearTimeout(safety);
      setAppReady(true);
    });
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="register" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan-result" options={{ title: 'Resultado del escaneo' }} />
        <Stack.Screen name="mis-reciclajes" options={{ title: 'Mis reciclajes' }} />
        <Stack.Screen name="dashboard" options={{ title: 'Mi impacto' }} />
      </Stack>
      {showSplash ? <AppLaunchSplash ready={appReady} onFinish={handleSplashFinish} /> : null}
    </SafeAreaProvider>
  );
}
