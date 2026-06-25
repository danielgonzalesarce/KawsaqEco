import { useCallback, useEffect, useState } from 'react';
import { AuthUser, clearAuthSession, getAuthUser, initAuth } from '../services/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const u = await getAuthUser();
    setUser(u);
    return u;
  }, []);

  useEffect(() => {
    initAuth()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await clearAuthSession();
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    refresh,
    logout,
  };
}
