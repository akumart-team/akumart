import { Link } from "@tanstack/react-router";
import { MapPin, BadgeCheck, Bookmark, BookmarkCheck } from "lucide-react";
import type { Listing } from "@/lib/types";
import { img } from "@/lib/images";
import { naira } from "@/lib/format";
import { useMe } from "@/lib/store";
import { toggleSaved } from "@/lib/actions";
import { useRouter } from "@tanstack/react-router";

export function VerifiedBadge({ type }: { type: "individual" | "business" | null }) {
  if (!type) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
      <BadgeCheck className="size-3.5" /> Verified {type === "business" ? "Business" : "Individual"}
    </span>
  );
}

export function ListingCard({ l }: { l: Listing }) {
  const me = useMe();
  const router = useRouter();
  const saved = me?.saved.includes(l.id);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lift">
      <Link to="/marketplace/$id" params={{ id: l.id }} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        <img src={img(l.image)} alt={l.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold capitalize text-forest">{l.material}</span>
      </Link>
      <button
        aria-label={saved ? "Remove from saved" : "Save listing"}
        onClick={() => (me ? toggleSaved(l.id) : router.navigate({ to: "/login", search: { redirect: "/marketplace" } }))}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-forest hover:bg-background"
      >
        {saved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to="/marketplace/$id" params={{ id: l.id }} className="font-display text-lg font-semibold leading-snug hover:text-primary">
          {l.title}
        </Link>
        <p className="text-sm text-muted-foreground">
          {l.grade} · {l.condition}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="font-display text-xl font-bold text-forest">
              {naira(l.price)}
              <span className="text-sm font-normal text-muted-foreground">/{l.unit}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {l.qty.toLocaleString()} {l.unit} available · min {l.minOrder}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {l.area}, {l.city}
          </span>
        </div>
        <div className="flex items-center justify-between border-t pt-3 text-xs">
          <span className="truncate text-muted-foreground">{l.sellerName}</span>
          <VerifiedBadge type={l.sellerBadge} />
        </div>
      </div>
    </article>
  );
}
