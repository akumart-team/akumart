import { validateBinCode } from "./rules";
import { update, getDB, notify } from "./store";
import { nowIso, uid } from "./format";
import { recommendedFare, fareBounds, checkoutSplit, depositPoints, eligiblePartners, orderKg, rewardEligibility } from "./rules";
import type { DB, Listing, Material, Offer, Order, Partner, Campaign, Ticket, VStatus, VType, AdminRole } from "./types";

const meIn = (d: DB) => d.users.find((u) => u.id === d.sessionUserId)!;
const hrs = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

/* ---------------- Verification ---------------- */
export type DemoOutcome = "approved" | "pending_review" | "rejected" | "provider_unavailable";

export function startVerification(level: "basic" | "full", type: VType, data: Record<string, string>) {
  update((d) => {
    const u = meIn(d);
    u.verification.type = type;
    u.verification.data = { ...u.verification.data, ...data };
    u.verification[level] = "checking";
    u.verification.history.unshift({ at: nowIso(), actor: u.email, action: `${level} verification submitted`, detail: type });
  });
}

export function resolveVerification(level: "basic" | "full", outcome: DemoOutcome) {
  const map: Record<DemoOutcome, VStatus> = { approved: "approved", pending_review: "pending_review", rejected: "needs_resubmission", provider_unavailable: "pending_review" };
  update((d) => {
    const u = meIn(d);
    u.verification[level] = map[outcome];
    u.verification.reason =
      outcome === "rejected"
        ? "The document image was unreadable (demo reason). Please re-upload a clearer copy."
        : outcome === "provider_unavailable"
          ? "Verification provider unavailable (simulated), moved to manual review."
          : undefined;
    u.verification.history.unshift({ at: nowIso(), actor: "demo-provider", action: `${level} → ${map[outcome]}`, detail: "DEMO result" });
    notify(d, u.id, `Verification ${map[outcome].replace(/_/g, " ")}`, `Your ${level} Marketplace verification is now ${map[outcome].replace(/_/g, " ")}.`, "/app/verification");
  });
}

export function adminDecideVerification(userId: string, level: "basic" | "full", status: VStatus, reason?: string, actor = "admin") {
  update((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (!u) return;
    u.verification[level] = status;
    u.verification.reason = reason;
    u.verification.history.unshift({ at: nowIso(), actor, action: `Admin set ${level} → ${status}`, detail: reason });
    d.audit.unshift({ at: nowIso(), actor, action: `Verification ${level} ${status}`, detail: u.email });
    notify(d, u.id, `Verification ${status.replace(/_/g, " ")}`, reason ?? `An administrator updated your ${level} verification.`, "/app/verification");
  });
}

/* ---------------- Listings ---------------- */
export function saveListing(l: Omit<Listing, "id" | "sellerId" | "sellerName" | "sellerBadge" | "createdAt" | "views">, id?: string) {
  let newId = id ?? uid("L");
  update((d) => {
    const u = meIn(d);
    const badge = u.verification.basic === "approved" ? u.verification.type : null;
    const existing = d.listings.find((x) => x.id === id);
    if (existing) Object.assign(existing, l, { sellerBadge: badge });
    else d.listings.unshift({ ...l, id: newId, sellerId: u.id, sellerName: u.name, sellerBadge: badge, createdAt: nowIso(), views: 0 });
    if (l.status === "published" && !existing) {
      // Seed a demo incoming offer so the seller can practise responding.
      const oid = uid("O");
      d.offers.unshift({
        id: oid,
        listingId: newId,
        buyerId: "u-seed-5",
        buyerName: "GreenFibre Paper Mills (demo buyer)",
        sellerId: u.id,
        steps: [{ by: "buyer", price: Math.round(l.price * 0.9), qty: Math.max(l.minOrder, Math.round(l.qty / 3)), conditions: ["Inspection on pickup"], at: nowIso(), action: "offer" }],
        status: "awaiting_seller",
        expiresAt: hrs(72),
      });
      notify(d, u.id, "New offer received", `A demo buyer made an offer on “${l.title}”.`, "/app/offers");
    }
  });
  return newId;
}

export function toggleSaved(listingId: string) {
  update((d) => {
    const u = meIn(d);
    u.saved = u.saved.includes(listingId) ? u.saved.filter((x) => x !== listingId) : [...u.saved, listingId];
  });
}

