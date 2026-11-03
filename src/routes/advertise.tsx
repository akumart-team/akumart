import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, CalendarRange, ShieldCheck, BarChart3 } from "lucide-react";
import { PublicShell, PageHero } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { AD_PACKAGES } from "@/lib/actions";
import { naira } from "@/lib/format";

export const Route = createFileRoute("/advertise")({
  head: () => ({
    meta: [
      { title: "Advertise with AkuMart" },
      { name: "description", content: "Reach recyclers, buyers and sellers with clearly labelled sponsored placements in the AkuMart feed." },
      { property: "og:title", content: "Advertise with AkuMart" },
      { property: "og:description", content: "Self-service sponsored campaigns targeted by location, material and role." },
    ],
  }),
  component: Advertise,
});

function Advertise() {
  return (
    <PublicShell>
      <PageHero dark eyebrow="Advertise" title="Reach the people who move materials." intro="Self-service sponsored posts in the For You feed, targeted by location, material interest and role. Every placement is clearly labelled and reviewed before it goes live.">
        <Button asChild size="lg" variant="lime">
          <Link to="/app/advertise">Create a campaign</Link>
        </Button>
      </PageHero>
      <section className="container-page grid gap-8 py-20 md:grid-cols-4">
        {[
          { i: Target, t: "Targeting", d: "City, material interests and buyer/seller role." },
          { i: CalendarRange, t: "Fixed packages", d: "7, 14 or 30 days." },
          { i: ShieldCheck, t: "Reviewed", d: "Admin approval before any placement appears." },
          { i: BarChart3, t: "Metrics", d: "Impressions and clicks (simulated in prototype)." },
        ].map((x) => (
          <div key={x.t}>
            <x.i className="size-7 text-primary" />
            <h3 className="mt-3 font-display text-xl font-semibold">{x.t}</h3>
            <p className="mt-1 text-muted-foreground">{x.d}</p>
          </div>
        ))}
      </section>
      <section className="container-page pb-24">
        <h2 className="text-display mb-6 text-3xl">Packages <span className="text-base font-normal text-muted-foreground">(demo pricing, to be confirmed)</span></h2>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(AD_PACKAGES).map(([k, v]) => (
            <div key={k} className="rounded-3xl border p-8">
              <p className="eyebrow text-primary">{k.replace("d", " days")}</p>
              <p className="text-display mt-3 text-4xl">{naira(v)}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
