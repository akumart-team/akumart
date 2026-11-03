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