export function flagListing(id: string, reason: string) {
  update((d) => {
    const l = d.listings.find((x) => x.id === id);
    if (l) {
      l.status = "flagged";
      l.flagReason = reason;
    }
    d.audit.unshift({ at: nowIso(), actor: d.sessionUserId ?? "guest", action: "Listing flagged", detail: `${id}: ${reason}` });
  });
}

/* ---------------- Offers ---------------- */
export function makeOffer(listingId: string, price: number, qty: number, conditions: string[]) {
  const id = uid("O");
  update((d) => {
    const u = meIn(d);
    const l = d.listings.find((x) => x.id === listingId)!;
    d.offers.unshift({ id, listingId, buyerId: u.id, buyerName: u.name, sellerId: l.sellerId, steps: [{ by: "buyer", price, qty, conditions, at: nowIso(), action: "offer" }], status: "awaiting_seller", expiresAt: hrs(72) });
    notify(d, l.sellerId, "New offer", `${u.name} offered on ${l.title}`, "/app/offers");
    notify(d, u.id, "Offer sent", `Your offer on “${l.title}” is awaiting the seller.`, "/app/offers");
  });
  return id;
}

export function respondOffer(offerId: string, by: "buyer" | "seller", action: "accept" | "reject" | "counter", counter?: { price: number; qty: number; conditions: string[] }) {
  let orderId: string | undefined;
  update((d) => {
    const o = d.offers.find((x) => x.id === offerId)!;
    const last = o.steps[o.steps.length - 1];
    const l = d.listings.find((x) => x.id === o.listingId)!;
    if (action === "counter" && counter) {
      o.steps.push({ by, ...counter, at: nowIso(), action: "counter" });
      o.status = by === "seller" ? "awaiting_buyer" : "awaiting_seller";
      o.expiresAt = hrs(72);
    } else if (action === "reject") {
      o.steps.push({ by, price: last.price, qty: last.qty, conditions: last.conditions, at: nowIso(), action: "reject" });
      o.status = "rejected";
    } else {
      o.steps.push({ by, price: last.price, qty: last.qty, conditions: last.conditions, at: nowIso(), action: "accept" });
      o.status = "accepted";
      orderId = uid("ORD");
      o.orderId = orderId;
      const seller = d.users.find((x) => x.id === o.sellerId);
      const order: Order = {
        id: orderId,
        offerId: o.id,
        listingId: l.id,
        title: l.title,
        material: l.material,
        buyerId: o.buyerId,
        buyerName: o.buyerName,
        sellerId: o.sellerId,
        sellerName: seller?.name ?? l.sellerName,
        qty: last.qty,
        unit: l.unit,
        unitPrice: last.price,
        pickupCity: l.city,
        pickupArea: l.area,
        notified: [],
        quotes: [],
        payment: "unpaid",
        status: "choose_fulfilment",
        timeline: [{ at: nowIso(), actor: by, action: "Offer accepted, order created" }],
        createdAt: nowIso(),
      };
      d.orders.unshift(order);
    }
    notify(d, by === "seller" ? o.buyerId : o.sellerId, `Offer ${action === "counter" ? "countered" : action + "ed"}`, l.title, orderId ? `/app/orders/${orderId}` : "/app/offers");
  });
  return orderId;
}

export function expireOffer(offerId: string) {
  update((d) => {
    const o = d.offers.find((x) => x.id === offerId);
    if (o && (o.status === "awaiting_buyer" || o.status === "awaiting_seller")) {
      o.status = "expired";
      const last = o.steps[o.steps.length - 1];
      o.steps.push({ ...last, at: nowIso(), action: "expire" });
    }
  });
}

/* ---------------- Orders & logistics ---------------- */
const mutOrder = (id: string, fn: (o: Order, d: DB) => void) =>
  update((d) => {
    const o = d.orders.find((x) => x.id === id);
    if (o) fn(o, d);
  });

