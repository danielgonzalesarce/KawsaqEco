import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearUserIdCache } from './userId';

const TOKEN_KEY = 'kawsaqeco_auth_token';
const USER_KEY = '@kawsaqeco/auth_user';
const LEGACY_TOKEN_KEY = '@kawsaqeco/auth_token';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  distrito: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

let cachedToken: string | null = null;
let cachedUser: AuthUser | null = null;

async function migrateLegacyToken(): Promise<string | null> {
  const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacy) return null;
  await SecureStore.setItemAsync(TOKEN_KEY, legacy);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  return legacy;
}

export async function getAuthToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    cachedToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
  }
  if (!cachedToken) {
    cachedToken = await migrateLegacyToken();
  }
  return cachedToken;
}

export function isOfflineDemoToken(token: string | null): boolean {
  return token === 'demo-local-offline';
}

export async function getAuthUser(): Promise<AuthUser | null> {
  if (cachedUser) return cachedUser;
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    cachedUser = JSON.parse(raw) as AuthUser;
    return cachedUser;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token && !isOfflineDemoToken(token);
}

export async function setAuthSession(response: AuthResponse): Promise<void> {
  cachedToken = response.access_token;
  cachedUser = response.user;
  if (isOfflineDemoToken(response.access_token)) {
    await AsyncStorage.setItem(LEGACY_TOKEN_KEY, response.access_token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, response.access_token);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  }
  await AsyncStorage.multiSet([
    [USER_KEY, JSON.stringify(response.user)],
    ['@kawsaqeco/user_id', response.user.id],
    ['@kawsaqeco/distrito', response.user.distrito],
  ]);
}

export async function clearAuthSession(): Promise<void> {
  cachedToken = null;
  cachedUser = null;
  clearUserIdCache();
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  await AsyncStorage.multiRemove([LEGACY_TOKEN_KEY, USER_KEY, '@kawsaqeco/user_id']);
}

/** Precarga sesión al arrancar. */
export async function initAuth(): Promise<AuthUser | null> {
  return getAuthUser();
}
