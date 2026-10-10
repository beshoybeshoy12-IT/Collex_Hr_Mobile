import { getItem, setItem } from "./storage";

/** The company server on the office Wi-Fi; changeable from the sign-in screen. */
export const DEFAULT_SERVER = "http://192.168.1.10:8055";

let server = DEFAULT_SERVER;
let access: string | null = null;
let refresh: string | null = null;
let onSignedOut: (() => void) | null = null;

export async function loadSession() {
  server = (await getItem("server")) || DEFAULT_SERVER;
  access = await getItem("access");
  refresh = await getItem("refresh");
  return !!refresh;
}

export function getServer() {
  return server;
}

export async function setServer(url: string) {
  server = url.trim().replace(/\/+$/, "");
  await setItem("server", server);
}

export const apiBase = () => `${server}/api/v1`;
export const accessToken = () => access;

export async function setTokens(a: string | null, r: string | null) {
  access = a;
  refresh = r;
  await Promise.all([setItem("access", a), setItem("refresh", r)]);
}

export function setSignedOutHandler(fn: () => void) {
  onSignedOut = fn;
}

/** Server error in the shared envelope: show `message`, branch on `code`. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

async function parse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toError(status: number, body: any): ApiError {
  const err = body?.error;
  const details = err?.details;
  // a field error ("start_date": ["…"]) is more useful than the generic message
  let message: string = body?.detail || err?.message || "";
  if (details && typeof details === "object") {
    const first = Object.values(details).flat()[0];
    if (typeof first === "string" && (!message || /invalid|validation/i.test(message))) message = first;
  }
  return new ApiError(status, err?.code || `HTTP_${status}`, message || `HTTP ${status}`, details);
}

let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (!refresh) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${apiBase()}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return false;
      const body = await res.json();
      await setTokens(body.access, body.refresh ?? refresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

type Options = { method?: string; body?: unknown; auth?: boolean; timeoutMs?: number };

export async function api<T = any>(path: string, { method = "GET", body, auth = true, timeoutMs = 20000 }: Options = {}): Promise<T> {
  const send = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(`${apiBase()}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...(auth && access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, "NETWORK", "");
    } finally {
      clearTimeout(timer);
    }
  };

  let res = await send();
  if (res.status === 401 && auth && refresh) {
    if (await refreshTokens()) res = await send();
    else {
      await setTokens(null, null);
      onSignedOut?.();
    }
  }
  const data = await parse(res);
  if (!res.ok) throw toError(res.status, data);
  return data as T;
}

/** Custom endpoints answer {success, data}; plain ones the object itself. */
export const unwrap = <T>(body: any): T => (body && typeof body === "object" && "data" in body && "success" in body ? body.data : body);

export const list = <T>(body: any): T[] => (Array.isArray(body) ? body : body?.results ?? unwrap<T[]>(body) ?? []);
