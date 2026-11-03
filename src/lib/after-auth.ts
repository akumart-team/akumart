import { getDB, setIntent } from "./store";
import { canTrade, currentUser } from "./rules";

/** Where to go after sign-in/sign-up: explicit redirect → saved intent → onboarding → dashboard. */
export function nextPath(redirect?: string, fromSignup = false) {
  const db = getDB();
  const u = currentUser(db);
  const target = redirect || db.intent?.path;
  // Intent already satisfiable → it no longer needs to be kept for the verification flow.
  if (db.intent && canTrade(u, db.intent.level)) setIntent(null);
  if (target && target.startsWith("/")) {
    if (fromSignup && !target.includes("/akubin/bin/")) return `/onboarding?redirect=${encodeURIComponent(target)}`;
    return target;
  }
  if (u && !u.prefs.onboarded) return "/onboarding";
  return "/app";
}
