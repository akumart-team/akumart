import type { DB, Material, Partner, Order, User, Settings } from "./types";

/** Marketplace eligibility: basic tier for offers/listings, full tier for checkout/payout. */
export function canTrade(user: User | null | undefined, level: "basic" | "full") {
  if (!user) return false;
  const v = user.verification;
  if (level === "basic") return v.basic === "approved";
  return v.basic === "approved" && v.full === "approved";
}

/** Checkout split. Buyer pays waste value + quote; fees are deducted from proceeds, never added to buyer. */
export function checkoutSplit(wasteValue: number, deliveryFee: number, s: Pick<Settings, "sellerFee" | "partnerFee">) {
  const sellerCommission = Math.round((wasteValue * s.sellerFee) / 100);
  const partnerCommission = Math.round((deliveryFee * s.partnerFee) / 100);
  return {
    buyerTotal: wasteValue + deliveryFee,
    sellerCommission,
    sellerPayout: wasteValue - sellerCommission,
    partnerCommission,
    partnerPayout: deliveryFee - partnerCommission,
    akumartRevenue: sellerCommission + partnerCommission,
  };
}

/** Partners notified for a delivery job: approved + serves city + handles material + has capacity. */
export function eligiblePartners(partners: Partner[], city: string, material: Material, kg: number) {
  return partners.filter(
    (p) => p.status === "approved" && p.areas.includes(city) && p.materials.includes(material) && p.capacityKg >= kg,
  );
}

export function orderKg(o: Pick<Order, "qty" | "unit">) {
  return o.unit === "tonne" ? o.qty * 1000 : o.qty;
}

/** Points for a verified deposit. Rejected deposits always earn 0. */
export function depositPoints(
  s: Pick<Settings, "pointsPerKg" | "pointsPerItem" | "itemKgEquivalent">,
  material: Material,
  measure: "weight" | "count",
  amount: number,
  verified: boolean,
) {
  if (!verified || amount <= 0) return { points: 0, kg: 0 };
  if (measure === "weight") return { points: Math.round(amount * s.pointsPerKg[material]), kg: amount };
  return { points: Math.round(amount * s.pointsPerItem), kg: +(amount * s.itemKgEquivalent).toFixed(2) };
}

export function rewardEligibility(points: number, cost: number, kind: "airtime" | "cash" | "physical", s: Pick<Settings, "airtimeMin" | "cashMin">, stock?: number) {
  if (kind === "physical" && stock !== undefined && stock <= 0) return { ok: false, reason: "Out of stock" };
  const min = kind === "cash" ? Math.max(cost, s.cashMin) : kind === "airtime" ? Math.max(cost, s.airtimeMin) : cost;
  if (points < min) return { ok: false, reason: `Needs ${min.toLocaleString()} pts` };
  return { ok: true as const, reason: "" };
}

export const currentUser = (db: DB) => db.users.find((u) => u.id === db.sessionUserId) ?? null;
