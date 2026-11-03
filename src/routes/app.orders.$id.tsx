import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, PackageCheck, CreditCard, Loader2, ShieldAlert, CheckCircle2, Bot, Upload, Star, Info } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, Panel, Empty } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, inputCls } from "@/components/field";
import { DemoTag } from "@/components/brand";
import { useTradeGate } from "@/components/gate";
import { useDB, useMe } from "@/lib/store";
import { chooseFulfilment, simulateQuotes, selectQuote, pay, advanceOrder, confirmAndSettle, openDispute, cancelOrder } from "@/lib/actions";
import { checkoutSplit } from "@/lib/rules";
import { naira, dt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/app/orders/$id")({
  component: OrderPage,
});

const STAGES: { s: OrderStatus[]; label: string }[] = [
  { s: ["choose_fulfilment", "awaiting_quotes", "no_quotes"], label: "Accepted" },
  { s: ["awaiting_payment"], label: "Checkout" },
  { s: ["paid"], label: "Paid" },
  { s: ["picked_up"], label: "Picked up" },
  { s: ["in_transit"], label: "In transit" },
  { s: ["delivered", "proof_uploaded"], label: "Delivered" },
  { s: ["confirmed", "settled"], label: "Settled" },
];

function OrderPage() {
  const { id } = Route.useParams();
  const me = useMe()!;
  const o = useDB((d) => d.orders.find((x) => x.id === id));
  const listing = useDB((d) => d.listings.find((l) => l.id === o?.listingId));
  const partners = useDB((d) => d.partners);
  const settings = useDB((d) => d.settings);
  const gate = useTradeGate();
  const [dest, setDest] = useState("");
  const [paying, setPaying] = useState(false);
  const [payOutcome, setPayOutcome] = useState<"success" | "failed">("success");
  const [proof, setProof] = useState("");
  const [dispute, setDispute] = useState({ reason: "", evidence: "" });
  const [showDispute, setShowDispute] = useState(false);

  useEffect(() => {
    if (o?.status === "awaiting_quotes" && o.quotes.length === 0) {
      const t = setTimeout(() => simulateQuotes(o.id), 1600);
      return () => clearTimeout(t);
    }
  }, [o?.status, o?.quotes.length, o?.id]);

  if (!o || (o.buyerId !== me.id && o.sellerId !== me.id))
    return (
      <Empty title="Order not found" body="This order doesn’t exist or you don’t have access to it.">
        <Button asChild>
          <Link to="/app/orders">My orders</Link>
        </Button>
      </Empty>
    );

  const isBuyer = o.buyerId === me.id;
  const isSeller = o.sellerId === me.id;
  const quote = o.quotes.find((q) => q.id === o.quoteId);
  const value = o.qty * o.unitPrice;
  const split = checkoutSplit(value, quote?.amount ?? 0, settings);
  const stageIdx = STAGES.findIndex((s) => s.s.includes(o.status));
  const sellerSim = !isSeller; // seed sellers are simulated
  const partnerSim = quote ? !partners.find((p) => p.id === quote.partnerId)?.ownerId : false;

  const doPay = () =>
    gate({ path: `/app/orders/${o.id}`, label: "Pay for this order", level: "full" }, () => {
      setPaying(true);
      setTimeout(() => {
        pay(o.id, payOutcome);
        setPaying(false);
        payOutcome === "success" ? toast.success("Payment collected by provider (simulated)") : toast.error("Payment failed (simulated)");
      }, 1800);
    });

  return (
    <div className="max-w-5xl">
      <PageTitle eyebrow={`Order ${o.id}`} title={o.title} intro={`${o.qty.toLocaleString()} ${o.unit} at ${naira(o.unitPrice)}/${o.unit} · ${isBuyer ? `Seller: ${o.sellerName}` : `Buyer: ${o.buyerName}`}`} actions={<StatusChip status={o.status} className="text-sm" />} />

      {stageIdx >= 0 && (
        <ol className="mb-8 grid grid-cols-7 gap-1" aria-label="Order progress">
          {STAGES.map((s, i) => (
            <li key={s.label} className="text-center">
              <div className={cn("h-1.5 rounded-full", i <= stageIdx ? "bg-primary" : "bg-border")} />
              <p className={cn("mt-2 hidden text-xs sm:block", i <= stageIdx ? "font-semibold" : "text-muted-foreground")}>{s.label}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Fulfilment choice */}
          {o.status === "choose_fulfilment" && (
            <Panel title="Choose fulfilment">
              {isBuyer ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Options approved by the seller for this listing:</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {listing?.fulfilment.includes("pickup") && (
                      <button onClick={() => chooseFulfilment(o.id, "pickup")} className="rounded-2xl border p-5 text-left hover:border-primary">
                        <PackageCheck className="size-6 text-primary" />
                        <p className="mt-2 font-semibold">Independent pickup</p>
                        <p className="text-sm text-muted-foreground">Collect from {o.pickupArea}, {o.pickupCity}.</p>
                      </button>
                    )}
                    {listing?.fulfilment.includes("delivery") && (
                      <div className="rounded-2xl border p-5">
                        <Truck className="size-6 text-primary" />
                        <p className="mt-2 font-semibold">Logistics delivery</p>
                        <input className={inputCls + " mt-3"} placeholder="Delivery destination" value={dest} onChange={(e) => setDest(e.target.value)} />
                        <Button size="sm" className="mt-3" disabled={dest.length < 3} onClick={() => chooseFulfilment(o.id, "delivery", dest)}>
                          Request quotes
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Waiting for the buyer to choose pickup or delivery.</p>
              )}
            </Panel>
          )}

          {/* Quotes */}
          {o.fulfilment === "delivery" && (o.status === "awaiting_quotes" || o.status === "no_quotes" || o.quotes.length > 0) && (
            <Panel title="Delivery quotes" action={<DemoTag>Simulated partners</DemoTag>}>
              <p className="mb-4 text-sm text-muted-foreground">
                {o.notified.length} eligible approved partner(s) notified — matched on route ({o.pickupCity} → {o.destination}), material ({o.material}) and capacity.
              </p>
              {o.status === "no_quotes" ? (
                <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
                  No approved partner currently serves this route, material and capacity.
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => chooseFulfilment(o.id, "pickup")}>
                      Switch to pickup
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => cancelOrder(o.id, "buyer")}>
                      Cancel order
                    </Button>
                  </div>
                </div>
              ) : o.quotes.length === 0 ? (
                <p className="flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" /> Waiting for quotes…
                </p>
              ) : (
                <div className="space-y-2">
                  {[...o.quotes].sort((a, b) => a.amount - b.amount).map((q, i) => {
                    const p = partners.find((x) => x.id === q.partnerId);
                    return (
                      <div key={q.id} className={cn("flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4", q.status === "selected" && "border-primary bg-secondary")}>
                        <div>
                          <p className="font-semibold">
                            {q.partnerName} {i === 0 && o.status === "awaiting_quotes" && <span className="ml-1 rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-lime-foreground">LOWEST</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {q.vehicle} · ETA {q.eta} · <Star className="inline size-3" /> {p?.rating} · {p?.completed} jobs
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-display text-lg font-bold">{naira(q.amount)}</p>
                          {isBuyer && o.status === "awaiting_quotes" ? (
                            <Button size="sm" onClick={() => selectQuote(o.id, q.id)}>
                              Select
                            </Button>
                          ) : (
                            <StatusChip status={q.status} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          )}

          {/* Checkout */}
          {o.status === "awaiting_payment" && (
            <Panel title="Checkout">
              {isBuyer ? (
                <>
                  <dl className="space-y-2 text-sm">
                    <Row k="Waste value" v={naira(value)} />
                    {quote && <Row k={`Delivery — ${quote.partnerName}`} v={naira(quote.amount)} />}
                    <Row k="AkuMart buyer commission" v={naira(0)} />
                    <div className="border-t pt-2">
                      <Row k={<strong>Total payable</strong>} v={<strong className="text-lg">{naira(split.buyerTotal)}</strong>} />
                    </div>
                  </dl>
                  <div className="mt-4 flex gap-2 rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
                    <Info className="size-4 shrink-0" /> Payment is collected by a licensed third-party payment provider and held under conditional settlement until receipt is confirmed. AkuMart does not take custody of funds. This is not presented as legally guaranteed escrow.
                  </div>
                  {o.payment === "failed" && <p className="mt-3 text-sm font-medium text-destructive">Last payment attempt failed. Please try again.</p>}
                  <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-warning bg-warning/10 p-3">
                    <Field label="Simulated provider result" className="min-w-48 flex-1">
                      <select className={inputCls} value={payOutcome} onChange={(e) => setPayOutcome(e.target.value as "success" | "failed")}>
                        <option value="success">Payment succeeds</option>
                        <option value="failed">Card declined</option>
                      </select>
                    </Field>
                    <Button size="lg" onClick={doPay} disabled={paying}>
                      {paying ? <Loader2 className="animate-spin" /> : <CreditCard />} Pay {naira(split.buyerTotal)}
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => cancelOrder(o.id, "buyer")}>
                    Cancel order
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Waiting for buyer payment via the provider.</p>
              )}
            </Panel>
          )}

          {/* Fulfilment progress */}
          {["paid", "picked_up", "in_transit", "delivered", "proof_uploaded"].includes(o.status) && (
            <Panel title="Fulfilment">
              {o.fulfilment === "delivery" ? (
                <div className="space-y-3 text-sm">
                  <p>
                    {quote?.partnerName} is handling delivery to {o.destination}.
                  </p>
                  {partnerSim && o.status !== "proof_uploaded" && (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-warning bg-warning/10 p-3 text-xs">
                      <Bot className="size-4" /> Demo: simulate partner update
                      {o.status === "paid" && <Button size="sm" variant="outline" onClick={() => advanceOrder(o.id, "picked_up", quote!.partnerName)}>Confirm pickup</Button>}
                      {o.status === "picked_up" && <Button size="sm" variant="outline" onClick={() => advanceOrder(o.id, "in_transit", quote!.partnerName)}>In transit</Button>}
                      {o.status === "in_transit" && <Button size="sm" variant="outline" onClick={() => advanceOrder(o.id, "proof_uploaded", quote!.partnerName, "delivery-photo-and-signature.jpg")}>Upload delivery proof</Button>}
                    </div>
                  )}
                  {!partnerSim && o.status !== "proof_uploaded" && <p className="text-muted-foreground">The assigned partner updates status from their portal.</p>}
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p>Independent pickup from {o.pickupArea}, {o.pickupCity}. The seller records handover; the buyer confirms receipt. <span className="text-muted-foreground">(Handover-proof rules are a proposed design assumption.)</span></p>
                  {(isSeller || sellerSim) && o.status === "paid" && (
                    <div className="flex flex-wrap items-end gap-2">
                      <Field label="Handover proof (file name)" className="flex-1">
                        <input className={inputCls} value={proof} onChange={(e) => setProof(e.target.value)} placeholder="e.g. weighbridge-ticket.jpg" />
                      </Field>
                      <Button variant={isSeller ? "default" : "outline"} onClick={() => advanceOrder(o.id, "proof_uploaded", isSeller ? "seller" : "seller (demo)", proof || "handover-photo.jpg")}>
                        <Upload /> {isSeller ? "Record handover" : "Demo: seller records handover"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {o.status === "proof_uploaded" && (
                <div className="mt-4 rounded-2xl bg-secondary p-4">
                  <p className="font-semibold">Proof uploaded: {o.proof}</p>
                  <p className="text-sm text-muted-foreground">Inspection window ends {o.inspectionDue ? dt(o.inspectionDue) : "—"} ({settings.inspectionHours}h, configurable). If undisputed, settlement releases automatically.</p>
                  {isBuyer && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        onClick={() => {
                          confirmAndSettle(o.id);
                          toast.success("Receipt confirmed — settlement released (simulated)");
                        }}
                      >
                        <CheckCircle2 /> Confirm receipt
                      </Button>
                      <Button variant="outline" onClick={() => setShowDispute(true)}>
                        <ShieldAlert /> Raise a dispute
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => confirmAndSettle(o.id)}>
                        Demo: let inspection deadline pass
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Panel>
          )}

          {showDispute && (
            <Panel title="Raise a dispute">
              <div className="space-y-3">
                <Field label="Reason">
                  <select className={inputCls} value={dispute.reason} onChange={(e) => setDispute({ ...dispute, reason: e.target.value })}>
                    <option value="">Select…</option>
                    <option>Quantity short of agreed amount</option>
                    <option>Material grade not as described</option>
                    <option>Damaged or contaminated on arrival</option>
                    <option>Not delivered</option>
                  </select>
                </Field>
                <Field label="Evidence (describe and list file names)">
                  <Textarea rows={3} className="rounded-xl" value={dispute.evidence} onChange={(e) => setDispute({ ...dispute, evidence: e.target.value })} />
                </Field>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!dispute.reason || dispute.evidence.length < 5) return toast.error("Add a reason and evidence");
                    openDispute(o.id, dispute.reason, dispute.evidence);
                    setShowDispute(false);
                    toast("Dispute opened — settlement on hold");
                  }}
                >
                  Submit dispute
                </Button>
              </div>
            </Panel>
          )}

          {o.dispute && (
            <Panel title="Dispute">
              <div className="flex items-center justify-between">
                <p className="font-medium">{o.dispute.reason}</p>
                <StatusChip status={o.dispute.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Evidence: {o.dispute.evidence}</p>
              {o.dispute.decision ? <p className="mt-3 rounded-xl bg-muted p-3 text-sm">Decision: {o.dispute.decision}</p> : <p className="mt-3 text-sm text-muted-foreground">An AkuMart support reviewer will assess the evidence. (Demo: resolve from the internal admin console.)</p>}
            </Panel>
          )}

          {o.status === "settled" && (
            <Panel>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-8 text-primary" />
                <div>
                  <p className="font-display text-xl font-semibold">Order complete</p>
                  <p className="text-sm text-muted-foreground">Provider settlement released (simulated).</p>
                </div>
              </div>
            </Panel>
          )}
          {o.status === "cancelled" && <Panel><p className="text-sm">This order was cancelled{o.payment === "refunded" ? "; payment refunded by provider (simulated)." : "."}</p></Panel>}
        </div>

        <div className="space-y-6">
          <Panel title="Settlement breakdown">
            <dl className="space-y-2 text-sm">
              <Row k="Buyer pays" v={naira(split.buyerTotal)} />
              <Row k="Waste value" v={naira(value)} />
              <Row k={`Seller fee (${settings.sellerFee}%)`} v={"−" + naira(split.sellerCommission)} />
              <Row k={<strong>Seller payout</strong>} v={<strong>{naira(split.sellerPayout)}</strong>} />
              {quote && (
                <>
                  <Row k="Delivery fee" v={naira(quote.amount)} />
                  <Row k={`Partner fee (${settings.partnerFee}%)`} v={"−" + naira(split.partnerCommission)} />
                  <Row k={<strong>Partner payout</strong>} v={<strong>{naira(split.partnerPayout)}</strong>} />
                </>
              )}
              <div className="border-t pt-2">
                <Row k="Payment status" v={<StatusChip status={o.payment} />} />
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Provisional, configurable rates. Fees are deducted from proceeds — buyers pay no surcharge.</p>
          </Panel>
          <Panel title="Activity">
            <ol className="space-y-3 text-sm">
              {[...o.timeline].reverse().map((t, i) => (
                <li key={i} className="border-l-2 pl-3">
                  <p className="font-medium">{t.action}</p>
                  {t.detail && <p className="text-xs text-muted-foreground">{t.detail}</p>}
                  <p className="text-xs text-muted-foreground">
                    {t.actor} · {dt(t.at)}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
