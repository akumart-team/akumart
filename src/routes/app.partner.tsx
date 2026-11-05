import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, Loader2, MapPin, Upload, FileCheck2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, Panel, Stat, Empty, Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Field, inputCls, Chips } from "@/components/field";
import { Button } from "@/components/ui/button";
import { useDB, useMe, update } from "@/lib/store";
import { applyPartner, submitQuote, advanceOrder } from "@/lib/actions";
import { checkoutSplit, orderKg } from "@/lib/rules";
import { MATERIALS, CITIES } from "@/lib/seed";
import { naira, dt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/types";

export const Route = createFileRoute("/app/partner")({
  component: PartnerPortal,
});

function PartnerPortal() {
  const me = useMe()!;
  const partner = useDB((d) => d.partners.find((p) => p.ownerId === me.id));
  if (!partner) return <Apply />;
  if (partner.status !== "approved")
    return (
      <div className="max-w-2xl">
        <PageTitle eyebrow="Logistics partner" title={partner.business} />
        <Panel>
          <div className="flex items-center gap-3">
            {partner.status === "pending" ? <Loader2 className="size-7 animate-spin text-primary" /> : <XCircle className="size-7 text-destructive" />}
            <div>
              <p className="font-display text-xl font-semibold">Application {partner.status}</p>
              <p className="text-sm text-muted-foreground">
                {partner.status === "pending" ? "Our operations team is reviewing your documents. You can’t receive jobs until approved." : partner.reason ?? "Contact support for details."}
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-xl border border-dashed border-warning bg-warning/10 p-3 text-xs">Demo: approve this application from the internal admin console (Operations → Partners).</p>
        </Panel>
      </div>
    );
  return <Dashboard partnerId={partner.id} />;
}

function Apply() {
  const me = useMe()!;
  const [f, setF] = useState({ business: "", contact: me.name, email: me.email, phone: me.phone ?? "", base: "Lagos", vehicles: "", vehicleCount: "", capacityKg: "" });
  const [areas, setAreas] = useState<string[]>([]);
  const [mats, setMats] = useState<Material[]>([]);
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const DOCS = ["CAC certificate", "Director/owner ID", "Vehicle registration", "Goods-in-transit insurance"];
  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow="Logistics partner" title="Apply to deliver with AkuMart" intro="Submit your business and vehicle details. You’ll start receiving matching job notices once approved." />
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["business", "contact", "email", "phone"] as const).map((k) => (
            <Field key={k} label={{ business: "Business name", contact: "Contact name", email: "Email", phone: "Phone" }[k]}>
              <input className={inputCls} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </Field>
          ))}
          <Field label="Base location">
            <select className={inputCls} value={f.base} onChange={(e) => setF({ ...f, base: e.target.value })}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Vehicle types">
            <input className={inputCls} value={f.vehicles} onChange={(e) => setF({ ...f, vehicles: e.target.value })} placeholder="e.g. 5-tonne flatbed" />
          </Field>
          <Field label="Number of vehicles">
            <input type="number" className={inputCls} value={f.vehicleCount} onChange={(e) => setF({ ...f, vehicleCount: e.target.value })} />
          </Field>
          <Field label="Max load per job (kg)">
            <input type="number" className={inputCls} value={f.capacityKg} onChange={(e) => setF({ ...f, capacityKg: e.target.value })} />
          </Field>
          <Field label="Service areas" className="sm:col-span-2">
            <Chips options={CITIES.map((c) => ({ id: c, label: c }))} value={areas} onChange={setAreas} />
          </Field>
          <Field label="Materials you can handle" className="sm:col-span-2">
            <Chips options={MATERIALS.map((m) => ({ id: m.id, label: m.label }))} value={mats} onChange={setMats} />
          </Field>
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
            {DOCS.map((d) => (
              <label key={d} className={cn(inputCls, "cursor-pointer items-center gap-2")}>
                {docs[d] ? <FileCheck2 className="size-4 text-primary" /> : <Upload className="size-4 text-muted-foreground" />}
                <span className="truncate text-sm">{docs[d] ?? d}</span>
                <input type="file" className="sr-only" accept=".pdf,.jpg,.png" onChange={(e) => e.target.files?.[0] && setDocs({ ...docs, [d]: e.target.files[0].name })} />
              </label>
            ))}
          </div>
        </div>
        {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
        <Button
          className="mt-6"
          size="lg"
          onClick={() => {
            if (!f.business || !f.vehicles || !(+f.vehicleCount > 0) || !(+f.capacityKg > 0) || !areas.length || !mats.length) return setErr("Complete all fields and choose at least one area and material.");
            if (Object.keys(docs).length < DOCS.length) return setErr("Upload all four documents (file names only are stored in this prototype).");
            applyPartner({ business: f.business, contact: f.contact, email: f.email, phone: f.phone, base: f.base, areas, materials: mats, vehicles: f.vehicles, vehicleCount: +f.vehicleCount, capacityKg: +f.capacityKg, docs: Object.values(docs) });
            toast.success("Application submitted for review");
          }}
        >
          <Truck /> Submit application
        </Button>
      </Panel>
    </div>
  );
}

