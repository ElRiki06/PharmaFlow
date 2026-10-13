import { createAsyncStorage } from "@react-native-async-storage/async-storage";

const storage = createAsyncStorage("pharmaflow");
export async function read(key, fallback = null) {
  const raw = await storage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    await storage.removeItem(key);
    return fallback;
  }
}
export async function write(key, value) {
  try {
    await storage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error(
      "No se pudieron guardar los datos locales. Comprueba el espacio y los permisos del navegador.",
    );
  }
}
export const remove = (key) => storage.removeItem(key);
