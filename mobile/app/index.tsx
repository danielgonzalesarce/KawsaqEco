import { Redirect } from 'expo-router';
import AppLoadingScreen from '../components/splash/AppLoadingScreen';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../hooks/useAuth';

/** Redirige según autenticación y onboarding. */
export default function IndexRedirect() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isComplete, isLoading: onboardingLoading } = useOnboarding();

  if (authLoading || onboardingLoading) {
    return <AppLoadingScreen message="Preparando tu experiencia..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
