import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ExternalLink, Megaphone, ShieldCheck } from "lucide-react";
import { PageTitle, Empty } from "@/components/app-ui";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { useDB, useMe } from "@/lib/store";
import { img } from "@/lib/images";
import { naira, day } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DemoTag } from "@/components/brand";

export const Route = createFileRoute("/app/marketplace")({
  component: ForYou,
});

const TABS = ["For You", "Listings", "Buyer requests", "Articles", "News", "Sponsored"] as const;

function ForYou() {
  const me = useMe()!;
  const db = useDB((d) => d);
  const [tab, setTab] = useState<(typeof TABS)[number]>("For You");
  const interests = me.prefs.interests;
  const seen = new Set(me.saved);
  const score = (m: string, city?: string) => (interests.includes(m as never) ? 3 : 0) + (city && city === me.city ? 1 : 0);
  const listings = db.listings.filter((l) => l.status === "published" && l.sellerId !== me.id).sort((a, b) => score(b.material, b.city) + (seen.has(b.id) ? 1 : 0) - (score(a.material, a.city) + (seen.has(a.id) ? 1 : 0)));
  const requests = db.requests.filter((r) => r.buyerId !== me.id);
  const articles = db.articles.filter((a) => a.status === "published");
  const news = db.news.filter((n) => n.status === "approved");
  const ads = db.campaigns.filter((c) => c.status === "approved" && (c.materials.length === 0 || interests.length === 0 || c.materials.some((m) => interests.includes(m))));
  const v = me.verification;

  return (
    <div>
      <PageTitle
        eyebrow="Marketplace"
        title={`Hello, ${me.name.split(" ")[0]}`}
        intro={interests.length ? `Personalised for ${interests.join(", ")} (simulated ranking).` : "Add material interests in Settings to personalise this feed."}
        actions={
          <Button asChild>
            <Link to="/app/listings/new">
              <Plus /> New listing
            </Link>
          </Button>
        }
      />
      {v.basic !== "approved" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6 text-primary" />
            <p className="text-sm">
              <strong>Browse freely.</strong> You’ll be asked to verify only when you make an offer, list, or pay.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/verification">Verify now</Link>
          </Button>
        </div>
      )}
      <div role="tablist" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium", tab === t ? "border-forest bg-forest text-forest-foreground" : "bg-card hover:bg-secondary")}>
            {t}
          </button>
        ))}
      </div>

      {(tab === "For You" || tab === "Listings") && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {tab === "For You" && ads[0] && <AdCard c={ads[0]} />}
          {listings.slice(0, tab === "For You" ? 5 : 100).map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
          {tab === "For You" && requests[0] && <RequestCard r={requests[0]} />}
          {tab === "For You" && articles[0] && <ArticleCard a={articles[0]} />}
        </div>
      )}
      {tab === "Buyer requests" && (requests.length ? <div className="grid gap-4 md:grid-cols-2">{requests.map((r) => <RequestCard key={r.id} r={r} />)}</div> : <Empty title="No buyer requests yet" />)}
      {tab === "Articles" && <div className="grid gap-6 md:grid-cols-3">{articles.map((a) => <ArticleCard key={a.id} a={a} />)}</div>}
      {tab === "News" &&
        (news.length ? (
          <div className="space-y-3">
            {news.map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-5">
                <div>
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {n.source} · Editor approved · {day(n.at)}
                  </p>
                </div>
                <DemoTag>Demo news</DemoTag>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No approved news yet" body="External news appears here only after an editor approves it." />
        ))}
      {tab === "Sponsored" && (ads.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{ads.map((c) => <AdCard key={c.id} c={c} />)}</div> : <Empty title="No sponsored posts" />)}
    </div>
  );
}

function AdCard({ c }: { c: { id: string; title: string; body: string; advertiser: string; image: string; url: string } }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border-2 border-lime bg-card">
      <img src={img(c.image)} alt="" className="aspect-[4/3] w-full object-cover" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-lime-foreground">
          <Megaphone className="size-3" /> Sponsored
        </span>
        <p className="font-display text-lg font-semibold">{c.title}</p>
        <p className="text-sm text-muted-foreground">{c.body}</p>
        <a href={c.url} target="_blank" rel="noreferrer sponsored" className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
          {c.advertiser} <ExternalLink className="size-3.5" />
        </a>
      </div>
    </article>
  );
}

function RequestCard({ r }: { r: { id: string; title: string; buyerName: string; qty: number; unit: string; maxPrice: number; city: string; material: string; responses: unknown[] } }) {
  return (
    <article className="flex flex-col rounded-2xl border bg-secondary p-5">
      <span className="eyebrow text-primary">Buyer request · {r.material}</span>
      <p className="mt-2 font-display text-lg font-semibold">{r.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {r.qty.toLocaleString()} {r.unit} · up to {naira(r.maxPrice)}/{r.unit === "tonne" ? "kg" : r.unit} · {r.city}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {r.buyerName} · {r.responses.length} response(s)
      </p>
      <Button asChild size="sm" variant="forest" className="mt-4 self-start">
        <Link to="/app/requests">Respond</Link>
      </Button>
    </article>
  );
}

function ArticleCard({ a }: { a: { slug: string; title: string; image: string; category: string } }) {
  return (
    <Link to="/articles/$slug" params={{ slug: a.slug }} className="group overflow-hidden rounded-2xl border bg-card">
      <img src={img(a.image)} alt="" className="aspect-[16/10] w-full object-cover" />
      <div className="p-4">
        <p className="eyebrow text-primary">Article · {a.category}</p>
        <p className="mt-2 font-display text-lg font-semibold group-hover:text-primary">{a.title}</p>
      </div>
    </Link>
  );
}
