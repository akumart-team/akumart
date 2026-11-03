import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Plus, X } from "lucide-react";
import { PublicShell } from "@/components/site-chrome";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/field";
import { useDB } from "@/lib/store";
import { MATERIALS, CITIES } from "@/lib/seed";
import { plastic } from "@/lib/images";
import { cn } from "@/lib/utils";
import { DemoTag } from "@/components/brand";
import type { Material } from "@/lib/types";

export const Route = createFileRoute("/marketplace/")({
  validateSearch: (s: Record<string, unknown>): { q?: string; material?: Material } => ({
    q: typeof s.q === "string" ? s.q : undefined,
    material: MATERIALS.some((m) => m.id === s.material) ? (s.material as Material) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Waste Marketplace — Buy & sell recyclables | AkuMart" },
      { name: "description", content: "Browse graded plastic, metal, glass, cardboard and paper from verified Nigerian sellers. Filter by city, price and quantity." },
      { property: "og:title", content: "AkuMart Waste Marketplace" },
      { property: "og:description", content: "Search recyclable materials from verified sellers across Nigeria." },
    ],
  }),
  component: Market,
});

function Market() {
  const search = Route.useSearch();
  const listings = useDB((d) => d.listings);
  const [q, setQ] = useState(search.q ?? "");
  const [mat, setMat] = useState<Material | "all">(search.material ?? "all");
  const [city, setCity] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [minQty, setMinQty] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    let r = listings.filter((l) => l.status === "published");
    if (q) r = r.filter((l) => (l.title + l.grade + l.city + l.area + l.material).toLowerCase().includes(q.toLowerCase()));
    if (mat !== "all") r = r.filter((l) => l.material === mat);
    if (city !== "all") r = r.filter((l) => l.city === city);
    if (maxPrice) r = r.filter((l) => l.price <= +maxPrice);
    if (minQty) r = r.filter((l) => l.qty >= +minQty);
    if (verifiedOnly) r = r.filter((l) => l.sellerBadge);
    if (delivery) r = r.filter((l) => l.fulfilment.includes("delivery"));
    const s = [...r];
    if (sort === "price_asc") s.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") s.sort((a, b) => b.price - a.price);
    if (sort === "qty") s.sort((a, b) => b.qty - a.qty);
    if (sort === "newest") s.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "popular") s.sort((a, b) => b.views - a.views);
    return s;
  }, [listings, q, mat, city, maxPrice, minQty, verifiedOnly, delivery, sort]);

  const reset = () => {
    setQ("");
    setMat("all");
    setCity("all");
    setMaxPrice("");
    setMinQty("");
    setVerifiedOnly(false);
    setDelivery(false);
  };

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-secondary">
        <img src={plastic} alt="" className="absolute right-0 top-0 hidden h-full w-[42%] object-cover lg:block" />
        <div className="container-page relative py-14 md:py-20">
          <div className="max-w-2xl lg:max-w-[52%]">
            <p className="eyebrow text-primary">Waste Marketplace</p>
            <h1 className="text-display mt-3 text-4xl text-forest md:text-6xl">Find the materials you need.</h1>
            <p className="mt-4 text-lg text-muted-foreground">Browse freely. Verification is only needed when you make an offer, list, or pay.</p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 flex gap-2 rounded-full border bg-background p-1.5 shadow-soft"
            >
              <Search className="ml-3 size-5 self-center text-muted-foreground" />
              <input aria-label="Search listings" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search PET, copper, Lagos…" className="flex-1 bg-transparent px-2 text-base outline-none" />
              <Button type="submit">Search</Button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="forest" size="sm">
                <Link to="/app/listings/new">
                  <Plus /> Sell your materials
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/app/requests">Post a buyer request</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {[{ id: "all" as const, label: "All materials" }, ...MATERIALS].map((m) => (
            <button key={m.id} onClick={() => setMat(m.id)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium", mat === m.id ? "border-forest bg-forest text-forest-foreground" : "hover:bg-secondary")}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className={cn("space-y-5 lg:block", showFilters ? "block" : "hidden")} aria-label="Filters">
            <div>
              <label className="text-sm font-medium">City</label>
              <select className={inputCls + " mt-1.5"} value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="all">All cities</option>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Max price (₦ per unit)</label>
              <input type="number" className={inputCls + " mt-1.5"} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Min quantity available</label>
              <input type="number" className={inputCls + " mt-1.5"} value={minQty} onChange={(e) => setMinQty(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="size-4 accent-[var(--primary)]" /> Verified sellers only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} className="size-4 accent-[var(--primary)]" /> Delivery available
            </label>
            <Button variant="ghost" size="sm" onClick={reset}>
              <X /> Clear filters
            </Button>
          </aside>
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{results.length}</strong> listings <DemoTag className="ml-2">Demo listings</DemoTag>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
                  <SlidersHorizontal /> Filters
                </Button>
                <select aria-label="Sort" className={inputCls + " h-9 w-auto"} value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="popular">Most viewed</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="qty">Largest quantity</option>
                </select>
              </div>
            </div>
            {results.length === 0 ? (
              <div className="rounded-3xl border border-dashed p-14 text-center">
                <p className="font-display text-xl font-semibold">No listings match your filters</p>
                <p className="mt-1 text-muted-foreground">Try widening your search, or post a buyer request so sellers can come to you.</p>
                <div className="mt-5 flex justify-center gap-2">
                  <Button variant="outline" onClick={reset}>
                    Clear filters
                  </Button>
                  <Button asChild>
                    <Link to="/app/requests">Post a request</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((l) => (
                  <ListingCard key={l.id} l={l} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
