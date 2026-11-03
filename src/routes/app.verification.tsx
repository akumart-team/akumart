import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, User, Building2, Loader2, ArrowRight, Upload, AlertTriangle, BadgeCheck, FileCheck2 } from "lucide-react";
import { PageTitle, Panel } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Field, inputCls } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DemoTag } from "@/components/brand";
import { useMe, useDB, setIntent, updateMe } from "@/lib/store";
import { startVerification, resolveVerification, type DemoOutcome } from "@/lib/actions";
import { CITIES } from "@/lib/seed";
import { dt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VType } from "@/lib/types";

export const Route = createFileRoute("/app/verification")({
  validateSearch: (s: Record<string, unknown>): { level?: "basic" | "full" } => ({ level: s.level === "full" ? "full" : s.level === "basic" ? "basic" : undefined }),
  component: Verification,
});

const OUTCOMES: { id: DemoOutcome; label: string }[] = [
  { id: "approved", label: "Automatic check passes" },
  { id: "pending_review", label: "Needs manual review" },
  { id: "rejected", label: "Rejected — resubmission needed" },
  { id: "provider_unavailable", label: "Provider unavailable" },
];

function Verification() {
  const me = useMe()!;
  const intent = useDB((d) => d.intent);
  const router = useRouter();
  const v = me.verification;
  const search = Route.useSearch();
  const level: "basic" | "full" = v.basic !== "approved" ? "basic" : search.level === "full" || intent?.level === "full" || v.full !== "approved" ? "full" : "basic";
  const status = v[level];
  const [type, setType] = useState<VType>(v.type ?? "individual");
  const [f, setF] = useState<Record<string, string>>({ legalName: me.name, phone: me.phone ?? "", city: "Lagos", ...v.data });
  const [files, setFiles] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [outcome, setOutcome] = useState<DemoOutcome>("approved");
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status !== "checking") return;
    const t = setTimeout(() => resolveVerification(level, outcome), 2200);
    return () => clearTimeout(t);
  }, [status, level, outcome]);

  const resumeReady = intent && (intent.level === "basic" ? v.basic === "approved" : v.basic === "approved" && v.full === "approved");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const onFile = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/(pdf|jpe?g|png)$/i.test(file.name)) return setErr({ ...err, [k]: "Use PDF, JPG or PNG" });
    if (file.size > 5 * 1024 * 1024) return setErr({ ...err, [k]: "Max 5 MB" });
    setErr({ ...err, [k]: "" });
    setFiles({ ...files, [k]: file.name });
  };

  const submit = () => {
    const er: Record<string, string> = {};
    const need = (k: string, msg = "Required") => {
      if (!f[k]?.trim()) er[k] = msg;
    };
    if (level === "basic") {
      if (type === "individual") {
        need("legalName");
        need("area", "Enter your area/neighbourhood");
        need("idType");
        if (!/^\d{11}$/.test(f.idNumber ?? "") && f.idType === "NIN") er.idNumber = "NIN must be 11 digits";
        else need("idNumber");
      } else {
        need("businessName");
        if (!/^(RC|BN)\s?\d{4,8}$/i.test(f.cac ?? "")) er.cac = "Format: RC 123456 or BN 1234567";
        need("businessType");
        need("registeredAddress");
        need("contactPerson");
      }
      if (!/^\+?[\d\s-]{10,18}$/.test(f.phone ?? "")) er.phone = "Enter a valid phone number";
    } else {
      const docs = v.type === "business" ? ["cacCert", "regDoc", "repId"] : ["idDoc", "selfie"];
      docs.forEach((d) => !files[d] && (er[d] = "Upload required"));
      need("pickupAddress", "Add a waste pickup/storage address");
    }
    if (!consent) er.consent = "Please consent to verification processing";
    setErr(er);
    if (Object.values(er).some(Boolean)) return;
    const data = { ...f, ...Object.fromEntries(Object.entries(files).map(([k, n]) => [k, `uploaded: ${n}`])) };
    if (data.idNumber) data.idNumberMasked = "•••••••" + data.idNumber.slice(-4);
    delete data.idNumber;
    startVerification(level, level === "basic" ? type : v.type!, data);
  };

  return (
    <div className="max-w-4xl">
      <PageTitle eyebrow="Marketplace verification" title="Verification centre" intro="Needed only for Marketplace trading. AkuBin recycling and rewards never require it." />

      {resumeReady && intent && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-forest p-6 text-forest-foreground">
          <div className="flex items-center gap-3">
            <BadgeCheck className="size-8 text-lime" />
            <div>
              <p className="font-display text-xl font-semibold">You’re approved</p>
              <p className="text-sm text-forest-foreground/70">Pick up where you left off.</p>
            </div>
          </div>
          <Button
            variant="lime"
            size="lg"
            onClick={() => {
              const p = intent.path;
              setIntent(null);
              router.history.push(p);
            }}
          >
            Resume: {intent.label} <ArrowRight />
          </Button>
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {(["basic", "full"] as const).map((l) => (
          <Panel key={l} className={cn(level === l && "border-primary")}>
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold">{l === "basic" ? "Basic verification" : "Full verification"}</p>
              <StatusChip status={v[l]} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{l === "basic" ? "Unlocks offers, responding to offers and publishing listings." : "Unlocks checkout, payment and payout eligibility."}</p>
          </Panel>
        ))}
      </div>

      {status === "approved" && (level === "full" || v.full === "approved") ? (
        <Panel>
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-8 text-primary" />
            <div>
              <p className="font-display text-xl font-semibold">Verified {v.type === "business" ? "Business" : "Individual"}</p>
              <p className="text-sm text-muted-foreground">Your public badge is now shown on your listings.</p>
            </div>
          </div>
        </Panel>
      ) : status === "checking" ? (
        <Panel>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="font-display text-xl font-semibold">Running automatic checks…</p>
            <p className="max-w-sm text-sm text-muted-foreground">Simulated verification provider. Results are DEMO outcomes, not live identity or CAC checks.</p>
          </div>
        </Panel>
      ) : status === "pending_review" ? (
        <Panel>
          <div className="flex gap-3">
            <Loader2 className="size-6 shrink-0 animate-spin text-warning-foreground" />
            <div>
              <p className="font-display text-xl font-semibold">Pending manual review</p>
              <p className="mt-1 text-sm text-muted-foreground">{v.reason ?? "A reviewer will check your submission."} Trading actions stay locked until approval. (Demo: approve it from the internal admin console.)</p>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel title={`${status === "needs_resubmission" ? "Resubmit" : "Complete"} ${level} verification`} action={<DemoTag>Simulated provider</DemoTag>}>
          {status === "needs_resubmission" && (
            <div className="mb-5 flex gap-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="size-5 shrink-0" /> {v.reason}
            </div>
          )}
          {level === "basic" && (
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {([
                ["individual", User, "Individual", "Including informal collectors and traders"],
                ["business", Building2, "Registered business", "CAC-registered Nigerian company or business name"],
              ] as const).map(([k, I, t, d]) => (
                <button key={k} type="button" onClick={() => setType(k)} className={cn("flex gap-3 rounded-2xl border p-4 text-left", type === k && "border-primary bg-secondary")}>
                  <I className="size-6 text-primary" />
                  <div>
                    <p className="font-semibold">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {level === "basic" && type === "individual" && (
              <>
                <Field label="Full legal name" error={err.legalName} hint="As shown on your ID.">
                  <input className={inputCls} value={f.legalName ?? ""} onChange={set("legalName")} />
                </Field>
                <Field label="Phone" error={err.phone}>
                  <input className={inputCls} value={f.phone ?? ""} onChange={set("phone")} />
                </Field>
                <Field label="Residential city">
                  <select className={inputCls} value={f.city} onChange={set("city")}>
                    {CITIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Area / neighbourhood" error={err.area} hint="Not shown publicly.">
                  <input className={inputCls} value={f.area ?? ""} onChange={set("area")} />
                </Field>
                <Field label="Government ID type" error={err.idType}>
                  <select className={inputCls} value={f.idType ?? ""} onChange={set("idType")}>
                    <option value="">Select…</option>
                    <option value="NIN">National Identification Number (NIN)</option>
                    <option>International passport</option>
                    <option>Driver’s licence</option>
                    <option>Voter’s card</option>
                  </select>
                </Field>
                <Field label="ID number" error={err.idNumber} hint="Never shown in full anywhere.">
                  <input className={inputCls} value={f.idNumber ?? ""} onChange={set("idNumber")} />
                </Field>
              </>
            )}
            {level === "basic" && type === "business" && (
              <>
                <Field label="Registered business name" error={err.businessName}>
                  <input className={inputCls} value={f.businessName ?? ""} onChange={set("businessName")} />
                </Field>
                <Field label="CAC registration number" error={err.cac} hint="RC (company) or BN (business name).">
                  <input className={inputCls} value={f.cac ?? ""} onChange={set("cac")} placeholder="RC 1234567" />
                </Field>
                <Field label="Business type" error={err.businessType}>
                  <select className={inputCls} value={f.businessType ?? ""} onChange={set("businessType")}>
                    <option value="">Select…</option>
                    <option>Recycler / processor</option>
                    <option>Aggregator</option>
                    <option>Manufacturer</option>
                    <option>Waste management company</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Registered business address" error={err.registeredAddress} hint="Kept private — not shown on listings.">
                  <input className={inputCls} value={f.registeredAddress ?? ""} onChange={set("registeredAddress")} />
                </Field>
                <Field label="Contact person" error={err.contactPerson}>
                  <input className={inputCls} value={f.contactPerson ?? ""} onChange={set("contactPerson")} />
                </Field>
                <Field label="Contact phone" error={err.phone}>
                  <input className={inputCls} value={f.phone ?? ""} onChange={set("phone")} />
                </Field>
              </>
            )}
            {level === "full" && (
              <>
                {(v.type === "business"
                  ? [
                      ["cacCert", "CAC certificate"],
                      ["regDoc", "Business registration evidence (e.g. status report)"],
                      ["repId", "Contact person’s government ID"],
                    ]
                  : [
                      ["idDoc", "Government ID document (front)"],
                      ["selfie", "Selfie holding the ID"],
                    ]
                ).map(([k, l]) => (
                  <Field key={k} label={l} error={err[k]} hint="PDF, JPG or PNG up to 5 MB. Prototype stores only the file name.">
                    <label className={cn(inputCls, "cursor-pointer items-center gap-2")}>
                      {files[k] ? <FileCheck2 className="size-4 text-primary" /> : <Upload className="size-4 text-muted-foreground" />}
                      <span className="truncate">{files[k] ?? "Choose file"}</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={onFile(k)} />
                    </label>
                  </Field>
                ))}
                <Field label="Waste pickup / storage address" error={err.pickupAddress} hint="Used for logistics. Separate from any registered address." className="sm:col-span-2">
                  <input className={inputCls} value={f.pickupAddress ?? ""} onChange={set("pickupAddress")} placeholder="e.g. Plot 4, Oregun Industrial Estate, Ikeja" />
                </Field>
              </>
            )}
          </div>
          <label className="mt-6 flex items-start gap-3 text-sm">
            <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} className="mt-0.5" />
            <span>I consent to AkuMart and its verification provider processing this information for Marketplace eligibility, as described in the Privacy Policy.</span>
          </label>
          {err.consent && <p className="mt-1 text-xs text-destructive">{err.consent}</p>}
          <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-warning bg-warning/10 p-4">
            <Field label="Demo result to simulate" className="min-w-60 flex-1">
              <select className={inputCls} value={outcome} onChange={(e) => setOutcome(e.target.value as DemoOutcome)}>
                {OUTCOMES.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Button size="lg" onClick={submit}>
              Submit for verification
            </Button>
          </div>
        </Panel>
      )}

      {v.history.length > 0 && (
        <Panel title="History" className="mt-6">
          <ul className="space-y-2 text-sm">
            {v.history.map((h, i) => (
              <li key={i} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                <span>{h.action}</span>
                <span className="shrink-0 text-muted-foreground">{dt(h.at)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <button className="mt-6 text-xs text-muted-foreground underline" onClick={() => updateMe((u) => (u.verification = { type: null, basic: "not_started", full: "not_started", data: {}, history: [] }))}>
        Reset my demo verification
      </button>
    </div>
  );
}
