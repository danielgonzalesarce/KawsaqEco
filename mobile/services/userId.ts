import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@kawsaqeco/user_id';
const AUTH_USER_KEY = '@kawsaqeco/auth_user';

let cachedId: string | null = null;

function generateId(): string {
  return 'user-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getAuthUserIdFromStorage(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as { id?: string };
    return user.id ?? null;
  } catch {
    return null;
  }
}

export async function getUserId(): Promise<string> {
  if (cachedId) return cachedId;

  const authId = await getAuthUserIdFromStorage();
  if (authId) {
    cachedId = authId;
    return authId;
  }

  const stored = await AsyncStorage.getItem(KEY);
  if (stored) {
    cachedId = stored;
    return stored;
  }

  const id = generateId();
  await AsyncStorage.setItem(KEY, id);
  cachedId = id;
  return id;
}

/** Precarga el ID al arrancar la app. */
export async function initUserId(): Promise<string> {
  return getUserId();
}

/** Limpia caché en memoria (p. ej. al cerrar sesión). */
export function clearUserIdCache(): void {
  cachedId = null;
}
