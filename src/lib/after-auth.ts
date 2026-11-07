import { getDB, setIntent } from "./store";
import { canTrade, currentUser } from "./rules";
import type { User } from "./types";

/** Active Marketplace dashboard: seller-only → seller, buyer-only → buyer, both → last used (buyer first). */
export function activeMode(u: Pick<User, "prefs">): "buyer" | "seller" {
  const r = u.prefs.marketRole;
  if (r === "seller") return "seller";
  if (r === "both") return u.prefs.activeMode ?? "buyer";
  return "buyer";
}

/** Signed-in home: Recycle & Earn users land on AkuBin, traders on their For You feed. */
export function homePath(u: Pick<User, "prefs">) {
  const r = u.prefs.marketRole;
  return !r || r === "none" ? "/app/akubin" : "/app/marketplace";
}

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
  return u ? homePath(u) : "/app";
}
