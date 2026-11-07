import { Link } from "@tanstack/react-router";
import { Recycle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AkuBinPromo() {
  return (
    <section className="rounded-3xl bg-forest p-6 text-forest-foreground">
      <Recycle className="size-6 text-lime" />
      <p className="mt-3 font-display text-lg font-semibold">Recycle & Earn with AkuBin</p>
      <p className="mt-1 text-sm text-forest-foreground/75">Find nearby smart bins, recycle eligible materials and earn reward points.</p>
      <Button asChild size="sm" variant="secondary" className="mt-4">
        <Link to="/app/akubin">Explore AkuBin</Link>
      </Button>
    </section>
  );
}

export function MarketplacePromo() {
  return (
    <section className="rounded-3xl border bg-secondary p-6">
      <Store className="size-6 text-primary" />
      <p className="mt-3 font-display text-lg font-semibold">Explore AkuMart Marketplace</p>
      <p className="mt-1 text-sm text-muted-foreground">Discover recyclable materials, buy from verified sellers or list materials for sale.</p>
      <Button asChild size="sm" className="mt-4">
        <Link to="/app/marketplace">Open Marketplace</Link>
      </Button>
    </section>
  );
}
