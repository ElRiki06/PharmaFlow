import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
const name = key => `pharmaflow-native-${key}`;
const secure = key => Platform.OS !== 'web' && key.startsWith('session-');
export async function read(key, fallback = null) {
  const value = secure(key) ? await SecureStore.getItemAsync(name(key)) : await AsyncStorage.getItem(name(key));
  if (value === null) return fallback;
  try { return JSON.parse(value); } catch { await remove(key); return fallback; }
}
export async function write(key, value) {
  const text = JSON.stringify(value);
  if (secure(key)) await SecureStore.setItemAsync(name(key), text);
  else await AsyncStorage.setItem(name(key), text);
}
export async function remove(key) {
  if (secure(key)) await SecureStore.deleteItemAsync(name(key));
  else await AsyncStorage.removeItem(name(key));
}
