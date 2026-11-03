import { useRef, useSyncExternalStore } from "react";
import { createSeed, TERMS_VERSION, PRIVACY_VERSION } from "./seed";
import type { DB, User, Intent } from "./types";
import { currentUser } from "./rules";
import { nowIso, uid } from "./format";

const KEY = "akumart-demo-db-v3";
let db: DB = createSeed();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === 3) db = parsed;
    }
  } catch {
    /* ignore corrupt state */
  }
  emit();
}

export function isHydrated() {
  return hydrated;
}

export function getDB() {
  return db;
}

export function update(fn: (d: DB) => void) {
  const next = structuredClone(db);
  fn(next);
  db = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(db));
  emit();
}

export function resetDemo() {
  db = createSeed();
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverSeed = createSeed();
/** Selector results are cached per DB snapshot so derived arrays don't loop useSyncExternalStore. */
export function useDB<T>(sel: (d: DB) => T): T {
  const cache = useRef<{ src: DB | null; val: T }>({ src: null, val: undefined as T });
  const read = (src: DB) => {
    if (cache.current.src !== src) cache.current = { src, val: sel(src) };
    return cache.current.val;
  };
  return useSyncExternalStore(
    subscribe,
    () => read(db),
    () => read(serverSeed),
  );
}

export function useHydratedFlag() {
  return useSyncExternalStore(subscribe, () => hydrated, () => false);
}

export function useMe() {
  return useDB(currentUser);
}

export function me(d: DB = db) {
  return currentUser(d);
}

/* ---------- Auth ---------- */
export function signUp(input: { name: string; email: string; password: string; phone?: string; provider: "email" | "google" }) {
  const email = input.email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email)) return { error: "An account with this email already exists. Sign in instead." };
  const id = uid("u");
  const at = nowIso();
  const user: User = {
    id,
    name: input.name.trim(),
    email,
    password: input.password,
    phone: input.phone,
    createdAt: at,
    provider: input.provider,
    consent: { terms: TERMS_VERSION, privacy: PRIVACY_VERSION, at },
    prefs: { marketRole: "none", akubin: false, onboarded: false, interests: [] },
    verification: { type: null, basic: "not_started", full: "not_started", data: {}, history: [] },
    points: 0,
    deposits: [],
    saved: [],
    savedArticles: [],
  };
  update((d) => {
    d.users.push(user);
    d.sessionUserId = id;
    d.audit.unshift({ at, actor: email, action: "Account created", detail: `Consent ${TERMS_VERSION} / ${PRIVACY_VERSION}` });
    d.notifications.unshift({ id: uid("n"), userId: id, title: "Welcome to AkuMart", body: "Your shared account works for Marketplace and AkuBin.", read: false, at });
  });
  return { user };
}

export function signIn(email: string, password: string) {
  const u = db.users.find((x) => x.email === email.trim().toLowerCase());
  if (!u || (u.password !== password && !u.demo)) return { error: "Email or password is incorrect." };
  update((d) => {
    d.sessionUserId = u.id;
  });
  return { user: u };
}

export function googleExisting(email: string) {
  return db.users.find((x) => x.email === email.toLowerCase()) ?? null;
}

export function signOut() {
  update((d) => {
    d.sessionUserId = null;
    d.intent = null;
  });
}

export function updateMe(fn: (u: User, d: DB) => void) {
  update((d) => {
    const u = d.users.find((x) => x.id === d.sessionUserId);
    if (u) fn(u, d);
  });
}

export function setIntent(i: Intent | null) {
  update((d) => {
    d.intent = i;
  });
}

export function notify(d: DB, userId: string, title: string, body: string, href?: string) {
  d.notifications.unshift({ id: uid("n"), userId, title, body, href, read: false, at: nowIso() });
}
