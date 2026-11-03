import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle, Panel } from "@/components/app-ui";
import { Field, inputCls, Chips } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMe, updateMe, resetDemo } from "@/lib/store";
import { MATERIALS, CITIES } from "@/lib/seed";
import { dt } from "@/lib/format";
import type { MarketRole, Material } from "@/lib/types";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const me = useMe()!;
  const [f, setF] = useState({ name: me.name, phone: me.phone ?? "", city: me.city ?? "Lagos" });
  const [role, setRole] = useState<MarketRole>(me.prefs.marketRole);
  const [akubin, setAkubin] = useState(me.prefs.akubin);
  const [interests, setInterests] = useState<Material[]>(me.prefs.interests);
  return (
    <div className="max-w-3xl space-y-6">
      <PageTitle title="Settings" />
      <Panel title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name">
            <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </Field>
          <Field label="City">
            <select className={inputCls} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Email">
            <input className={inputCls} value={me.email} disabled />
          </Field>
        </div>
      </Panel>
      <Panel title="Services">
        <div className="space-y-4">
          <Field label="Marketplace role">
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as MarketRole)}>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="both">Both</option>
              <option value="none">Not now</option>
            </select>
          </Field>
          <p className="text-xs text-muted-foreground">Changing role never bypasses verification requirements.</p>
          <div>
            <p className="mb-2 text-sm font-medium">Material interests</p>
            <Chips options={MATERIALS.map((m) => ({ id: m.id, label: m.label }))} value={interests} onChange={setInterests} />
          </div>
          <label className="flex items-center justify-between rounded-xl border p-4">
            <span className="font-medium">AkuBin Recycle & Earn</span>
            <Switch checked={akubin} onCheckedChange={setAkubin} />
          </label>
        </div>
      </Panel>
      <Button
        onClick={() => {
          updateMe((u) => {
            u.name = f.name;
            u.phone = f.phone || undefined;
            u.city = f.city;
            u.prefs = { ...u.prefs, marketRole: role, akubin, interests };
          });
          toast.success("Settings saved");
        }}
      >
        Save changes
      </Button>
      <Panel title="Verification & consent">
        <p className="text-sm">
          Terms accepted: <strong>{me.consent.terms}</strong>
          <br />
          Privacy notice: <strong>{me.consent.privacy}</strong>
          <br />
          Accepted at: {dt(me.consent.at)} via {me.provider}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/app/verification">Open verification centre</Link>
        </Button>
      </Panel>
      <Panel title="Demo data">
        <p className="text-sm text-muted-foreground">Reset all simulated data in this browser (signs you out).</p>
        <Button
          variant="destructive"
          size="sm"
          className="mt-3"
          onClick={() => {
            if (confirm("Reset all demo data?")) {
              resetDemo();
              window.location.href = "/";
            }
          }}
        >
          Reset demo
        </Button>
      </Panel>
    </div>
  );
}
