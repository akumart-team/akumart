import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Eye, Send, Save } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, Panel } from "@/components/app-ui";
import { Field, inputCls } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ListingCard } from "@/components/listing-card";
import { useTradeGate } from "@/components/gate";
import { getDB, useMe } from "@/lib/store";
import { saveListing } from "@/lib/actions";
import { MATERIALS, CITIES } from "@/lib/seed";
import { nowIso } from "@/lib/format";
import type { Listing, Material } from "@/lib/types";

export const Route = createFileRoute("/app/listings/new")({
  validateSearch: (s: Record<string, unknown>): { edit?: string; publish?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
    publish: typeof s.publish === "string" ? s.publish : undefined,
  }),
  component: NewListing,
});

type Draft = Omit<Listing, "id" | "sellerId" | "sellerName" | "sellerBadge" | "createdAt" | "views">;

function NewListing() {
  const { edit, publish } = Route.useSearch();
  const me = useMe()!;
  const router = useRouter();
  const gate = useTradeGate();
  const existing = edit ? getDB().listings.find((l) => l.id === edit && l.sellerId === me.id) : undefined;
  const [id, setId] = useState(existing?.id);
  const [f, setF] = useState<Draft>(
    existing ?? {
      title: "",
      material: "plastic",
      grade: "",
      condition: "Baled",
      qty: 0,
      unit: "kg",
      price: 0,
      minOrder: 50,
      partial: true,
      city: me.city ?? "Lagos",
      area: "",
      fulfilment: ["pickup", "delivery"],
      image: "plastic",
      description: "",
      status: "draft",
    },
  );
  const [err, setErr] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(!!publish);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setF({ ...f, [k]: v });

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 4) e.title = "Give your listing a clear title";
    if (!f.grade.trim()) e.grade = "Describe the grade";
    if (!(f.qty > 0)) e.qty = "Enter quantity";
    if (!(f.price > 0)) e.price = "Enter a price";
    if (!(f.minOrder > 0) || f.minOrder > f.qty) e.minOrder = "Minimum must be between 1 and the total quantity";
    if (!f.area.trim()) e.area = "Enter the pickup area";
    if (!f.fulfilment.length) e.fulfilment = "Choose at least one option";
    setErr(e);
    return !Object.keys(e).length;
  };

  const saveDraft = () => {
    const nid = saveListing({ ...f, status: "draft" }, id);
    setId(nid);
    return nid;
  };

  const doPublish = () => {
    if (!validate()) return setPreview(false);
    const nid = saveDraft();
    gate({ path: `/app/listings/new?edit=${nid}&publish=1`, label: "Publish your listing", level: "basic" }, () => {
      saveListing({ ...f, status: "published" }, nid);
      toast.success("Listing published");
      router.navigate({ to: "/marketplace/$id", params: { id: nid } });
    });
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr({ ...err, image: "Choose an image file" });
    if (file.size > 1.5 * 1024 * 1024) return setErr({ ...err, image: "Image must be under 1.5 MB in the prototype" });
    const r = new FileReader();
    r.onload = () => set("image", r.result as string);
    r.readAsDataURL(file);
  };

  const previewListing: Listing = { ...f, id: id ?? "preview", sellerId: me.id, sellerName: me.name, sellerBadge: me.verification.basic === "approved" ? me.verification.type : null, createdAt: nowIso(), views: 0 };

  return (
    <div className="max-w-5xl">
      <PageTitle eyebrow="Seller" title={existing ? "Edit listing" : "Create a listing"} intro="Save a draft any time. Publishing requires basic Marketplace verification, we’ll keep your draft." />
      {preview ? (
        <div className="grid gap-6 md:grid-cols-[340px_1fr]">
          <ListingCard l={previewListing} />
          <Panel title="Ready to publish?">
            <p className="text-sm text-muted-foreground">This is how buyers will see your listing. Your private pickup address is never shown publicly.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setPreview(false)}>
                Back to edit
              </Button>
              <Button onClick={doPublish}>
                <Send /> Publish listing
              </Button>
            </div>
          </Panel>
        </div>
      ) : (
        <Panel>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Title" error={err.title} className="md:col-span-2">
              <input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Clear PET bottle bales" />
            </Field>
            <Field label="Material category">
              <select className={inputCls} value={f.material} onChange={(e) => setF({ ...f, material: e.target.value as Material, image: f.image.startsWith("data:") ? f.image : e.target.value })}>
                {MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}, {m.hint}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Grade / specification" error={err.grade}>
              <input className={inputCls} value={f.grade} onChange={(e) => set("grade", e.target.value)} placeholder="e.g. PET Grade A, labels on" />
            </Field>
            <Field label="Condition">
              <select className={inputCls} value={f.condition} onChange={(e) => set("condition", e.target.value as Draft["condition"])}>
                {["Baled", "Loose", "Sorted", "Shredded", "Mixed"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <Field label="Quantity available" error={err.qty}>
                <input className={inputCls} type="number" value={f.qty || ""} onChange={(e) => set("qty", +e.target.value)} />
              </Field>
              <Field label="Unit">
                <select className={inputCls} value={f.unit} onChange={(e) => set("unit", e.target.value as "kg" | "tonne")}>
                  <option value="kg">kg</option>
                  <option value="tonne">tonne</option>
                </select>
              </Field>
            </div>
            <Field label={`Asking price (₦ per ${f.unit})`} error={err.price}>
              <input className={inputCls} type="number" value={f.price || ""} onChange={(e) => set("price", +e.target.value)} />
            </Field>
            <Field label="Minimum order quantity" error={err.minOrder}>
              <input className={inputCls} type="number" value={f.minOrder || ""} onChange={(e) => set("minOrder", +e.target.value)} />
            </Field>
            <Field label="Pickup city">
              <select className={inputCls} value={f.city} onChange={(e) => set("city", e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Pickup area" error={err.area} hint="Only the area is public, never your full address.">
              <input className={inputCls} value={f.area} onChange={(e) => set("area", e.target.value)} />
            </Field>
            <Field label="Fulfilment options you accept" error={err.fulfilment}>
              <div className="flex gap-2">
                {(["pickup", "delivery"] as const).map((o) => (
                  <button
                    type="button"
                    key={o}
                    aria-pressed={f.fulfilment.includes(o)}
                    onClick={() => set("fulfilment", f.fulfilment.includes(o) ? f.fulfilment.filter((x) => x !== o) : [...f.fulfilment, o])}
                    className={`flex-1 rounded-xl border p-3 text-sm font-medium ${f.fulfilment.includes(o) ? "border-primary bg-secondary" : ""}`}
                  >
                    {o === "pickup" ? "Buyer pickup" : "Logistics delivery"}
                  </button>
                ))}
              </div>
            </Field>
            <label className="flex items-center justify-between rounded-xl border p-4 text-sm">
              <span>
                <span className="font-medium">Allow partial purchases</span>
                <span className="block text-xs text-muted-foreground">Buyers can order less than the full quantity.</span>
              </span>
              <Switch checked={f.partial} onCheckedChange={(v) => set("partial", v)} />
            </label>
            <Field label="Photos" error={err.image} className="md:col-span-2">
              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed p-4">
                {f.image.startsWith("data:") ? <img src={f.image} alt="" className="h-16 w-20 rounded-lg object-cover" /> : <ImagePlus className="size-8 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">Upload a photo of the material (a stock category image is used if none).</span>
                <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
              </label>
            </Field>
            <Field label="Description" className="md:col-span-2">
              <Textarea rows={4} className="rounded-xl" value={f.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                saveDraft();
                toast.success("Draft saved");
              }}
            >
              <Save /> Save draft
            </Button>
            <Button onClick={() => validate() && setPreview(true)}>
              <Eye /> Preview
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
