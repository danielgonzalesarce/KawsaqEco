import AsyncStorage from '@react-native-async-storage/async-storage';
import { DISTRITO_FOCO } from '../constants/santaAnita';

export const DISTRITO_KEY = '@kawsaqeco/distrito';

export async function getUserDistrito(): Promise<string> {
  const stored = await AsyncStorage.getItem(DISTRITO_KEY);
  return stored ?? DISTRITO_FOCO;
}

export async function setUserDistrito(_distrito: string): Promise<void> {
  await AsyncStorage.setItem(DISTRITO_KEY, DISTRITO_FOCO);
}
