import * as SecureStore from "expo-secure-store";

/** Tokens, the install id and settings live in the Android Keystore (never plain storage). */
const KEYS = {
  access: "auth.access",
  refresh: "auth.refresh",
  deviceId: "device.id",
  server: "settings.server",
  lang: "settings.lang",
  user: "auth.user",
} as const;

type Key = keyof typeof KEYS;

export async function getItem(key: Key): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS[key]);
  } catch {
    return null;
  }
}

export async function setItem(key: Key, value: string | null): Promise<void> {
  try {
    if (value === null) await SecureStore.deleteItemAsync(KEYS[key]);
    else await SecureStore.setItemAsync(KEYS[key], value);
  } catch {
    // keystore unavailable: the app keeps working for this session
  }
}