function Dashboard({ partnerId }: { partnerId: string }) {
  const partner = useDB((d) => d.partners.find((p) => p.id === partnerId)!);
  const orders = useDB((d) => d.orders);
  const settings = useDB((d) => d.settings);
  const [quotes, setQuotes] = useState<Record<string, { amount: string; eta: string }>>({});
  const jobs = orders.filter((o) => o.notified.includes(partnerId) && o.status === "awaiting_quotes");
  const assigned = orders.filter((o) => o.quotes.some((q) => q.partnerId === partnerId && q.status === "selected"));
  const lost = orders.filter((o) => o.quotes.some((q) => q.partnerId === partnerId && q.status === "declined"));
  const earned = assigned.filter((o) => o.status === "settled").map((o) => checkoutSplit(0, o.quotes.find((q) => q.id === o.quoteId)!.amount, settings));
  return (
    <div>
      <PageTitle eyebrow="Logistics partner" title={partner.business} intro={`Serving ${partner.areas.join(", ")} · ${partner.materials.join(", ")} · up to ${partner.capacityKg.toLocaleString()} kg`} actions={<StatusChip status="approved" />} />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat dark label="Open job notices" value={jobs.length} />
        <Stat label="Active deliveries" value={assigned.filter((o) => o.status !== "settled").length} />
        <Stat label="Completed" value={partner.completed} />
        <Stat label="Net earnings (settled)" value={naira(earned.reduce((s, e) => s + e.partnerPayout, 0))} hint={`After ${settings.partnerFee}% AkuMart fee`} />
      </div>
      <Panel title="Job notices" className="mb-6">
        {jobs.length === 0 ? (
          <Empty title="No open jobs" body="You’ll be notified of every delivery matching your service areas, materials and capacity. Tip: as a buyer, request delivery on an order to test this." />
        ) : (
          <div className="space-y-3">
            {jobs.map((o) => {
              const mine = o.quotes.find((q) => q.partnerId === partnerId);
              const q = quotes[o.id] ?? { amount: "", eta: "1 day" };
              return (
                <div key={o.id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{o.title}</p>
                    <span className="text-xs text-muted-foreground">{o.id}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" /> {o.pickupArea}, {o.pickupCity} → {o.destination} · {orderKg(o).toLocaleString()} kg {o.material}
                  </p>
                  {mine ? (
                    <p className="mt-2 text-sm">
                      Your quote: <strong>{naira(mine.amount)}</strong> <StatusChip status={mine.status} />
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <Field label="Quote (₦)">
                        <input type="number" className={inputCls} value={q.amount} onChange={(e) => setQuotes({ ...quotes, [o.id]: { ...q, amount: e.target.value } })} />
                      </Field>
                      <Field label="ETA">
                        <select className={inputCls} value={q.eta} onChange={(e) => setQuotes({ ...quotes, [o.id]: { ...q, eta: e.target.value } })}>
                          <option>Same day</option>
                          <option>1 day</option>
                          <option>2 days</option>
                          <option>3+ days</option>
                        </select>
                      </Field>
                      <Button onClick={() => (+q.amount > 0 ? submitQuote(o.id, partnerId, +q.amount, q.eta) : toast.error("Enter a quote"))}>Submit quote</Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          update((d) => {
                            const x = d.orders.find((y) => y.id === o.id)!;
                            x.notified = x.notified.filter((n) => n !== partnerId);
                            x.timeline.push({ at: new Date().toISOString(), actor: partner.business, action: "Declined job, no capacity" });
                          })
                        }
                      >
                        No capacity
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
      <Panel title="Assigned deliveries" className="mb-6">
        {assigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assigned deliveries yet.</p>
        ) : (
          <Table head={["Order", "Route", "Status", "Update"]}>
            {assigned.map((o) => (
              <tr key={o.id}>
                <td className={td}>
                  {o.id}
                  <p className="text-xs text-muted-foreground">{o.title}</p>
                </td>
                <td className={td}>
                  {o.pickupCity} → {o.destination}
                </td>
                <td className={td}>
                  <StatusChip status={o.status} />
                </td>
                <td className={td}>
                  {o.status === "awaiting_payment" && <span className="text-xs text-muted-foreground">Awaiting buyer payment</span>}
                  {o.status === "paid" && <Button size="sm" onClick={() => advanceOrder(o.id, "picked_up", partner.business)}>Confirm pickup</Button>}
                  {o.status === "picked_up" && <Button size="sm" onClick={() => advanceOrder(o.id, "in_transit", partner.business)}>In transit</Button>}
                  {o.status === "in_transit" && (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                      <Upload className="size-3.5" /> Upload proof
                      <input type="file" className="sr-only" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && advanceOrder(o.id, "proof_uploaded", partner.business, e.target.files[0].name)} />
                    </label>
                  )}
                  {["proof_uploaded", "settled", "disputed"].includes(o.status) && <span className="text-xs text-muted-foreground">{o.status === "settled" ? "Paid out (simulated)" : "Awaiting buyer"}</span>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      {lost.length > 0 && (
        <Panel title="Declined / unselected quotes">
          <ul className="text-sm">
            {lost.map((o) => (
              <li key={o.id} className="py-1">
                {o.id} · {o.title}, buyer chose another partner
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Rating {partner.rating || ", "} · Applied {dt(partner.appliedAt)} · <Link to="/app/support" className="text-primary">Contact support</Link>
      </p>
    </div>
  );
}
