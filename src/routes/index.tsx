import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Handshake, Truck, Sparkles, Gift, Leaf, Coins, Factory, Users } from "lucide-react";
import { PublicShell } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { HowItWorks } from "@/components/how-it-works";
import { useDB } from "@/lib/store";
import { img, yard, kiosk, plastic, materials, truck } from "@/lib/images";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AkuMart — Turning Waste into Opportunity" },
      { name: "description", content: "Trade recyclable materials with verified Nigerian buyers and sellers, or recycle at an AkuBin and earn rewards." },
      { property: "og:title", content: "AkuMart — Turning Waste into Opportunity" },
      { property: "og:description", content: "Nigeria’s recyclable-waste marketplace and AkuBin smart-bin rewards. Waste Today. Resource Tomorrow." },
    ],
  }),
  component: Home,
});

function Home() {
  const articles = useDB((d) => d.articles.filter((a) => a.status === "published").slice(0, 3));
  return (
    <PublicShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-forest-gradient text-forest-foreground">
        <div className="grain absolute inset-0 opacity-60" aria-hidden />
        <div className="container-page relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="eyebrow mb-6 text-lime">Waste Today. Resource Tomorrow.</p>
            <h1 className="text-display text-5xl md:text-7xl">
              Turning Waste
              <br />
              into <span className="text-lime">Opportunity.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-forest-foreground/75">
              A marketplace where verified businesses and individuals trade recyclable materials — and AkuBin, smart bins that reward everyday recycling. One account, two ways to turn waste into value.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="lime">
                <Link to="/marketplace">
                  Explore Marketplace <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="glass">
                <Link to="/akubin">Discover AkuBin</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-[2rem] shadow-lift">
              <img src={yard} alt="Sorted plastic bales at a Nigerian recycling yard" width={1600} height={1104} className="aspect-[4/3.4] w-full object-cover" />
            </div>
            <div className="absolute -bottom-8 -left-6 hidden w-44 overflow-hidden rounded-3xl border-4 border-forest shadow-lift sm:block md:w-52">
              <img src={kiosk} alt="Person recycling a bottle at an AkuBin smart bin" loading="lazy" className="aspect-[3/4] w-full object-cover" />
            </div>
            <div className="absolute -right-3 top-6 hidden rounded-2xl bg-lime px-4 py-3 text-lime-foreground shadow-lift md:block">
              <p className="eyebrow">Two services</p>
              <p className="font-display text-lg font-bold">Trade · Recycle</p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="container-page grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
        <img src={materials} alt="Sorted plastic, metal, glass, cardboard and paper" loading="lazy" width={1600} height={1008} className="aspect-[16/11] w-full rounded-[2rem] object-cover" />
        <div>
          <p className="eyebrow text-primary">About AkuMart</p>
          <h2 className="text-display mt-3 text-4xl md:text-5xl">Recyclables are resources hiding in plain sight.</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Too much valuable plastic, metal and paper ends up in drains and dumpsites because sellers can’t find trusted buyers, and households have no reason to sort. AkuMart connects the whole chain — from a single bottle to a truckload of bales.
          </p>
          <Button asChild variant="link" className="mt-4 px-0 text-base">
            <Link to="/about">
              Learn more about us <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* SERVICES */}
      <section className="container-page grid gap-6 pb-20 lg:grid-cols-2">
        <ServicePanel
          tone="light"
          eyebrow="Waste Marketplace"
          title="Buy and sell recyclables with confidence."
          verbs={["Discover", "List", "Negotiate", "Verify", "Deliver"]}
          image={plastic}
          to="/marketplace"
          cta="Explore Marketplace"
        />
        <ServicePanel
          tone="dark"
          eyebrow="AkuBin"
          title="Recycle at a smart bin. Earn real rewards."
          verbs={["Locate", "Identify", "Deposit", "Earn", "Redeem"]}
          image={kiosk}
          to="/akubin"
          cta="Discover AkuBin"
        />
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-mist py-20 md:py-28">
        <div className="container-page">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-primary">How it works</p>
              <h2 className="text-display mt-3 text-4xl md:text-5xl">Five steps, either way.</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/how-it-works">See the full journey</Link>
            </Button>
          </div>
          <HowItWorks />
        </div>
      </section>

      {/* WHY */}
      <section className="container-page py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow text-primary">Why AkuMart</p>
            <h2 className="text-display mt-3 text-4xl md:text-5xl">Built for trust at every step.</h2>
          </div>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {[
              { i: ShieldCheck, t: "Verified trading", d: "Identity or CAC checks before anyone makes an offer or gets paid." },
              { i: Handshake, t: "Structured offers", d: "Clear price, quantity and conditions — no messy back-and-forth chat." },
              { i: Truck, t: "Specialised logistics", d: "Every eligible partner on your route can quote. You choose." },
              { i: Sparkles, t: "Smarter discovery", d: "A For You feed shaped by your materials and activity." },
              { i: Gift, t: "Recycling rewards", d: "AkuBin points for verified deposits, no paperwork required." },
            ].map((r) => (
              <div key={r.t} className="flex gap-4">
                <r.i className="mt-1 size-6 shrink-0 text-primary" />
                <div>
                  <dt className="font-display text-lg font-semibold">{r.t}</dt>
                  <dd className="mt-1 text-muted-foreground">{r.d}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* IMPACT */}
      <section className="bg-lime-gradient">
        <div className="container-page grid gap-10 py-20 text-lime-foreground md:grid-cols-3">
          <div className="md:col-span-1">
            <p className="eyebrow">Expected impact</p>
            <h2 className="text-display mt-3 text-4xl">Cleaner streets. Fairer value.</h2>
          </div>
          {[
            { i: Leaf, t: "Environmental", d: "More materials recovered before they reach drains, landfills and waterways." },
            { i: Coins, t: "Economic", d: "Better price discovery and new income for collectors, aggregators and households." },
            { i: Factory, t: "Industrial", d: "A steadier, graded supply of feedstock for Nigerian recyclers and manufacturers." },
            { i: Users, t: "Community", d: "Everyday recycling habits, rewarded at the bin." },
          ].map((x) => (
            <div key={x.t} className="border-t border-lime-foreground/20 pt-5">
              <x.i className="size-6" />
              <h3 className="mt-3 font-display text-xl font-semibold">{x.t}</h3>
              <p className="mt-2 text-lime-foreground/75">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LOGISTICS */}
      <section className="container-page py-20 md:py-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-forest text-forest-foreground">
          <img src={truck} alt="Logistics truck loaded with recyclable bales" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="relative max-w-xl p-8 md:p-14">
            <p className="eyebrow text-lime">Logistics partners</p>
            <h2 className="text-display mt-3 text-4xl md:text-5xl">Get jobs that match your trucks.</h2>
            <p className="mt-4 text-forest-foreground/80">Approved partners are notified of every delivery on their routes, materials and capacity — then quote their own price.</p>
            <Button asChild variant="lime" size="lg" className="mt-8">
              <Link to="/contact" search={{ interest: "logistics" }}>
                Become a logistics partner <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section className="container-page pb-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-display text-3xl md:text-4xl">Knowledge & insights</h2>
          <Link to="/articles" className="text-sm font-semibold text-primary hover:underline">
            All articles →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} to="/articles/$slug" params={{ slug: a.slug }} className="group">
              <img src={img(a.image)} alt="" loading="lazy" className="aspect-[16/10] w-full rounded-2xl object-cover transition-opacity group-hover:opacity-90" />
              <p className="eyebrow mt-4 text-primary">{a.category}</p>
              <h3 className="mt-2 font-display text-xl font-semibold leading-snug group-hover:text-primary">{a.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-mist">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-16 md:flex-row md:items-center">
          <h2 className="text-display max-w-xl text-3xl md:text-4xl">Start trading or recycling today — it’s one account.</h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="forest">
              <Link to="/akubin">Find an AkuBin</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function ServicePanel({ tone, eyebrow, title, verbs, image, to, cta }: { tone: "light" | "dark"; eyebrow: string; title: string; verbs: string[]; image: string; to: "/marketplace" | "/akubin"; cta: string }) {
  const dark = tone === "dark";
  return (
    <div className={dark ? "overflow-hidden rounded-[2rem] bg-forest text-forest-foreground" : "overflow-hidden rounded-[2rem] bg-secondary text-forest"}>
      <div className="grid h-full sm:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col p-8 md:p-10">
          <p className={dark ? "eyebrow text-lime" : "eyebrow text-primary"}>{eyebrow}</p>
          <h3 className="text-display mt-3 text-3xl">{title}</h3>
          <ul className="mt-6 flex flex-wrap gap-2">
            {verbs.map((v) => (
              <li key={v} className={dark ? "rounded-full border border-forest-foreground/20 px-3 py-1 text-sm" : "rounded-full border border-forest/15 bg-background px-3 py-1 text-sm"}>
                {v}
              </li>
            ))}
          </ul>
          <Button asChild variant={dark ? "lime" : "default"} className="mt-auto self-start" style={{ marginTop: "2rem" }}>
            <Link to={to}>
              {cta} <ArrowRight />
            </Link>
          </Button>
        </div>
        <img src={image} alt="" loading="lazy" className="h-64 w-full object-cover sm:h-full" />
      </div>
    </div>
  );
}
