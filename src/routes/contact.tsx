import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Mail, Truck, Briefcase, LifeBuoy } from "lucide-react";
import { PublicShell, PageHero } from "@/components/site-chrome";
import { Field, inputCls, Chips } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { update } from "@/lib/store";
import { createTicket } from "@/lib/actions";
import { uid, nowIso } from "@/lib/format";
import { MATERIALS, CITIES } from "@/lib/seed";
import { cn } from "@/lib/utils";

type Interest = "general" | "support" | "business" | "logistics";

export const Route = createFileRoute("/contact")({
  validateSearch: (s: Record<string, unknown>): { interest?: Interest } => ({
    interest: ["general", "support", "business", "logistics"].includes(s.interest as string) ? (s.interest as Interest) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Contact AkuMart — Support, partnerships & logistics" },
      { name: "description", content: "Send a general enquiry, get support, propose a partnership or apply as an AkuMart logistics partner." },
      { property: "og:title", content: "Contact AkuMart" },
      { property: "og:description", content: "Enquiries, support, partnerships and logistics partner applications." },
    ],
  }),
  component: Contact,
});

const TABS: { id: Interest; label: string; icon: typeof Mail }[] = [
  { id: "general", label: "General enquiry", icon: Mail },
  { id: "support", label: "Customer support", icon: LifeBuoy },
  { id: "business", label: "Business partnership", icon: Briefcase },
  { id: "logistics", label: "Logistics partner", icon: Truck },
];

const emailOk = (e: string) => /^\S+@\S+\.\S+$/.test(e);

function Contact() {
  const { interest } = Route.useSearch();
  const [tab, setTab] = useState<Interest>(interest ?? "general");
  const [done, setDone] = useState<string | null>(null);
  return (
    <PublicShell>
      <PageHero eyebrow="Contact us" title="How can we help?" intro="Choose a topic. We’ll route your message to the right team. (Prototype: submissions are simulated.)" />
      <section className="container-page grid gap-10 py-14 lg:grid-cols-[280px_1fr]">
        <div role="tablist" aria-label="Enquiry type" className="flex gap-2 overflow-x-auto lg:flex-col">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                setDone(null);
              }}
              className={cn("flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium", tab === t.id ? "border-primary bg-secondary text-forest" : "hover:bg-muted")}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </div>
        <div className="rounded-3xl border p-6 md:p-10">
          {done ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto size-12 text-primary" />
              <h2 className="text-display mt-4 text-3xl">Thanks — we’ve received it.</h2>
              <p className="mt-2 text-muted-foreground">Reference {done}. This is a simulated confirmation; no email has been sent.</p>
              <Button className="mt-6" variant="outline" onClick={() => setDone(null)}>
                Send another
              </Button>
            </div>
          ) : tab === "logistics" ? (
            <LogisticsForm onDone={setDone} />
          ) : (
            <GeneralForm kind={tab} onDone={setDone} />
          )}
        </div>
      </section>
    </PublicShell>
  );
}

