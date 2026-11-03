import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, CreditCard, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, Panel, Empty, Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Field, inputCls, Chips } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDB, useMe } from "@/lib/store";
import { saveCampaign, payCampaign, AD_PACKAGES } from "@/lib/actions";
import { MATERIALS, CITIES } from "@/lib/seed";
import { naira } from "@/lib/format";
import { img } from "@/lib/images";
import type { Material } from "@/lib/types";

export const Route = createFileRoute("/app/advertise")({
  component: Advertiser,
});

function Advertiser() {
  const me = useMe()!;
  const mine = useDB((d) => d.campaigns.filter((c) => c.ownerId === me.id));
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ title: "", body: "", url: "https://", image: "plastic", pkg: "7d" as keyof typeof AD_PACKAGES });
  const [locs, setLocs] = useState<string[]>([]);
  const [mats, setMats] = useState<Material[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [payFail, setPayFail] = useState(false);

  return (
    <div className="max-w-5xl">
      <PageTitle
        eyebrow="Advertiser portal"
        title="Campaigns"
        intro="Sponsored posts appear in the For You feed only after payment and admin approval, and are always labelled."
        actions={
          !creating && (
            <Button onClick={() => setCreating(true)}>
              <Plus /> New campaign
            </Button>
          )
        }
      />
      {creating && (
        <Panel title="Campaign setup" className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Headline" className="md:col-span-2">
              <input className={inputCls} maxLength={60} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </Field>
            <Field label="Body text" className="md:col-span-2">
              <Textarea rows={2} maxLength={140} className="rounded-xl" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
            </Field>
            <Field label="Landing URL">
              <input className={inputCls} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
            </Field>
            <Field label="Creative">
              <select className={inputCls} value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })}>
                {["plastic", "metal", "cardboard", "materials", "truck", "kiosk"].map((k) => (
                  <option key={k} value={k}>
                    Stock image: {k}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Target locations" className="md:col-span-2">
              <Chips options={CITIES.map((c) => ({ id: c, label: c }))} value={locs} onChange={setLocs} />
            </Field>
            <Field label="Target material interests" className="md:col-span-2">
              <Chips options={MATERIALS.map((m) => ({ id: m.id, label: m.label }))} value={mats} onChange={setMats} />
            </Field>
            <Field label="Target roles" className="md:col-span-2">
              <Chips options={[{ id: "buyer", label: "Buyers" }, { id: "seller", label: "Sellers" }, { id: "recycler", label: "AkuBin recyclers" }]} value={roles} onChange={setRoles} />
            </Field>
            <Field label="Package" className="md:col-span-2">
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(AD_PACKAGES) as (keyof typeof AD_PACKAGES)[]).map((k) => (
                  <button key={k} onClick={() => setF({ ...f, pkg: k })} className={`rounded-xl border p-3 text-left ${f.pkg === k ? "border-primary bg-secondary" : ""}`}>
                    <p className="font-semibold">{k.replace("d", " days")}</p>
                    <p className="text-sm text-muted-foreground">{naira(AD_PACKAGES[k])}</p>
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_300px]">
            <div>
              {err && <p className="mb-2 text-sm text-destructive">{err}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (f.title.length < 5 || f.body.length < 10 || !/^https?:\/\/\S+\.\S+/.test(f.url) || !locs.length) return setErr("Add a headline, body, valid URL and at least one location.");
                    saveCampaign({ ...f, locations: locs, materials: mats, roles });
                    setCreating(false);
                    toast.success("Campaign saved — complete payment to submit for review");
                  }}
                >
                  Save campaign
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border-2 border-lime">
              <img src={img(f.image)} alt="" className="aspect-[16/9] w-full object-cover" />
              <div className="p-3">
                <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold uppercase text-lime-foreground">Sponsored</span>
                <p className="mt-1 font-semibold">{f.title || "Your headline"}</p>
                <p className="text-xs text-muted-foreground">{f.body || "Body text preview"}</p>
              </div>
            </div>
          </div>
        </Panel>
      )}
      {mine.length === 0 && !creating ? (
        <Empty title="No campaigns yet">
          <Button onClick={() => setCreating(true)}>
            <Megaphone /> Create your first campaign
          </Button>
        </Empty>
      ) : (
        mine.length > 0 && (
          <>
            <label className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={payFail} onChange={(e) => setPayFail(e.target.checked)} /> Demo: simulate payment failure
            </label>
            <Table head={["Campaign", "Package", "Payment", "Review", "Impressions", "Clicks", ""]}>
              {mine.map((c) => (
                <tr key={c.id}>
                  <td className={td}>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.locations.join(", ")}</p>
                    {c.reason && <p className="text-xs text-destructive">{c.reason}</p>}
                  </td>
                  <td className={td}>
                    {c.pkg} · {naira(c.price)}
                  </td>
                  <td className={td}>
                    <StatusChip status={c.payment} />
                  </td>
                  <td className={td}>
                    <StatusChip status={c.status} />
                  </td>
                  <td className={td}>{c.impressions.toLocaleString()}</td>
                  <td className={td}>{c.clicks}</td>
                  <td className={td}>
                    {c.payment !== "paid" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          payCampaign(c.id, !payFail);
                          payFail ? toast.error("Payment failed (simulated)") : toast.success("Paid via provider (simulated) — pending admin review");
                        }}
                      >
                        <CreditCard /> Pay {naira(c.price)}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          </>
        )
      )}
    </div>
  );
}
