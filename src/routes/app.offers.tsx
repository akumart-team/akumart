import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Repeat, Clock, Bot } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, Panel, Empty } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Field, inputCls, Chips } from "@/components/field";
import { useTradeGate } from "@/components/gate";
import { useDB, useMe } from "@/lib/store";
import { respondOffer, expireOffer } from "@/lib/actions";
import { naira, dt } from "@/lib/format";
import { CONDITIONS } from "@/lib/seed";
import { cn } from "@/lib/utils";
import type { Offer } from "@/lib/types";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/app/offers")({
  component: Offers,
});

function Offers() {
  const me = useMe()!;
  const offers = useDB((d) => d.offers.filter((o) => o.buyerId === me.id || o.sellerId === me.id));
  const listings = useDB((d) => d.listings);
  const [tabSel, setTab] = useState<"received" | "sent" | null>(null);
  const tab = tabSel ?? (offers.some((o) => o.sellerId === me.id) || !offers.some((o) => o.buyerId === me.id) ? "received" : "sent");
  const list = offers.filter((o) => (tab === "received" ? o.sellerId === me.id : o.buyerId === me.id));
  return (
    <div className="max-w-4xl">
      <PageTitle eyebrow="Negotiation" title="Offers" intro="Structured offers only — price, quantity and predefined conditions. No free-form chat." />
      <div className="mb-6 inline-flex rounded-full border bg-card p-1">
        {(["received", "sent"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-full px-5 py-2 text-sm font-semibold capitalize", tab === t ? "bg-forest text-forest-foreground" : "text-muted-foreground")}>
            {t} ({offers.filter((o) => (t === "received" ? o.sellerId === me.id : o.buyerId === me.id)).length})
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty title={tab === "received" ? "No offers received" : "No offers sent"} body={tab === "received" ? "Publish a listing to start receiving offers." : "Browse the Marketplace and make your first offer."}>
          <Button asChild>
            <Link to={tab === "received" ? "/app/listings/new" : "/marketplace"}>{tab === "received" ? "Create listing" : "Browse"}</Link>
          </Button>
        </Empty>
      ) : (
        <div className="space-y-4">
          {list.map((o) => (
            <OfferCard key={o.id} o={o} role={tab === "received" ? "seller" : "buyer"} title={listings.find((l) => l.id === o.listingId)?.title ?? o.listingId} unit={listings.find((l) => l.id === o.listingId)?.unit ?? "kg"} />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({ o, role, title, unit }: { o: Offer; role: "buyer" | "seller"; title: string; unit: string }) {
  const gate = useTradeGate();
  const router = useRouter();
  const last = o.steps[o.steps.length - 1];
  const myTurn = (role === "seller" && o.status === "awaiting_seller") || (role === "buyer" && o.status === "awaiting_buyer");
  const otherTurn = (role === "seller" && o.status === "awaiting_buyer") || (role === "buyer" && o.status === "awaiting_seller");
  const [counter, setCounter] = useState(false);
  const [p, setP] = useState(String(last.price));
  const [q, setQ] = useState(String(last.qty));
  const [c, setC] = useState<string[]>(last.conditions);
  const intent = { path: "/app/offers", label: "Respond to an offer", level: "basic" as const };
  const act = (a: "accept" | "reject" | "counter", by = role) =>
    gate(intent, () => {
      const orderId = respondOffer(o.id, by, a, a === "counter" ? { price: +p, qty: +q, conditions: c } : undefined);
      setCounter(false);
      toast.success(a === "accept" ? "Offer accepted — order created" : a === "reject" ? "Offer rejected" : "Counteroffer sent");
      if (orderId) router.navigate({ to: "/app/orders/$id", params: { id: orderId } });
    });
  const simulate = (a: "accept" | "reject" | "counter") => {
    const other = role === "buyer" ? "seller" : "buyer";
    if (a === "counter") {
      respondOffer(o.id, other, "counter", { price: Math.round(last.price * (other === "seller" ? 1.06 : 0.96)), qty: last.qty, conditions: last.conditions });
    } else {
      const orderId = respondOffer(o.id, other, a);
      if (orderId) router.navigate({ to: "/app/orders/$id", params: { id: orderId } });
    }
  };
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {o.id} · {role === "seller" ? `from ${o.buyerName}` : "to seller"}
          </p>
          <Link to="/marketplace/$id" params={{ id: o.listingId }} className="font-display text-lg font-semibold hover:text-primary">
            {title}
          </Link>
        </div>
        <StatusChip status={o.status} />
      </div>
      <ol className="mt-4 space-y-2 border-l-2 pl-4">
        {o.steps.map((s, i) => (
          <li key={i} className="relative text-sm">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="font-medium capitalize">{s.by}</span> {s.action === "offer" ? "offered" : s.action === "counter" ? "countered" : s.action + "ed"} — {naira(s.price)}/{unit} × {s.qty.toLocaleString()} {unit}
            {s.conditions.length > 0 && <span className="text-muted-foreground"> · {s.conditions.join(", ")}</span>}
            <span className="block text-xs text-muted-foreground">{dt(s.at)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm">
        Total: <strong>{naira(last.price * last.qty)}</strong>
        {(o.status === "awaiting_buyer" || o.status === "awaiting_seller") && (
          <span className="ml-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" /> Expires {dt(o.expiresAt)}
          </span>
        )}
      </p>
      {myTurn && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => act("accept")}>
            <Check /> Accept
          </Button>
          <Button size="sm" variant="outline" onClick={() => gate(intent, () => setCounter(true))}>
            <Repeat /> Counter
          </Button>
          <Button size="sm" variant="ghost" onClick={() => act("reject")}>
            <X /> Reject
          </Button>
        </div>
      )}
      {otherTurn && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-warning bg-warning/10 p-3 text-xs">
          <Bot className="size-4" /> Demo: simulate the {role === "buyer" ? "seller" : "buyer"}’s response
          <Button size="sm" variant="outline" onClick={() => simulate("accept")}>
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={() => simulate("counter")}>
            Counter
          </Button>
          <Button size="sm" variant="outline" onClick={() => simulate("reject")}>
            Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => expireOffer(o.id)}>
            Let it expire
          </Button>
        </div>
      )}
      {o.status === "accepted" && o.orderId && (
        <Button asChild size="sm" className="mt-4">
          <Link to="/app/orders/$id" params={{ id: o.orderId }}>
            Go to order
          </Link>
        </Button>
      )}
      <Dialog open={counter} onOpenChange={setCounter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Counteroffer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Price (₦/${unit})`}>
              <input className={inputCls} type="number" value={p} onChange={(e) => setP(e.target.value)} />
            </Field>
            <Field label={`Quantity (${unit})`}>
              <input className={inputCls} type="number" value={q} onChange={(e) => setQ(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Chips options={CONDITIONS.map((x) => ({ id: x, label: x }))} value={c} onChange={setC} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => +p > 0 && +q > 0 && act("counter")}>Send counteroffer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
