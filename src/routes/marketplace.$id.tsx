import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Package, Scale, Truck, Share2, Bookmark, BookmarkCheck, Flag, Lock, ShoppingCart, HandCoins } from "lucide-react";
import { toast } from "sonner";
import { PublicShell } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { VerifiedBadge, ListingCard } from "@/components/listing-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Field, inputCls, Chips } from "@/components/field";
import { useDB, useMe, useHydratedFlag } from "@/lib/store";
import { makeOffer, respondOffer, toggleSaved, flagListing } from "@/lib/actions";
import { useTradeGate } from "@/components/gate";
import { img } from "@/lib/images";
import { naira } from "@/lib/format";
import { CONDITIONS } from "@/lib/seed";
import { sellerRating } from "@/lib/rules";

export const Route = createFileRoute("/marketplace/$id")({
  validateSearch: (s: Record<string, unknown>): { action?: "offer" | "buy" } => ({ action: s.action === "offer" || s.action === "buy" ? s.action : undefined }),
  head: () => ({
    meta: [
      { title: "Listing | AkuMart Marketplace" },
      { name: "description", content: "View this recyclable-materials listing on AkuMart." },
      { property: "og:title", content: "AkuMart listing" },
      { property: "og:description", content: "Recyclable materials for sale on the AkuMart Marketplace." },
    ],
  }),
  component: ListingPage,
});


