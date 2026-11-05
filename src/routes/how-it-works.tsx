import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, PageHero } from "@/components/site-chrome";
import { HowItWorks } from "@/components/how-it-works";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How AkuMart works, Marketplace and AkuBin" },
      { name: "description", content: "Step-by-step: trading recyclables on the Marketplace and earning rewards at AkuBin smart bins." },
      { property: "og:title", content: "How AkuMart works" },
      { property: "og:description", content: "Join, list, agree, deliver, complete, or find, scan, deposit, earn, redeem." },
    ],
  }),
  component: Page,
});

const RULES = [
  { t: "Basic signup only", d: "Name, email, password, optional phone, and acceptance of our Terms. No ID or CAC at signup." },
  { t: "Verification when you trade", d: "Basic verification before offers or publishing listings; full verification before payment or payout." },
  { t: "AkuBin needs no trading checks", d: "Recycling and earning points never require Marketplace verification." },
  { t: "Provider-held payments", d: "A licensed third-party provider collects and conditionally settles funds. AkuMart never holds your money." },
  { t: "Transparent fees", d: "Provisional 5% from seller proceeds and 3% from the logistics fee. No buyer surcharge." },
];

function Page() {
  return (
    <PublicShell>
      <PageHero eyebrow="How it works" title="Two services, one account." intro="Pick a journey below and tap through each step." />
      <section className="container-page py-16">
        <HowItWorks />
      </section>
      <section className="container-page grid gap-10 pb-24 lg:grid-cols-[1fr_1.6fr]">
        <h2 className="text-display text-3xl md:text-4xl">The ground rules</h2>
        <ul className="divide-y rounded-3xl border">
          {RULES.map((r, i) => (
            <li key={r.t} className="flex gap-5 p-6">
              <span className="font-display text-2xl font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="font-display text-lg font-semibold">{r.t}</p>
                <p className="mt-1 text-muted-foreground">{r.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="container-page flex flex-wrap gap-3 pb-24">
        <Button asChild size="lg">
          <Link to="/signup">Get Started</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/faq">Read FAQs</Link>
        </Button>
      </section>
    </PublicShell>
  );
}
