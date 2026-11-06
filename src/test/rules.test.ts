import { describe, expect, it } from "vitest";
import { canTrade, checkoutSplit, depositPoints, eligiblePartners, rewardEligibility } from "@/lib/rules";
import { createSeed } from "@/lib/seed";
import type { User } from "@/lib/types";

const s = createSeed().settings;

describe("commission split", () => {
  it("deducts 5% from seller proceeds and 3% from the delivery fee, with no buyer surcharge", () => {
    const r = checkoutSplit(100_000, 20_000, { sellerFee: 5, partnerFee: 3 });
    expect(r.buyerTotal).toBe(120_000);
    expect(r.sellerPayout).toBe(95_000);
    expect(r.partnerPayout).toBe(19_400);
    expect(r.akumartRevenue).toBe(5_600);
  });
});

describe("marketplace verification tiers", () => {
  const user = (basic: string, full: string) => ({ verification: { basic, full } }) as unknown as User;
  it("basic approval allows offers but not checkout", () => {
    expect(canTrade(user("approved", "not_started"), "basic")).toBe(true);
    expect(canTrade(user("approved", "not_started"), "full")).toBe(false);
  });
  it("pending review never unlocks trading", () => {
    expect(canTrade(user("pending_review", "not_started"), "basic")).toBe(false);
  });
  it("guests cannot trade", () => {
    expect(canTrade(null, "basic")).toBe(false);
  });
});

describe("AkuBin points", () => {
  it("rejected deposits earn zero points", () => {
    expect(depositPoints(s, "plastic", "weight", 3, false)).toEqual({ points: 0, kg: 0 });
  });
  it("count deposits use the verified weight equivalent", () => {
    expect(depositPoints(s, "metal", "count", 10, true)).toEqual({ points: 20, kg: 0.2 });
  });
  it("cash withdrawal locked below the configured minimum", () => {
    expect(rewardEligibility(4999, 5000, "cash", s).ok).toBe(false);
    expect(rewardEligibility(5000, 5000, "cash", s).ok).toBe(true);
  });
});

describe("logistics notifications", () => {
  it("notifies every approved partner matching route, material and capacity — not pending ones", () => {
    const ids = eligiblePartners(createSeed().partners, "Lagos", "metal", 2000).map((p) => p.id);
    expect(ids).toEqual(["p-swift", "p-east"].filter((x) => x !== "p-east")); // p-east doesn't handle metal
    expect(ids).not.toContain("p-new");
  });
});

import { validateBinCode, fareBounds, recommendedFare, sellerRating } from "@/lib/rules";
import { safeTarget } from "@/lib/after-auth";

describe("November corrections", () => {
  const now = Date.now();
  const sess = (o: Partial<{ code: string; binId: string; userId: string; expiresAt: string; used: boolean; active: boolean }>) => ({ code: "123456", binId: "", userId: "U1", expiresAt: new Date(now + 60_000).toISOString(), used: false, ...o });
  it("bin code must be 6 digits, own, unused and unexpired", () => {
    expect(validateBinCode([sess({})], "123456", "BIN-001", "U1", now)).toBe("ok");
    expect(validateBinCode([sess({ code: "AKB-12" })], "AKB-12", "BIN-001", "U1", now)).toBe("invalid");
    expect(validateBinCode([sess({ used: true })], "123456", "BIN-001", "U1", now)).toBe("used");
    expect(validateBinCode([sess({ expiresAt: new Date(now - 1).toISOString() })], "123456", "BIN-001", "U1", now)).toBe("expired");
    expect(validateBinCode([sess({})], "123456", "BIN-001", "U2", now)).toBe("invalid");
  });
  it("one active session per bin", () => {
    expect(validateBinCode([sess({}), sess({ code: "999999", userId: "U9", binId: "BIN-001", used: true, active: true })], "123456", "BIN-001", "U1", now)).toBe("busy");
  });
  it("fare bounds use configured percent band and step", () => {
    const s = { fareBase: 15000, farePerKg: 8, fareStep: 500, fareMinPct: 20, fareMaxPct: 30 };
    expect(recommendedFare(1000, s)).toBe(23000);
    expect(fareBounds(23000, s)).toEqual({ min: 18500, max: 30000, step: 500 });
  });
  it("unrated seller is New seller", () => {
    expect(sellerRating([], "S1")).toBeNull();
    expect(sellerRating([{ sellerId: "S1", review: { stars: 4, at: "" } }, { sellerId: "S1", review: { stars: 5, at: "" } }], "S1")).toEqual({ avg: 4.5, count: 2 });
  });
  it("redirect targets never loop into sign-in", () => {
    expect(safeTarget("/login?redirect=%2Flogin%3Fredirect%3D%252Fapp")).toBe("/app");
    expect(safeTarget("/onboarding")).toBeUndefined();
    expect(safeTarget("//evil.com")).toBeUndefined();
  });
});
