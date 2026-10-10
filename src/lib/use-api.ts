import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api, ApiError } from "./api";
import { useI18n } from "./i18n";

/** Message for an API error: the app's own text for known codes, else the server's. */
export function useErrorText() {
  const { t, tc } = useI18n();
  return (err: unknown) => {
    if (err instanceof ApiError) {
      const own = tc("e_", err.code);
      if (own !== err.code) return err.code === "OUTSIDE_GEOFENCE" && err.message ? `${own}\n${err.message}` : own;
      return err.message || t("error");
    }
    return t("error");
  };
}

/** GET `path` (reloaded whenever the screen gains focus); `map` picks what the screen needs. */
export function useApi<T>(path: string | null, map: (body: any) => T = (b) => b) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [refreshing, setRefreshing] = useState(false);
  const errorText = useErrorText();
  const mapRef = useRef(map);
  mapRef.current = map;
  const errRef = useRef(errorText);
  errRef.current = errorText;

  const load = useCallback(async (pull = false) => {
    if (!path) return;
    if (pull) setRefreshing(true);
    try {
      const body = await api(path);
      setData(mapRef.current(body));
      setError(null);
    } catch (e) {
      setError(errRef.current(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [path]);

  useEffect(() => {
    setLoading(!!path);
  }, [path]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { data, error, loading, refreshing, reload: () => load(true), setData };
}
