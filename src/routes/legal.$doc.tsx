import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { PublicShell } from "@/components/site-chrome";
import { TERMS_VERSION } from "@/lib/seed";

const DOCS: Record<string, { title: string; sections: [string, string][] }> = {
  terms: {
    title: "Terms & Conditions",
    sections: [
      ["1. Accounts", "One AkuMart account gives access to the Marketplace and AkuBin. You must provide accurate basic information and accept these Terms and our Privacy Policy."],
      ["2. Marketplace roles", "Users may act as buyers, sellers, or both. Permissions depend on verification status and role."],
      ["3. Verification", "Basic Marketplace verification is required before submitting or responding to offers or publishing listings. Full applicable verification is required before payment and payout. Verification is not required for AkuBin recycling."],
      ["4. Restricted materials", "Hazardous, medical, radioactive, explosive and illegally obtained materials may not be listed. AkuMart may remove listings and suspend accounts."],
      ["5. Payments & settlement", "Payments are collected and conditionally settled by a licensed third-party payment provider. AkuMart does not take custody of customer funds and does not represent the arrangement as legally guaranteed escrow."],
      ["6. Fees", "Provisional fees are deducted from seller waste proceeds and from logistics delivery fees. Rates are configurable and will be published before they apply."],
      ["7. Disputes & refunds", "Buyers may raise a dispute with evidence before the inspection deadline. AkuMart reviews and may recommend refund, adjustment or closure, executed by the provider."],
      ["8. Logistics", "Logistics partners are independent businesses subject to approval, and are responsible for safe handling and transport."],
      ["9. AkuBin points & rewards", "Points are credited only for verified deposits, have no cash value until redeemed under current rules, and may be subject to eligibility checks."],
      ["10. Advertising & AI support", "Sponsored content is always labelled. The support assistant gives general guidance and is not professional advice."],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      ["Data we collect", "Basic account details at signup; verification data only when you choose to trade; deposit and reward activity for AkuBin."],
      ["How we use it", "To operate the services, prevent fraud, meet legal obligations and personalise your feed."],
      ["Sharing", "With verification and payment providers, logistics partners for assigned jobs, and authorities where legally required. Registered business addresses are not shown publicly."],
      ["Retention & rights", "Data is kept only as long as needed. You may request access, correction or deletion under applicable Nigerian data-protection law."],
      ["Consent records", "We record which version of the Terms and Privacy Policy you accepted and when."],
    ],
  },
  cookies: {
    title: "Cookie Policy",
    sections: [
      ["Essential storage", "This prototype stores demo data in your browser’s local storage so your session persists. No tracking cookies are set."],
      ["Analytics & advertising", "Any future analytics or advertising cookies will be described here and require consent where applicable."],
    ],
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    sections: [
      ["Honest listings", "Describe materials, grade and quantity accurately. Do not list prohibited or hazardous materials."],
      ["Fair dealing", "Do not attempt to bypass verification, manipulate offers or move transactions off-platform to avoid fees."],
      ["AkuBin", "Do not deposit non-accepted items, tamper with bins, or reuse another person’s bin session."],
      ["Respect", "Abuse of other users, partners or staff may lead to suspension."],
    ],
  },
};

export const Route = createFileRoute("/legal/$doc")({
  loader: ({ params }) => {
    if (!DOCS[params.doc]) throw notFound();
    return { title: DOCS[params.doc].title };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Legal"} (draft) — AkuMart` },
      { name: "description", content: `AkuMart ${loaderData?.title ?? "legal policy"} — draft pending legal review.` },
      { property: "og:title", content: `${loaderData?.title ?? "Legal"} — AkuMart` },
      { property: "og:description", content: "Draft policy pending professional legal review." },
    ],
  }),
  component: Legal,
});

function Legal() {
  const { doc } = Route.useParams();
  const d = DOCS[doc];
  return (
    <PublicShell>
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-wrap gap-2 text-sm lg:flex-col">
          {Object.entries(DOCS).map(([k, v]) => (
            <Link key={k} to="/legal/$doc" params={{ doc: k }} className={k === doc ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}>
              {v.title}
            </Link>
          ))}
        </nav>
        <article className="max-w-3xl">
          <div className="mb-8 flex gap-3 rounded-2xl border border-warning/50 bg-warning/15 p-4 text-sm text-warning-foreground">
            <AlertTriangle className="size-5 shrink-0" />
            <p>
              <strong>Draft for legal review.</strong> This document is a prototype placeholder ({TERMS_VERSION}) and is not approved legal advice or a final policy.
            </p>
          </div>
          <h1 className="text-display text-4xl md:text-5xl">{d.title}</h1>
          <div className="mt-10 space-y-8">
            {d.sections.map(([h, b]) => (
              <section key={h}>
                <h2 className="font-display text-xl font-semibold">{h}</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{b}</p>
              </section>
            ))}
          </div>
        </article>
      </div>
    </PublicShell>
  );
}