/** Buyer proposes a fare within configured bounds; every eligible approved partner is notified. No self-pickup. */
export function requestLogistics(orderId: string, proposedFare: number, destination: string) {
  mutOrder(orderId, (o, d) => {
    const kg = orderKg(o);
    const rec = recommendedFare(kg, d.settings);
    const b = fareBounds(rec, d.settings);
    o.fulfilment = "delivery";
    o.destination = destination;
    o.recommendedFare = rec;
    o.proposedFare = Math.min(b.max, Math.max(b.min, proposedFare));
    o.quoteDeadline = hrs(d.settings.quoteDeadlineHours);
    const el = eligiblePartners(d.partners, o.pickupCity, o.material, kg);
    o.notified = el.map((p) => p.id);
    o.status = el.length ? "awaiting_quotes" : "no_quotes";
    o.timeline.push({ at: nowIso(), actor: "buyer", action: `Proposed delivery fare ${o.proposedFare} (recommended ${rec})` });
    o.timeline.push({ at: nowIso(), actor: "system", action: `${el.length} eligible partner(s) notified`, detail: "Only general areas and load details shared before assignment" });
    el.forEach((p) => p.ownerId && notify(d, p.ownerId, "New delivery job", `${o.title} from ${o.pickupCity}`, "/app/partner"));
  });
}
/** @deprecated kept for older callers; always routes to logistics partners. */
export function chooseFulfilment(orderId: string, _mode: "pickup" | "delivery", destination?: string) {
  const o = getDB().orders.find((x) => x.id === orderId);
  if (!o) return;
  requestLogistics(orderId, recommendedFare(orderKg(o), getDB().settings), destination || "Buyer site");
}

export function extendQuoteDeadline(orderId: string) {
  mutOrder(orderId, (o, d) => {
    o.quoteDeadline = hrs(d.settings.quoteDeadlineHours);
    o.timeline.push({ at: nowIso(), actor: "buyer", action: "Logistics deadline extended" });
  });
}

/** Simulated partner responses: accept the proposed fare or counter within bounds. */
export function simulateQuotes(orderId: string) {
  mutOrder(orderId, (o, d) => {
    const fare = o.proposedFare ?? recommendedFare(orderKg(o), d.settings);
    const b = fareBounds(o.recommendedFare ?? fare, d.settings);
    o.notified.forEach((pid, i) => {
      const p = d.partners.find((x) => x.id === pid)!;
      if (p.ownerId || o.quotes.some((q) => q.partnerId === pid)) return;
      const counter = i % 2 === 1;
      const amount = counter ? Math.min(b.max, fare + b.step * (i + 1)) : fare;
      o.quotes.push({ id: uid("Q"), partnerId: pid, partnerName: p.business, amount, eta: `${1 + i} day(s)`, vehicle: p.vehicles, status: "submitted", kind: counter ? "counter" : "accept" });
    });
    o.timeline.push({ at: nowIso(), actor: "partners (simulated)", action: `${o.quotes.length} response(s) received` });
  });
}

export function submitQuote(orderId: string, partnerId: string, amount: number, eta: string) {
  mutOrder(orderId, (o, d) => {
    const p = d.partners.find((x) => x.id === partnerId)!;
    o.quotes = o.quotes.filter((q) => q.partnerId !== partnerId);
    if (o.quoteId) return;
    o.quotes.push({ id: uid("Q"), partnerId, partnerName: p.business, amount, eta, vehicle: p.vehicles, status: "submitted", kind: amount === o.proposedFare ? "accept" : "counter" });
    o.timeline.push({ at: nowIso(), actor: p.business, action: `Quote submitted ${amount}` });
    notify(d, o.buyerId, "New delivery quote", `${p.business} quoted for ${o.title}`, `/app/orders/${o.id}`);
  });
}

export function selectQuote(orderId: string, quoteId: string) {
  mutOrder(orderId, (o, d) => {
    if (o.quoteId) return; // one frozen selection, no double assignment
    o.quoteId = quoteId;
    o.quotes.forEach((q) => (q.status = q.id === quoteId ? "selected" : "declined"));
    o.status = "awaiting_payment";
    const q = o.quotes.find((x) => x.id === quoteId)!;
    o.timeline.push({ at: nowIso(), actor: "buyer", action: `Selected ${q.partnerName}` });
    const p = d.partners.find((x) => x.id === q.partnerId);
    if (p?.ownerId) notify(d, p.ownerId, "Quote selected", `You were selected for ${o.title}. Agreed fare is frozen.`, "/app/partner");
    o.quotes.forEach((x) => {
      const op = d.partners.find((y) => y.id === x.partnerId);
      if (x.id !== quoteId && op?.ownerId) notify(d, op.ownerId, "Job assigned to another partner", o.title, "/app/partner");
    });
  });
}