function GeneralForm({ kind, onDone }: { kind: Interest; onDone: (r: string) => void }) {
  const [f, setF] = useState({ name: "", email: "", company: "", subject: "", message: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your name";
    if (!emailOk(f.email)) er.email = "Enter a valid email";
    if (f.message.trim().length < 10) er.message = "Tell us a little more (10+ characters)";
    if (kind === "business" && !f.company.trim()) er.company = "Company name is required";
    setErr(er);
    if (Object.keys(er).length) return;
    const ref = uid("ENQ");
    update((d) => d.enquiries.unshift({ id: ref, kind, name: f.name, email: f.email, data: f, at: nowIso() }));
    if (kind === "support") createTicket({ name: f.name, email: f.email, subject: f.subject || "Support request", message: f.message, channel: "contact", priority: "normal" });
    onDone(ref);
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      <Field label="Full name" error={err.name}>
        <input className={inputCls} value={f.name} onChange={set("name")} />
      </Field>
      <Field label="Email" error={err.email}>
        <input className={inputCls} type="email" value={f.email} onChange={set("email")} />
      </Field>
      {kind === "business" && (
        <Field label="Company" error={err.company} className="sm:col-span-2">
          <input className={inputCls} value={f.company} onChange={set("company")} />
        </Field>
      )}
      <Field label="Subject" className="sm:col-span-2">
        <input className={inputCls} value={f.subject} onChange={set("subject")} />
      </Field>
      <Field label="Message" error={err.message} className="sm:col-span-2">
        <Textarea rows={5} value={f.message} onChange={set("message")} className="rounded-xl" />
      </Field>
      <Button type="submit" size="lg" className="sm:col-span-2 sm:justify-self-start">
        Send message
      </Button>
    </form>
  );
}

function LogisticsForm({ onDone }: { onDone: (r: string) => void }) {
  const [f, setF] = useState({ business: "", contact: "", email: "", phone: "", base: "Lagos", vehicles: "", count: "", message: "" });
  const [areas, setAreas] = useState<string[]>([]);
  const [mats, setMats] = useState<string[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.business.trim()) er.business = "Required";
    if (!f.contact.trim()) er.contact = "Required";
    if (!emailOk(f.email)) er.email = "Enter a valid email";
    if (!/^\+?[\d\s-]{10,18}$/.test(f.phone)) er.phone = "Enter a valid Nigerian phone number";
    if (!areas.length) er.areas = "Choose at least one service area";
    if (!mats.length) er.mats = "Choose at least one waste category";
    if (!f.vehicles.trim()) er.vehicles = "Describe your vehicles";
    if (!(+f.count > 0)) er.count = "Enter how many vehicles";
    setErr(er);
    if (Object.keys(er).length) return;
    const ref = uid("LOG");
    update((d) => d.enquiries.unshift({ id: ref, kind: "logistics", name: f.contact, email: f.email, data: { ...f, areas: areas.join(", "), materials: mats.join(", ") }, at: nowIso() }));
    onDone(ref);
  };
  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <h2 className="text-display text-2xl">Become a logistics partner</h2>
        <p className="mt-1 text-sm text-muted-foreground">Start with the basics. Document and vehicle verification happens later in the partner portal.</p>
      </div>
      <Field label="Business name" error={err.business}>
        <input className={inputCls} value={f.business} onChange={set("business")} />
      </Field>
      <Field label="Contact name" error={err.contact}>
        <input className={inputCls} value={f.contact} onChange={set("contact")} />
      </Field>
      <Field label="Email" error={err.email}>
        <input className={inputCls} type="email" value={f.email} onChange={set("email")} />
      </Field>
      <Field label="Phone" error={err.phone}>
        <input className={inputCls} value={f.phone} onChange={set("phone")} placeholder="+234 803 000 0000" />
      </Field>
      <Field label="Base location">
        <select className={inputCls} value={f.base} onChange={set("base")}>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Number of vehicles" error={err.count}>
        <input className={inputCls} type="number" min={1} value={f.count} onChange={set("count")} />
      </Field>
      <Field label="Service areas" error={err.areas} className="sm:col-span-2">
        <Chips options={CITIES.map((c) => ({ id: c, label: c }))} value={areas} onChange={setAreas} />
      </Field>
      <Field label="Waste categories handled" error={err.mats} className="sm:col-span-2">
        <Chips options={MATERIALS.map((m) => ({ id: m.id, label: m.label }))} value={mats} onChange={setMats} />
      </Field>
      <Field label="Vehicle types" error={err.vehicles} className="sm:col-span-2">
        <input className={inputCls} value={f.vehicles} onChange={set("vehicles")} placeholder="e.g. 2 × 10-tonne flatbeds, 1 box van" />
      </Field>
      <Field label="Message" className="sm:col-span-2">
        <Textarea rows={4} value={f.message} onChange={set("message")} className="rounded-xl" />
      </Field>
      <Button type="submit" size="lg" className="sm:col-span-2 sm:justify-self-start">
        Submit application
      </Button>
    </form>
  );
}
