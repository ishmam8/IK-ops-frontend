// src/lib/http.ts
export type HttpOptions = RequestInit & {
  auth?: boolean;        // attach Authorization header? (default: true)
  retryOn401?: boolean;  // auto refresh & retry on 401? (default: true)
};

const BASE_URL = import.meta.env.VITE_API_URL as string; // e.g., http://localhost:8000

// ---- token helpers (replace if you keep tokens elsewhere) ----
function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}
function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}
function setTokens(access?: string, refresh?: string): void {
  if (access !== undefined) localStorage.setItem("access_token", access);
  if (refresh !== undefined) localStorage.setItem("refresh_token", refresh);
}
function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ---- error type (typed, no 'any') ----
export class HttpError extends Error {
  readonly status: number;
  readonly body?: string;
  constructor(status: number, statusText: string, body?: string) {
    super(`HTTP ${status} ${statusText}${body ? `: ${body}` : ""}`);
    this.status = status;
    this.body = body;
  }
}

// ---- single-flight refresh lock ----
let isRefreshing = false;
let waiters: Array<(token: string | null) => void> = [];

async function refreshOnce(): Promise<string | null> {
  if (isRefreshing) return new Promise((resolve) => waiters.push(resolve));

  isRefreshing = true;
  try {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error("No refresh token");

    const res = await fetch(`${BASE_URL}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) throw new HttpError(res.status, res.statusText, await res.text().catch(() => undefined));
    const data = (await res.json()) as { access: string; refresh?: string };

    setTokens(data.access, data.refresh); // supports rotation
    isRefreshing = false;
    waiters.forEach((w) => w(data.access));
    waiters = [];
    return data.access;
  } catch {
    isRefreshing = false;
    waiters.forEach((w) => w(null));
    waiters = [];
    clearTokens();
    return null;
  }
}

// internal low-level fetch (no 401 handling)
async function rawRequest<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { auth = true, ...init } = options;
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "omit", // do NOT send cookies in this JWT flow
  });

  if (res.ok) {
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  const body = await res.text().catch(() => undefined);
  throw new HttpError(res.status, res.statusText, body);
}

// public request with 401 -> refresh -> retry
async function request<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { retryOn401 = true } = options;
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    if (!(err instanceof HttpError)) throw err;

    // Only attempt refresh for 401s, when allowed, and not on token endpoints themselves
    if (!retryOn401 || err.status !== 401) throw err;
    const p = path.toLowerCase();
    if (p.includes("/api/token/")) throw err;

    const newToken = await refreshOnce();
    if (!newToken) throw err;

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${newToken}`);
    return rawRequest<T>(path, { ...options, headers });
  }
}

// ---- exported convenience API ----
export const http = {
  get:  <T>(path: string, opts?: HttpOptions) => request<T>(path, { method: "GET", ...(opts ?? {}) }),
  post: <T>(path: string, body?: unknown, opts?: HttpOptions) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, ...(opts ?? {}) }),
  put:  <T>(path: string, body?: unknown, opts?: HttpOptions) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, ...(opts ?? {}) }),
  del:  <T>(path: string, opts?: HttpOptions) =>
    request<T>(path, { method: "DELETE", ...(opts ?? {}) }),
};