export function pay(orderId: string, outcome: "success" | "failed") {
  mutOrder(orderId, (o, d) => {
    if (outcome === "failed") {
      o.payment = "failed";
      o.timeline.push({ at: nowIso(), actor: "payment-provider (simulated)", action: "Payment failed, card declined (demo)" });
      return;
    }
    o.payment = "held";
    o.status = "paid";
    o.timeline.push({ at: nowIso(), actor: "payment-provider (simulated)", action: "Payment collected and held by provider for conditional settlement" });
    notify(d, o.sellerId, "Order paid", `${o.title}, prepare for pickup by the assigned logistics partner`, `/app/orders/${o.id}`);
  });
}

export function advanceOrder(orderId: string, to: Order["status"], actor: string, proof?: string) {
  mutOrder(orderId, (o, d) => {
    o.status = to;
    if (proof) o.proof = proof;
    if (to === "proof_uploaded" || (to === "delivered" && o.fulfilment === "pickup")) o.inspectionDue = hrs(d.settings.inspectionHours);
    o.timeline.push({ at: nowIso(), actor, action: `Status → ${to.replace(/_/g, " ")}`, detail: proof });
    notify(d, o.buyerId, "Order update", `${o.title}: ${to.replace(/_/g, " ")}`, `/app/orders/${o.id}`);
  });
}

export function confirmAndSettle(orderId: string) {
  mutOrder(orderId, (o, d) => {
    const q = o.quotes.find((x) => x.id === o.quoteId);
    const s = checkoutSplit(o.qty * o.unitPrice, q?.amount ?? 0, d.settings);
    o.status = "settled";
    o.payment = "released";
    o.timeline.push({ at: nowIso(), actor: "buyer", action: "Receipt confirmed" });
    o.timeline.push({ at: nowIso(), actor: "payment-provider (simulated)", action: "Conditional settlement released", detail: `Seller ${s.sellerPayout} · Partner ${s.partnerPayout} · AkuMart fees ${s.akumartRevenue}` });
    if (q) {
      const p = d.partners.find((x) => x.id === q.partnerId);
      if (p) p.completed += 1;
    }
    notify(d, o.sellerId, "Payout released (simulated)", `${o.title}`, `/app/orders/${o.id}`);
  });
}

/** Transaction-qualified seller review: buyer of a settled order, once. */
export function reviewOrder(orderId: string, stars: number, text?: string) {
  mutOrder(orderId, (o, d) => {
    if (o.status !== "settled" || o.review || o.buyerId !== d.sessionUserId) return;
    o.review = { stars: Math.max(1, Math.min(5, Math.round(stars))), text: text?.trim() || undefined, at: nowIso() };
  });
}

export function openDispute(orderId: string, reason: string, evidence: string) {
  mutOrder(orderId, (o, d) => {
    o.status = "disputed";
    o.dispute = { reason, evidence, status: "open", at: nowIso() };
    o.timeline.push({ at: nowIso(), actor: "buyer", action: "Dispute opened, settlement on hold", detail: reason });
    d.tickets.unshift({ id: uid("T"), userId: o.buyerId, name: o.buyerName, email: "", subject: `Dispute on ${o.id}`, message: reason, channel: "dispute", priority: "high", status: "open", at: nowIso() });
  });
}

export function decideDispute(orderId: string, decision: "refund" | "partial" | "release", actor: string) {
  mutOrder(orderId, (o, d) => {
    if (!o.dispute) return;
    o.dispute.status = "resolved";
    o.dispute.decision = decision === "refund" ? "Full refund to buyer" : decision === "partial" ? "Partial refund / price adjustment" : "Closed, funds released to seller";
    o.payment = decision === "refund" ? "refunded" : decision === "partial" ? "partially_refunded" : "released";
    o.status = decision === "release" ? "settled" : "refunded";
    o.timeline.push({ at: nowIso(), actor, action: `Dispute resolved: ${o.dispute.decision}` });
    d.audit.unshift({ at: nowIso(), actor, action: "Dispute decision", detail: `${o.id}: ${o.dispute.decision}` });
    notify(d, o.buyerId, "Dispute resolved", o.dispute.decision, `/app/orders/${o.id}`);
  });
}

export function cancelOrder(orderId: string, actor: string) {
  mutOrder(orderId, (o) => {
    o.status = "cancelled";
    if (o.payment === "held") o.payment = "refunded";
    o.timeline.push({ at: nowIso(), actor, action: "Order cancelled" });
  });
}

