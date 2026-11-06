import { getDB, setIntent } from "./store";
import { canTrade, currentUser } from "./rules";

/** Where to go after sign-in/sign-up: explicit redirect → saved intent → onboarding → dashboard. */
/** Drops auth pages (and nested redirects) so a return target can never loop back into sign-in. */
export function safeTarget(t?: string | null): string | undefined {
  if (!t || !t.startsWith("/") || t.startsWith("//")) return undefined;
  let path = t;
  for (let i = 0; i < 5 && /^\/(login|signup|onboarding)/.test(path); i++) {
    const m = path.match(/[?&]redirect=([^&]*)/);
    if (!m) return undefined;
    try { path = decodeURIComponent(m[1]); } catch { return undefined; }
    if (!path.startsWith("/")) return undefined;
  }
  return /^\/(login|signup|onboarding)/.test(path) ? undefined : path;
}

export function nextPath(redirect?: string, fromSignup = false) {
  const db = getDB();
  const u = currentUser(db);
  const target = safeTarget(redirect) || safeTarget(db.intent?.path);
  // Intent already satisfiable → it no longer needs to be kept for the verification flow.
  if (db.intent && canTrade(u, db.intent.level)) setIntent(null);
  if (target && target.startsWith("/")) {
    if (fromSignup && !target.includes("/akubin/bin/")) return `/onboarding?redirect=${encodeURIComponent(target)}`;
    return target;
  }
  if (u && !u.prefs.onboarded) return "/onboarding";
  return "/app";
}
