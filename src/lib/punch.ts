import * as Location from "expo-location";
import NetInfo from "@react-native-community/netinfo";
import { api, ApiError, unwrap } from "./api";
import { deviceId, registerDevice } from "./device";

NetInfo.configure({ shouldFetchWiFiSSID: true });

export class LocationDenied extends Error {}

/** A fix good enough for the geofence (waits up to ~12 s for < 50 m). */
async function position() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new LocationDenied();
  let best: Location.LocationObject | null = null;
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
    if (!best || (fix.coords.accuracy ?? 999) < (best.coords.accuracy ?? 999)) best = fix;
    if ((best.coords.accuracy ?? 999) <= 50) break;
  }
  return best!;
}

async function wifiBssid(): Promise<string | undefined> {
  try {
    const state = await NetInfo.fetch("wifi");
    const bssid = (state.details as { bssid?: string } | null)?.bssid;
    return bssid && bssid !== "02:00:00:00:00:00" ? bssid : undefined;
  } catch {
    return undefined;
  }
}

/** Check in / out; the server decides (geofence, device, status) and answers with today's state. */
export async function punch(kind: "check-in" | "check-out") {
  const fix = await position();
  const body = {
    device_id: await deviceId(),
    latitude: Number(fix.coords.latitude.toFixed(6)),
    longitude: Number(fix.coords.longitude.toFixed(6)),
    accuracy: fix.coords.accuracy ?? undefined,
    is_mock_location: !!fix.mocked,
    wifi_bssid: await wifiBssid(),
  };
  const send = () => api(`/me/attendance/${kind}/`, { method: "POST", body });
  try {
    return unwrap<{ punch: any; today: any }>(await send());
  } catch (e) {
    // a fresh install / reinstall: bind the phone, then try once more
    if (e instanceof ApiError && e.code === "DEVICE_NOT_REGISTERED") {
      await registerDevice();
      return unwrap<{ punch: any; today: any }>(await send());
    }
    throw e;
  }
}