function ListingPage() {
  const { id } = Route.useParams();
  const { action } = Route.useSearch();
  const l = useDB((d) => d.listings.find((x) => x.id === id));
  const related = useDB((d) => d.listings.filter((x) => x.id !== id && x.material === l?.material && x.status === "published").slice(0, 3));
  const me = useMe();
  const hydrated = useHydratedFlag();
  const router = useRouter();
  const gate = useTradeGate();
  const [offerOpen, setOfferOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  // Resume a preserved intent (?action=offer|buy), it still passes through the verification gate.
  useEffect(() => {
    if (!hydrated || !l || !action) return;
    const base0 = `/marketplace/${l.id}`;
    if (action === "offer") gate({ path: `${base0}?action=offer`, label: "Make an offer", level: "basic" }, () => setOfferOpen(true));
    if (action === "buy") gate({ path: `${base0}?action=buy`, label: "Proceed to purchase", level: "full" }, () => setBuyOpen(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, action, l?.id]);
  const [price, setPrice] = useState(l ? String(l.price) : "");
  const [qty, setQty] = useState(l ? String(l.minOrder) : "");
  const [conds, setConds] = useState<string[]>([]);
  const [err, setErr] = useState("");

  if (!l)
    return (
      <PublicShell>
        <div className="container-page py-32 text-center">
          <h1 className="text-display text-4xl">Listing not found</h1>
          <p className="mt-2 text-muted-foreground">It may have been sold or removed.</p>
          <Button asChild className="mt-6">
            <Link to="/marketplace">Back to Marketplace</Link>
          </Button>
        </div>
      </PublicShell>
    );

  const mine = me?.id === l.sellerId;
  const saved = me?.saved.includes(l.id);
  const base = `/marketplace/${l.id}`;
  const unavailable = l.status !== "published";

  const validate = () => {
    const q = +qty;
    if (!(+price > 0)) return "Enter a valid price";
    if (!(q > 0)) return "Enter a quantity";
    if (q > l.qty) return `Only ${l.qty} ${l.unit} available`;
    if (q < l.minOrder) return `Minimum order is ${l.minOrder} ${l.unit}`;
    if (!l.partial && q !== l.qty) return "This seller only sells the full quantity";
    return "";
  };

  return (
    <PublicShell>
      <div className="container-page py-10">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/marketplace" className="hover:text-primary">
            Marketplace
          </Link>{" "}
          / <span className="capitalize">{l.material}</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <img src={img(l.image)} alt={l.title} className="aspect-[4/3] w-full rounded-[2rem] object-cover" />
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { i: Package, k: "Condition", v: l.condition },
                { i: Scale, k: "Available", v: `${l.qty.toLocaleString()} ${l.unit}` },
                { i: MapPin, k: "Pickup area", v: `${l.area}, ${l.city}` },
                { i: Truck, k: "Fulfilment", v: "AkuMart logistics partner delivery" },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl bg-muted p-4">
                  <x.i className="size-5 text-primary" />
                  <p className="mt-2 text-xs text-muted-foreground">{x.k}</p>
                  <p className="font-medium">{x.v}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold">About this material</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{l.description || `${l.grade}. Contact through structured offers only.`}</p>
              <p className="mt-4 text-sm text-muted-foreground">Exact pickup address is shared only with the assigned logistics partner, never with the buyer.</p>
            </div>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border p-6 shadow-soft md:p-8">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize text-forest">{l.material}</span>
              <h1 className="text-display mt-4 text-3xl">{l.title}</h1>
              <p className="mt-1 text-muted-foreground">{l.grade}</p>
              <p className="text-display mt-6 text-4xl text-forest">
                {naira(l.price)}
                <span className="text-lg font-normal text-muted-foreground"> / {l.unit}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Min order {l.minOrder} {l.unit} · {l.partial ? "Partial purchase allowed" : "Full quantity only"}
              </p>
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-muted p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Seller</p>
                  <p className="font-medium">{l.sellerName}</p>
                  <SellerStars sellerId={l.sellerId} />
                </div>
                <VerifiedBadge type={l.sellerBadge} />
              </div>
              {unavailable ? (
                <p className="mt-6 rounded-xl bg-muted p-4 text-sm">This listing is {l.status} and not available for trading.</p>
              ) : mine ? (
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-muted-foreground">This is your listing.</p>
                  <Button asChild className="w-full">
                    <Link to="/app/offers">View offers</Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-6 grid gap-2">
                  <Button size="lg" onClick={() => gate({ path: `${base}?action=offer`, label: "Make an offer", level: "basic" }, () => setOfferOpen(true))}>
                    <HandCoins /> Make an offer
                  </Button>
                  <Button size="lg" variant="forest" onClick={() => gate({ path: `${base}?action=buy`, label: "Proceed to purchase", level: "full" }, () => setBuyOpen(true))}>
                    <ShoppingCart /> Buy at asking price
                  </Button>
                  {hydrated && !me && (
                    <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                      <Lock className="size-3.5" /> Sign in to trade. You’ll come back to this listing.
                    </p>
                  )}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => (me ? toggleSaved(l.id) : router.navigate({ to: "/login", search: { redirect: base } }))}>
                  {saved ? <BookmarkCheck /> : <Bookmark />} {saved ? "Saved" : "Save"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.origin + base);
                    toast.success("Listing link copied");
                  }}
                >
                  <Share2 /> Share
                </Button>
                {me && !mine && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      flagListing(l.id, "Reported by user as inaccurate (demo)");
                      toast("Listing reported for moderation review");
                    }}
                  >
                    <Flag /> Report
                  </Button>
                )}
              </div>
            </div>
          </aside>
        </div>
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-display mb-6 text-2xl">Similar listings</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <ListingCard key={r.id} l={r} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={offerOpen && !!me} onOpenChange={setOfferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Make a structured offer</DialogTitle>
            <DialogDescription>Offers are structured, no free-form chat. The seller can accept, reject or counter.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Price (₦ per ${l.unit})`}>
              <input type="number" className={inputCls} value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <Field label={`Quantity (${l.unit})`}>
              <input type="number" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium">Conditions (optional)</p>
              <Chips options={CONDITIONS.map((c) => ({ id: c, label: c }))} value={conds} onChange={setConds} />
            </div>
          </div>
          <p className="rounded-xl bg-muted p-3 text-sm">
            Offer value: <strong>{naira(+price * +qty || 0)}</strong>
          </p>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <DialogFooter>
            <Button
              onClick={() => {
                const e = validate();
                if (e) return setErr(e);
                makeOffer(l.id, +price, +qty, conds);
                setOfferOpen(false);
                toast.success("Offer sent to seller");
                router.navigate({ to: "/app/offers" });
              }}
            >
              Send offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={buyOpen && !!me} onOpenChange={setBuyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Buy at asking price</DialogTitle>
            <DialogDescription>Creates an order at {naira(l.price)}/{l.unit}. You’ll propose a delivery fare to approved logistics partners next.</DialogDescription>
          </DialogHeader>
          <Field label={`Quantity (${l.unit})`} error={err}>
            <input type="number" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <p className="rounded-xl bg-muted p-3 text-sm">
            Waste value: <strong>{naira(l.price * +qty || 0)}</strong>
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                setPrice(String(l.price));
                const e = validate();
                if (e) return setErr(e);
                const oid = makeOffer(l.id, l.price, +qty, ["Buy at asking price"]);
                const orderId = respondOffer(oid, "seller", "accept");
                setBuyOpen(false);
                if (orderId) router.navigate({ to: "/app/orders/$id", params: { id: orderId } });
              }}
            >
              Continue to fulfilment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
}

function SellerStars({ sellerId }: { sellerId: string }) {
  const r = useDB((d) => sellerRating(d.orders, sellerId));
  return <p className="text-xs text-muted-foreground">{r ? `${r.avg} of 5 from ${r.count} verified review${r.count > 1 ? "s" : ""}` : "New seller"}</p>;
}
