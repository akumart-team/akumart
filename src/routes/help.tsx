import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShoppingBag, Recycle, ShieldCheck, Truck, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PublicShell, PageHero } from "@/components/site-chrome";
import { FAQS } from "@/lib/faqs";
import { Field, inputCls } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createTicket } from "@/lib/actions";
import { useMe } from "@/lib/store";

export const Route = createFileRoute("/help")({
  validateSearch: (s: Record<string, unknown>): { report?: string } => ({ report: s.report ? String(s.report) : undefined }),
  head: () => ({
    meta: [
      { title: "Help Centre — AkuMart" },
      { name: "description", content: "Search help topics, browse guides and report an issue with AkuMart." },
      { property: "og:title", content: "AkuMart Help Centre" },
      { property: "og:description", content: "Get help with trading, recycling, verification and payments." },
    ],
  }),
  component: Help,
});

const TOPICS = [
  { i: ShoppingBag, t: "Buying & selling", to: "/marketplace" },
  { i: Recycle, t: "AkuBin & rewards", to: "/akubin" },
  { i: ShieldCheck, t: "Verification", to: "/faq" },
  { i: Truck, t: "Logistics", to: "/how-it-works" },
  { i: Wallet, t: "Payments & fees", to: "/faq" },
] as const;

function Help() {
  const { report } = Route.useSearch();
  const [q, setQ] = useState("");
  const me = useMe();
  const res = q.length > 1 ? FAQS.filter((f) => (f.q + f.a).toLowerCase().includes(q.toLowerCase())) : [];
  const [f, setF] = useState({ name: me?.name ?? "", email: me?.email ?? "", subject: "", message: "" });
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);
  return (
    <PublicShell>
      <PageHero eyebrow="Help Centre" title="Find answers fast.">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input aria-label="Search help" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search e.g. points, fees, CAC" className={inputCls + " h-14 rounded-full pl-12 text-base"} />
        </div>
      </PageHero>
      <section className="container-page py-14">
        {q.length > 1 && (
          <div className="mb-12 space-y-3">
            <p className="text-sm text-muted-foreground">{res.length} result(s)</p>
            {res.map((r) => (
              <div key={r.q} className="rounded-2xl border p-5">
                <p className="font-semibold">{r.q}</p>
                <p className="mt-1 text-muted-foreground">{r.a}</p>
              </div>
            ))}
            {!res.length && <p>No matches. Try the assistant (bottom-right) or report an issue below.</p>}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {TOPICS.map((t) => (
            <Link key={t.t} to={t.to} className="rounded-2xl border p-5 transition-colors hover:border-primary hover:bg-secondary">
              <t.i className="size-6 text-primary" />
              <p className="mt-3 font-semibold">{t.t}</p>
            </Link>
          ))}
        </div>
        <div id="report" className="mt-16 grid gap-10 rounded-3xl bg-mist p-6 md:p-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <AlertTriangle className="size-8 text-primary" />
            <h2 className="text-display mt-3 text-3xl">Report an issue</h2>
            <p className="mt-2 text-muted-foreground">Problems with a listing, bin, order or account. This creates a support ticket (simulated).</p>
            {report && <p className="mt-3 text-sm font-medium text-primary">You came here to report an issue — fill in the form.</p>}
          </div>
          {done ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-8 text-primary" /> Ticket {done} created.
            </div>
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!f.name || !/^\S+@\S+\.\S+$/.test(f.email) || f.message.length < 10) return setErr("Name, a valid email and a 10+ character description are required.");
                setErr("");
                setDone(createTicket({ userId: me?.id, name: f.name, email: f.email, subject: f.subject || "Issue report", message: f.message, channel: "report", priority: "high" }));
              }}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Field label="Name">
                <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              </Field>
              <Field label="Email">
                <input className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              </Field>
              <Field label="What’s affected?" className="sm:col-span-2">
                <input className={inputCls} placeholder="e.g. Listing L-1003, BIN-003, order…" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
              </Field>
              <Field label="Description" error={err} className="sm:col-span-2">
                <Textarea rows={4} className="rounded-xl bg-background" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
              </Field>
              <Button type="submit" className="sm:justify-self-start">
                Submit report
              </Button>
            </form>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