/* ---------------- Buyer requests ---------------- */
export function postRequest(r: { material: Material; title: string; qty: number; unit: string; maxPrice: number; city: string; needBy: string }) {
  update((d) => {
    const u = meIn(d);
    d.requests.unshift({ ...r, id: uid("R"), buyerId: u.id, buyerName: u.name, responses: [], createdAt: nowIso() });
  });
}

export function respondRequest(reqId: string, price: number, qty: number, note: string) {
  update((d) => {
    const u = meIn(d);
    const r = d.requests.find((x) => x.id === reqId)!;
    r.responses.push({ id: uid("RS"), sellerId: u.id, sellerName: u.name, price, qty, note, at: nowIso(), status: "sent" });
    notify(d, r.buyerId, "New response to your request", r.title, "/app/requests");
  });
}

/* ---------------- AkuBin ---------------- */
/** Short-lived, single-use 6-digit numeric code for the signed-in account. Usable at any connected bin. */
export function createBinSession(_binId?: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  update((d) => {
    d.binSessions = d.binSessions.filter((x) => !(x.userId === d.sessionUserId && !x.used));
    d.binSessions.unshift({ code, binId: "", userId: d.sessionUserId!, expiresAt: new Date(Date.now() + 120_000).toISOString(), used: false });
  });
  return code;
}

export function checkBinSession(code: string, binId?: string) {
  const d = getDB();
  return validateBinCode(d.binSessions, code, binId ?? "", d.sessionUserId, Date.now());
}

/** Bin keypad entry: validates the code, consumes it and opens one multi-deposit session on that bin. */
export function startBinSession(code: string, binId: string) {
  const r = checkBinSession(code, binId);
  if (r !== "ok") return r;
  update((d) => {
    d.binSessions.forEach((x) => x.binId === binId && x.used && x.active && (x.active = false));
    const s = d.binSessions.find((x) => x.code === code)!;
    s.used = true;
    s.binId = binId;
    s.active = true;
  });
  return r;
}

export function endBinSession(code: string) {
  update((d) => {
    const s = d.binSessions.find((x) => x.code === code);
    if (s) s.active = false;
  });
}

export function recordDeposit(binId: string, code: string, material: Material, measure: "weight" | "count", amount: number, verified: boolean, reason?: string) {
  let result = { points: 0, kg: 0 };
  update((d) => {
    const u = meIn(d);
    const s = d.binSessions.find((x) => x.code === code && x.binId === binId && x.active);
    if (!s) return;
    result = depositPoints(d.settings, material, measure, amount, verified);
    u.deposits.unshift({ id: uid("D"), binId, material, measure, kg: result.kg, count: measure === "count" ? amount : undefined, points: result.points, status: verified ? "verified" : "rejected", reason, at: nowIso() });
    u.points += result.points;
    const b = d.bins.find((x) => x.id === binId);
    if (b) {
      b.events.unshift({ at: nowIso(), actor: "device (simulated)", action: verified ? "Deposit verified" : "Deposit rejected", detail: `${material} ${amount}${measure === "weight" ? "kg" : " items"}` });
      if (verified) b.capacity = Math.min(100, b.capacity + 3);
      if (b.capacity >= 100) b.status = "full";
    }
    if (!u.prefs.akubin) u.prefs.akubin = true;
    if (verified) notify(d, u.id, `+${result.points} points`, `Verified ${material} deposit at ${binId}`, "/app/akubin");
  });
  return result;
}

export function setPin(pin: string) {
  update((d) => {
    meIn(d).pin = pin;
  });
}

export function redeem(rewardId: string, phone?: string) {
  let out: { ok: boolean; msg: string } = { ok: false, msg: "" };
  update((d) => {
    const u = meIn(d);
    const r = d.rewards.find((x) => x.id === rewardId)!;
    const el = rewardEligibility(u.points, r.cost, r.kind, d.settings, r.stock);
    if (!el.ok) {
      out = { ok: false, msg: el.reason };
      return;
    }
    if (r.kind === "airtime" && !(phone ?? u.phone)) {
      d.redemptions.unshift({ id: uid("RD"), userId: u.id, userName: u.name, rewardId, rewardName: r.name, kind: r.kind, cost: r.cost, status: "failed", reason: "No phone number on account", at: nowIso() });
      out = { ok: false, msg: "Redemption failed: add a phone number first." };
      return;
    }
    u.points -= r.cost;
    if (r.stock !== undefined) r.stock -= 1;
    const status = r.automated ? "completed" : "pending_review";
    d.redemptions.unshift({ id: uid("RD"), userId: u.id, userName: u.name, rewardId, rewardName: r.name, kind: r.kind, cost: r.cost, status, at: nowIso() });
    notify(d, u.id, r.automated ? "Reward sent (simulated)" : "Redemption under review", r.name, "/app/akubin/rewards");
    out = { ok: true, msg: r.automated ? `${r.name} sent to ${phone ?? u.phone} (simulated).` : "Request submitted for review." };
  });
  return out;
}

