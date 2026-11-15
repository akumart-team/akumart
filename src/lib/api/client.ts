import type { Session } from "./types";

const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
let session: Session | null = null;
let refreshFlight: Promise<Session | null> | undefined;
let generation = 0;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export function setSession(value: Session | null) {
  generation++;
  session = value;
}
export function getSession() {
  return session;
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

async function send<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(baseUrl + path, {
    ...init,
    headers,
    credentials: "include",
    signal: init.signal || AbortSignal.timeout(20_000),
  });
  const body: unknown =
    response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = (body as { message?: unknown } | undefined)?.message;
    throw new ApiError(
      response.status,
      Array.isArray(message)
        ? message.join(" ")
        : typeof message === "string"
          ? message
          : `Request failed (${response.status}).`,
    );
  }
  return body as T;
}
export function refreshSession(): Promise<Session | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!refreshFlight) {
    const started = generation;
    refreshFlight = send<Session>("/auth/refresh", { method: "POST" })
      .then((value) => {
        if (generation === started) session = value;
        return session;
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          if (generation === started) session = null;
          return session;
        }
        throw error;
      })
      .finally(() => {
        refreshFlight = undefined;
      });
  }
  return refreshFlight;
}
export async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  if (!auth) return send<T>(path, init);
  if (!session || session.expiresAt * 1000 <= Date.now() + 30_000) await refreshSession();
  if (!session) throw new ApiError(401, "Sign in to continue.");
  const token = session.accessToken;
  try {
    return await send<T>(path, init, token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    // Concurrent expired requests share one refresh; requests arriving later reuse its result.
    if (session?.accessToken === token) await refreshSession();
    if (!session) throw new ApiError(401, "Your session has expired. Sign in again.");
    return send<T>(path, init, session.accessToken);
  }
}
export const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
