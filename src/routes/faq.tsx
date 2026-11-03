import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, PageHero } from "@/components/site-chrome";
import { FAQS } from "@/lib/faqs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQs — AkuMart" },
      { name: "description", content: "Answers about AkuMart accounts, Marketplace verification, payments, fees, AkuBin points and logistics." },
      { property: "og:title", content: "AkuMart FAQs" },
      { property: "og:description", content: "Common questions about trading and recycling with AkuMart." },
    ],
  }),
  component: Faq,
});



function Faq() {
  const groups = Array.from(new Set(FAQS.map((f) => f.group)));
  return (
    <PublicShell>
      <PageHero eyebrow="Support" title="Frequently asked questions" />
      <section className="container-page grid gap-12 py-16 lg:grid-cols-[220px_1fr]">
        <nav className="hidden flex-col gap-2 text-sm lg:flex">
          {groups.map((g) => (
            <a key={g} href={`#${g}`} className="text-muted-foreground hover:text-primary">
              {g}
            </a>
          ))}
          <Link to="/help" className="mt-4 font-semibold text-primary">
            Help Centre →
          </Link>
        </nav>
        <div className="space-y-12">
          {groups.map((g) => (
            <div key={g} id={g}>
              <h2 className="text-display mb-4 text-2xl">{g}</h2>
              <Accordion type="single" collapsible className="rounded-2xl border px-5">
                {FAQS.filter((f) => f.group === g).map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
