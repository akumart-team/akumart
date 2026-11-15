import { useSyncExternalStore } from "react";
import { TERMS_VERSION, PRIVACY_VERSION } from "./seed";
import type { DB, User, Intent } from "./types";
import { currentUser } from "./rules";
import { nowIso, uid } from "./format";

// Legacy domain helpers remain for migration tests; runtime data never loads demo records.
function emptyDB(): DB {
  return {
    version: 5,
    sessionUserId: null,
    devRole: null,
    intent: null,
    users: [],
    listings: [],
    offers: [],
    orders: [],
    requests: [],
    bins: [],
    rewards: [],
    redemptions: [],
    partners: [],
    campaigns: [],
    articles: [],
    news: [],
    tickets: [],
    notifications: [],
    enquiries: [],
    audit: [],
    binSessions: [],
    leaderboard: [],
    settings: {
      sellerFee: 0,
      partnerFee: 0,
      pointsPerKg: {
        plastic: 0,
        metal: 0,
        glass: 0,
        cardboard: 0,
        paper: 0,
        wood: 0,
        textiles: 0,
        rubber: 0,
      },
      pointsPerItem: 0,
      itemKgEquivalent: 0,
      airtimeMin: 0,
      cashMin: 0,
      pointValueNaira: 0,
      inspectionHours: 0,
      fareBase: 0,
      farePerKg: 0,
      fareStep: 1,
      fareMinPct: 0,
      fareMaxPct: 0,
      quoteDeadlineHours: 0,
    },
  };
}
let db: DB = emptyDB();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  // Retire old browser fixtures and plaintext demo passwords; never restore them into live pages.
  try {
    localStorage.removeItem("akumart-demo-db-v3");
  } catch {
    /* storage may be disabled */
  }

  try {
    const saved = JSON.parse(sessionStorage.getItem("akumart-intent") || "null");
    if (
      saved &&
      typeof saved.path === "string" &&
      saved.path.startsWith("/") &&
      !/^\/[/\\]/.test(saved.path) &&
      ["basic", "full"].includes(saved.level) &&
      typeof saved.label === "string"
    )
      db.intent = { path: saved.path, level: saved.level, label: saved.label };
  } catch {
    /* Ignore invalid navigation intent. */
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

  emit();
}

export function resetDemo() {
  db = emptyDB();

  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverSeed = emptyDB();
/** Subscribes to the DB snapshot (stable identity) and derives the selection during render. */
export function useDB<T>(sel: (d: DB) => T): T {
  const snap = useSyncExternalStore(
    subscribe,
    () => db,
    () => serverSeed,
  );
  return sel(snap);
}

export function useHydratedFlag() {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

export function useMe() {
  return useDB(currentUser);
}

export function me(d: DB = db) {
  return currentUser(d);
}

/* ---------- Auth ---------- */
export function signUp(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  provider: "email" | "google";
}) {
  const email = input.email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email))
    return { error: "An account with this email already exists. Sign in instead." };
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
    d.audit.unshift({
      at,
      actor: email,
      action: "Account created",
      detail: `Consent ${TERMS_VERSION} / ${PRIVACY_VERSION}`,
    });
    d.notifications.unshift({
      id: uid("n"),
      userId: id,
      title: "Welcome to AkuMart",
      body: "Your shared account works for Marketplace and AkuBin.",
      read: false,
      at,
    });
  });
  return { user };
}

export function signIn(email: string, password: string) {
  const u = db.users.find((x) => x.email === email.trim().toLowerCase());
  if (!u || (u.password !== password && !u.demo))
    return { error: "Email or password is incorrect." };
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
  if (typeof window !== "undefined") {
    try {
      if (i) sessionStorage.setItem("akumart-intent", JSON.stringify(i));
      else sessionStorage.removeItem("akumart-intent");
    } catch {
      /* navigation still works when storage is disabled */
    }
  }
}

export function notify(d: DB, userId: string, title: string, body: string, href?: string) {
  d.notifications.unshift({ id: uid("n"), userId, title, body, href, read: false, at: nowIso() });
}
