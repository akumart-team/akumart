import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, Panel, Empty } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Field, inputCls } from "@/components/field";
import { useTradeGate } from "@/components/gate";
import { useDB, useMe, update } from "@/lib/store";
import { postRequest, respondRequest } from "@/lib/actions";
import { MATERIALS, CITIES } from "@/lib/seed";
import { naira, day } from "@/lib/format";
import { StatusChip } from "@/components/status-chip";
import type { Material } from "@/lib/types";

export const Route = createFileRoute("/app/requests")({
  component: Requests,
});

function Requests() {
  const me = useMe()!;
  const requests = useDB((d) => d.requests);
  const gate = useTradeGate();
  const [open, setOpen] = useState(false);
  const [respond, setRespond] = useState<string | null>(null);
  const [f, setF] = useState({ material: "plastic" as Material, title: "", qty: "", unit: "kg", maxPrice: "", city: "Lagos", needBy: "" });
  const [r, setR] = useState({ price: "", qty: "", note: "" });
  const mine = requests.filter((x) => x.buyerId === me.id);
  const others = requests.filter((x) => x.buyerId !== me.id);
  return (
    <div className="max-w-5xl">
      <PageTitle
        eyebrow="Marketplace"
        title="Buyer requests"
        intro="Buyers post what they need; sellers reply with structured responses."
        actions={
          <Button onClick={() => gate({ path: "/app/requests", label: "Post a buyer request", level: "basic" }, () => setOpen(true))}>
            <Plus /> Post a request
          </Button>
        }
      />
      {mine.length > 0 && (
        <Panel title="My requests" className="mb-6">
          <div className="space-y-4">
            {mine.map((x) => (
              <div key={x.id} className="rounded-2xl border p-4">
                <p className="font-semibold">{x.title}</p>
                <p className="text-sm text-muted-foreground">
                  {x.qty} {x.unit} · max {naira(x.maxPrice)} · {x.city}
                </p>
                {x.responses.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">No responses yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {x.responses.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted p-3 text-sm">
                        <span>
                          <strong>{s.sellerName}</strong>: {naira(s.price)} × {s.qty}, {s.note}
                        </span>
                        <span className="flex items-center gap-2">
                          <StatusChip status={s.status} />
                          {s.status === "sent" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                update((d) => {
                                  d.requests.find((y) => y.id === x.id)!.responses.find((y) => y.id === s.id)!.status = "shortlisted";
                                })
                              }
                            >
                              Shortlist
                            </Button>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}
      <h2 className="mb-3 font-display text-lg font-semibold">Open requests from buyers</h2>
      {others.length === 0 ? (
        <Empty title="No open requests" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {others.map((x) => {
            const responded = x.responses.some((s) => s.sellerId === me.id);
            return (
              <Panel key={x.id}>
                <p className="eyebrow text-primary">{x.material}</p>
                <p className="mt-1 font-display text-lg font-semibold">{x.title}</p>
                <p className="text-sm text-muted-foreground">
                  {x.qty.toLocaleString()} {x.unit} · up to {naira(x.maxPrice)}/kg · {x.city} · needed by {day(x.needBy)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{x.buyerName}</p>
                <Button size="sm" className="mt-4" disabled={responded} onClick={() => gate({ path: "/app/requests", label: "Respond to a buyer request", level: "basic" }, () => setRespond(x.id))}>
                  {responded ? "Response sent" : "Respond"}
                </Button>
              </Panel>
            );
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post a buyer request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </Field>
            <Field label="Material">
              <select className={inputCls} value={f.material} onChange={(e) => setF({ ...f, material: e.target.value as Material })}>
                {MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="City">
              <select className={inputCls} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input className={inputCls} type="number" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
            </Field>
            <Field label="Unit">
              <select className={inputCls} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>
                <option>kg</option>
                <option>tonne</option>
              </select>
            </Field>
            <Field label="Max price (₦/kg)">
              <input className={inputCls} type="number" value={f.maxPrice} onChange={(e) => setF({ ...f, maxPrice: e.target.value })} />
            </Field>
            <Field label="Needed by">
              <input className={inputCls} type="date" value={f.needBy} onChange={(e) => setF({ ...f, needBy: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!f.title || !(+f.qty > 0) || !(+f.maxPrice > 0) || !f.needBy) return toast.error("Fill in all fields");
                postRequest({ ...f, qty: +f.qty, maxPrice: +f.maxPrice, needBy: new Date(f.needBy).toISOString() });
                setOpen(false);
                toast.success("Request posted");
              }}
            >
              Post request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!respond} onOpenChange={(o) => !o && setRespond(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Structured response</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Your price (₦/kg)">
              <input className={inputCls} type="number" value={r.price} onChange={(e) => setR({ ...r, price: e.target.value })} />
            </Field>
            <Field label="Quantity you can supply">
              <input className={inputCls} type="number" value={r.qty} onChange={(e) => setR({ ...r, qty: e.target.value })} />
            </Field>
            <Field label="Availability" className="sm:col-span-2">
              <select className={inputCls} value={r.note} onChange={(e) => setR({ ...r, note: e.target.value })}>
                <option value="">Select…</option>
                <option>Available now</option>
                <option>Available within 7 days</option>
                <option>Recurring monthly supply</option>
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!(+r.price > 0) || !(+r.qty > 0) || !r.note) return toast.error("Complete all fields");
                respondRequest(respond!, +r.price, +r.qty, r.note);
                setRespond(null);
                toast.success("Response sent");
              }}
            >
              Send response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
