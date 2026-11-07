import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Star } from "lucide-react";
import { PageTitle, Panel, Stat } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { AkuBinPromo } from "@/components/promo-cards";
import { useDB, useMe } from "@/lib/store";
import { sellerRating, checkoutSplit } from "@/lib/rules";
import { naira } from "@/lib/format";
import { activeMode } from "@/lib/after-auth";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | AkuMart" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const me = useMe()!;
  return activeMode(me) === "seller" ? <SellerDash /> : <BuyerDash />;
}

function OrderList({ orders, empty, seller }: { orders: { id: string; title: string; status: string; qty: number; unit: string; unitPrice: number; created?: string }[]; empty: string; seller?: boolean }) {
  if (!orders.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y">
      {orders.slice(0, 6).map((o) => (
        <li key={o.id}>
          <Link to="/app/orders/$id" params={{ id: o.id }} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary">
            <div>
              <p className="font-medium">{o.title}</p>
              <p className="text-xs text-muted-foreground">
                {o.qty} {o.unit} · {naira(o.qty * o.unitPrice)}
                {seller ? " gross" : ""}
              </p>
            </div>
            <StatusChip status={o.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BuyerDash() {
  const me = useMe()!;
  const orders = useDB((d) => d.orders.filter((o) => o.buyerId === me.id));
  const offers = useDB((d) => d.offers.filter((o) => o.buyerId === me.id));
  const saved = me.saved.length;
  const done = orders.filter((o) => o.status === "completed");
  const inTransit = orders.filter((o) => ["assigned", "picked_up", "in_transit", "proof_uploaded", "delivered"].includes(o.status));
  const spent = done.reduce((s, o) => s + o.qty * o.unitPrice, 0);
  return (
    <div>
      <PageTitle
        eyebrow="Buyer Dashboard"
        title={`Welcome, ${me.name.split(" ")[0]}`}
        intro="Your purchases, offers and deliveries at a glance."
        actions={
          <Button asChild>
            <Link to="/app/marketplace">
              <Search /> Find materials
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat dark label="Completed purchases" value={done.length} />
        <Stat label="Total spent on materials" value={naira(spent)} />
        <Stat label="Open offers" value={offers.filter((o) => o.status.startsWith("awaiting")).length} />
        <Stat label="Deliveries in progress" value={inTransit.length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Purchase history" action={<Link to="/app/orders" className="text-sm font-semibold text-primary">All purchases →</Link>}>
            <OrderList orders={orders} empty="No purchases yet. Make an offer on a listing to get started." />
          </Panel>
          <Panel title="Delivery tracking">
            <OrderList orders={inTransit} empty="No deliveries in progress." />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Quick links">
            <div className="grid gap-2">
              {[["/app/offers", "My Offers"], ["/app/requests", "My Buyer Requests"], ["/app/saved", `Saved listings (${saved})`], ["/app/notifications", "Notifications"]].map(([to, l]) => (
                <Button key={to} asChild variant="outline" className="justify-start">
                  <Link to={to as "/app"}>{l}</Link>
                </Button>
              ))}
            </div>
          </Panel>
          <AkuBinPromo />
        </div>
      </div>
    </div>
  );
}

function SellerDash() {
  const me = useMe()!;
  const allOrders = useDB((d) => d.orders);
  const settings = useDB((d) => d.settings);
  const orders = allOrders.filter((o) => o.sellerId === me.id);
  const listings = useDB((d) => d.listings.filter((l) => l.sellerId === me.id));
  const offers = useDB((d) => d.offers.filter((o) => o.sellerId === me.id));
  const rating = sellerRating(allOrders, me.id);
  const done = orders.filter((o) => o.status === "completed");
  const earnings = done.reduce((s, o) => s + checkoutSplit(o.qty * o.unitPrice, 0, settings).sellerPayout, 0);
  const incoming = offers.filter((o) => o.status === "awaiting_seller");
  return (
    <div>
      <PageTitle
        eyebrow="Seller Dashboard"
        title={`Welcome, ${me.name.split(" ")[0]}`}
        intro="Your listings, offers, sales and earnings."
        actions={
          <Button asChild>
            <Link to="/app/listings/new">
              <Plus /> Create listing
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat dark label="Earnings after commission" value={naira(earnings)} hint="From completed sales" />
        <Stat label="Active listings" value={listings.filter((l) => l.status === "published").length} />
        <Stat label="Offers awaiting you" value={incoming.length} />
        <Stat label="Your rating" value={rating ? `${rating.avg} ★` : "New seller"} hint={rating ? `${rating.count} reviews` : undefined} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Recent offers" action={<Link to="/app/offers" className="text-sm font-semibold text-primary">Incoming offers →</Link>}>
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No offers yet.</p>
            ) : (
              <ul className="divide-y">
                {offers.slice(0, 5).map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                    <span className="font-medium">{(o as unknown as { title?: string }).title ?? o.listingId}</span>
                    <StatusChip status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Sales and fulfilment" action={<Link to="/app/orders" className="text-sm font-semibold text-primary">All sales →</Link>}>
            <OrderList orders={orders} empty="No sales yet." seller />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Earnings and payouts">
            <p className="text-sm text-muted-foreground">Payouts are released by the payment provider after the buyer confirms receipt.</p>
            <p className="mt-3 font-display text-2xl font-semibold">{naira(earnings)}</p>
          </Panel>
          {rating && (
            <Panel title="Ratings">
              <p className="flex items-center gap-2 text-sm">
                <Star className="size-4 fill-primary text-primary" /> {rating.avg} from {rating.count} reviews
              </p>
            </Panel>
          )}
          <Panel title="Quick links">
            <div className="grid gap-2">
              {[["/app/listings", "My Listings"], ["/app/requests", "Buyer requests"], ["/app/notifications", "Notifications"]].map(([to, l]) => (
                <Button key={to} asChild variant="outline" className="justify-start">
                  <Link to={to as "/app"}>{l}</Link>
                </Button>
              ))}
            </div>
          </Panel>
          <AkuBinPromo />
        </div>
      </div>
    </div>
  );
}
