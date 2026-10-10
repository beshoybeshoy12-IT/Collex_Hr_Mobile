import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, loadSession, setSignedOutHandler, setTokens, unwrap } from "./api";
import { deviceId, registerDevice, type DeviceStatus } from "./device";
import { getItem, setItem } from "./storage";

export type User = {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  role: string;
  permissions: string[];
  must_change_password: boolean;
  preferred_language: "ar" | "en";
  employee_id: string | null;
  employee_code: string | null;
};

export type Me = {
  user: User;
  employee: Record<string, any> | null;
  manager: { id: string; name: string } | null;
  is_manager: boolean;
  is_hr: boolean;
  permissions: string[];
};

type Ctx = {
  ready: boolean;
  user: User | null;
  me: Me | null;
  deviceStatus: DeviceStatus | null;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
  setUser: (u: User) => void;
  canApprove: boolean;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);

  const reload = useCallback(async () => {
    const data = unwrap<Me>(await api("/me/"));
    setMe(data);
    setUser(data.user);
    setItem("user", JSON.stringify(data.user));
  }, []);

  useEffect(() => {
    setSignedOutHandler(() => {
      setUser(null);
      setMe(null);
    });
    (async () => {
      if (await loadSession()) {
        try {
          await reload();
          setDeviceStatus(await registerDevice());
        } catch {
          // offline at launch: keep the session with the last known user; screens retry
          const cached = await getItem("user");
          if (cached && (await getItem("refresh"))) setUser(JSON.parse(cached));
        }
      }
      setReady(true);
    })();
  }, [reload]);

  const signIn = useCallback(async (email: string, password: string) => {
    // the app never sends `client: "web"` (that is the dashboard's sign-in)
    const body = await api<{ access: string; refresh: string; user: User }>("/auth/login/", {
      method: "POST",
      auth: false,
      body: { email: email.trim().toLowerCase(), password },
    });
    await setTokens(body.access, body.refresh);
    setUser(body.user);
    setItem("user", JSON.stringify(body.user));
    if (!body.user.must_change_password) {
      reload().catch(() => {});
      setDeviceStatus(await registerDevice());
    }
    return body.user;
  }, [reload]);

  const signOut = useCallback(async () => {
    try {
      const refresh = await getItem("refresh");
      await api("/auth/logout/", { method: "POST", body: { refresh, device_id: await deviceId() }, timeoutMs: 5000 });
    } catch {
      // signing out locally is enough
    }
    await setTokens(null, null);
    setItem("user", null);
    setUser(null);
    setMe(null);
  }, []);

  const value = useMemo<Ctx>(() => {
    const perms = me?.permissions ?? user?.permissions ?? [];
    return {
      ready,
      user,
      me,
      deviceStatus,
      signIn,
      signOut,
      reload,
      setUser,
      canApprove: perms.some((p) => ["team.approve", "leaves.approve", "requests.approve"].includes(p)),
    };
  }, [ready, user, me, deviceStatus, signIn, signOut, reload]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
