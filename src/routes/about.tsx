import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, PageHero } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { yard, kiosk, truck, plastic } from "@/lib/images";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About AkuMart — Our mission" },
      { name: "description", content: "Why AkuMart exists: connecting Nigeria’s recyclable-materials chain through a verified marketplace and AkuBin smart bins." },
      { property: "og:title", content: "About AkuMart" },
      { property: "og:description", content: "The problem, mission and vision behind AkuMart’s marketplace and AkuBin." },
    ],
  }),
  component: About,
});

const BLOCKS = [
  { eyebrow: "The problem", title: "Value is lost between the bin and the factory.", body: "Nigerian cities generate large volumes of recyclable plastic, metal, paper and glass. Much of it is never recovered: sellers struggle to reach trusted buyers, prices are opaque, transport is hard to arrange, and households have little incentive to separate waste.", img: yard },
  { eyebrow: "The marketplace", title: "Trusted trading for every size of seller.", body: "From informal collectors to registered recyclers, the AkuMart Marketplace lets verified traders list graded materials, exchange structured offers and complete payment through a licensed third-party provider — AkuMart never holds customer funds.", img: plastic },
  { eyebrow: "AkuBin", title: "Recycling that rewards people.", body: "AkuBin smart bins verify what you deposit and credit points you can redeem for airtime, cash above a minimum, or reward items. No business paperwork — just a basic account.", img: kiosk },
  { eyebrow: "Logistics", title: "Partners who move materials safely.", body: "Approved logistics partners are notified of jobs matching their service areas, materials and capacity, and compete on transparent quotes.", img: truck },
];

function About() {
  return (
    <PublicShell>
      <PageHero dark eyebrow="About AkuMart" title="We help Nigeria see waste as a resource." intro="Our mission is to make recovering recyclable materials simple, fair and rewarding — for businesses, collectors and households alike." />
      <section className="container-page space-y-24 py-20 md:py-28">
        {BLOCKS.map((b, i) => (
          <div key={b.title} className="grid items-center gap-10 lg:grid-cols-2">
            <img src={b.img} alt="" loading="lazy" className={`aspect-[16/11] w-full rounded-[2rem] object-cover ${i % 2 ? "lg:order-2" : ""}`} />
            <div>
              <p className="eyebrow text-primary">{b.eyebrow}</p>
              <h2 className="text-display mt-3 text-3xl md:text-4xl">{b.title}</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{b.body}</p>
            </div>
          </div>
        ))}
      </section>
      <section className="bg-mist">
        <div className="container-page grid gap-10 py-20 md:grid-cols-2">
          <div>
            <p className="eyebrow text-primary">Vision</p>
            <h2 className="text-display mt-3 text-3xl md:text-4xl">A circular economy that works for everyone.</h2>
          </div>
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>Economically, better price discovery and reliable logistics mean more income for the people who collect and sort. Environmentally, every recovered tonne is one less in drains and dumpsites.</p>
            <p>We don’t publish impact figures we can’t verify. As the service grows, we’ll report measured outcomes transparently.</p>
            <div className="flex flex-wrap gap-3 pt-4">
              <Button asChild>
                <Link to="/signup">Join AkuMart</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
