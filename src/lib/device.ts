import { Platform } from "react-native";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import { api, unwrap } from "./api";
import { getItem, setItem } from "./storage";

export type DeviceStatus = "APPROVED" | "PENDING" | "BLOCKED";

/** One id per install, kept in the keystore (the server binds punches to it). */
export async function deviceId(): Promise<string> {
  let id = await getItem("deviceId");
  if (!id) {
    id = Crypto.randomUUID();
    await setItem("deviceId", id);
  }
  return id;
}

export const appVersion = () => Application.nativeApplicationVersion ?? "1.0.0";

/** Called after every sign-in; the first phone of an employee is approved automatically. */
export async function registerDevice(): Promise<DeviceStatus | null> {
  try {
    const body = await api("/me/devices/register/", {
      method: "POST",
      body: {
        device_id: await deviceId(),
        platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
        device_model: [Device.manufacturer, Device.modelName].filter(Boolean).join(" ").slice(0, 100),
        os_version: `${Platform.OS === "ios" ? "iOS" : "Android"} ${Device.osVersion ?? ""}`.trim(),
        app_version: appVersion(),
        fcm_token: "",
      },
    });
    return unwrap<{ status: DeviceStatus }>(body)?.status ?? null;
  } catch {
    return null;
  }
}