export function decideRedemption(id: string, approve: boolean, actor: string) {
  update((d) => {
    const r = d.redemptions.find((x) => x.id === id);
    if (!r) return;
    r.status = approve ? "approved" : "rejected";
    if (!approve) {
      const u = d.users.find((x) => x.id === r.userId);
      if (u) u.points += r.cost;
      r.reason = "Rejected by finance review (demo), points returned.";
    }
    d.audit.unshift({ at: nowIso(), actor, action: `Redemption ${r.status}`, detail: r.id });
    notify(d, r.userId, `Redemption ${r.status}`, r.rewardName, "/app/akubin/rewards");
  });
}

/* ---------------- Partners ---------------- */
export function applyPartner(p: Omit<Partner, "id" | "status" | "rating" | "completed" | "appliedAt" | "ownerId">) {
  update((d) => {
    const u = meIn(d);
    const id = uid("p");
    d.partners.push({ ...p, id, ownerId: u.id, status: "pending", rating: 0, completed: 0, appliedAt: nowIso() });
    u.partner = id;
    d.audit.unshift({ at: nowIso(), actor: u.email, action: "Partner application submitted", detail: p.business });
  });
}

export function decidePartner(id: string, status: Partner["status"], actor: string, reason?: string) {
  update((d) => {
    const p = d.partners.find((x) => x.id === id);
    if (!p) return;
    p.status = status;
    p.reason = reason;
    d.audit.unshift({ at: nowIso(), actor, action: `Partner ${status}`, detail: p.business });
    if (p.ownerId) notify(d, p.ownerId, `Partner application ${status}`, reason ?? p.business, "/app/partner");
  });
}

/* ---------------- Ads ---------------- */
export const AD_PACKAGES = { "7d": 40000, "14d": 80000, "30d": 150000 } as const;
export function saveCampaign(c: Omit<Campaign, "id" | "ownerId" | "advertiser" | "payment" | "status" | "impressions" | "clicks" | "createdAt" | "price">) {
  const id = uid("C");
  update((d) => {
    const u = meIn(d);
    d.campaigns.unshift({ ...c, id, ownerId: u.id, advertiser: u.name, price: AD_PACKAGES[c.pkg], payment: "unpaid", status: "draft", impressions: 0, clicks: 0, createdAt: nowIso() });
  });
  return id;
}

export function payCampaign(id: string, ok: boolean) {
  update((d) => {
    const c = d.campaigns.find((x) => x.id === id)!;
    c.payment = ok ? "paid" : "failed";
    if (ok) c.status = "pending_review";
  });
}

export function decideCampaign(id: string, approve: boolean, actor: string, reason?: string) {
  update((d) => {
    const c = d.campaigns.find((x) => x.id === id)!;
    c.status = approve ? "approved" : "rejected";
    c.reason = reason;
    if (approve) {
      c.impressions = 320;
      c.clicks = 14;
    }
    d.audit.unshift({ at: nowIso(), actor, action: `Campaign ${c.status}`, detail: c.title });
    notify(d, c.ownerId, `Campaign ${c.status}`, c.title, "/app/advertise");
  });
}

/* ---------------- Support ---------------- */
export function createTicket(t: Omit<Ticket, "id" | "status" | "at">) {
  const id = uid("T");
  update((d) => {
    d.tickets.unshift({ ...t, id, status: "open", at: nowIso() });
  });
  return id;
}

export function setDevRole(r: AdminRole | null) {
  update((d) => {
    d.devRole = r;
  });
}

export function logAudit(actor: string, action: string, detail?: string) {
  update((d) => {
    d.audit.unshift({ at: nowIso(), actor, action, detail });
  });
}

export type { Offer };
