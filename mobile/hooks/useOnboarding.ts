import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_STORAGE_KEY } from '../constants/onboarding';

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then(value => setIsComplete(value === 'true'))
      .catch(() => setIsComplete(false));
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsComplete(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setIsComplete(false);
  }, []);

  return { isComplete, completeOnboarding, resetOnboarding, isLoading: isComplete === null };
}
