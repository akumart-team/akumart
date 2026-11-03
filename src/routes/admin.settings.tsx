import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Panel, Table, td } from "@/components/app-ui";
import { Field, inputCls } from "@/components/field";
import { Button } from "@/components/ui/button";
import { useDB, update } from "@/lib/store";
import { useActor } from "@/lib/admin";
import { MATERIALS } from "@/lib/seed";
import { dt, nowIso, downloadCsv } from "@/lib/format";
import type { Settings } from "@/lib/types";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsAdmin,
});

function SettingsAdmin() {
  const settings = useDB((d) => d.settings);
  const audit = useDB((d) => d.audit);
  const actor = useActor();
  const [s, setS] = useState<Settings>(settings);
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: +e.target.value });
  return (
    <div className="space-y-6">
      <h1 className="text-display text-3xl">Platform settings</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Commission (provisional)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Seller fee (% of waste value)">
              <input type="number" className={inputCls} value={s.sellerFee} onChange={num("sellerFee")} />
            </Field>
            <Field label="Partner fee (% of delivery)">
              <input type="number" className={inputCls} value={s.partnerFee} onChange={num("partnerFee")} />
            </Field>
            <Field label="Inspection window (hours)">
              <input type="number" className={inputCls} value={s.inspectionHours} onChange={num("inspectionHours")} />
            </Field>
          </div>
        </Panel>
        <Panel title="Rewards">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Airtime threshold (pts)">
              <input type="number" className={inputCls} value={s.airtimeMin} onChange={num("airtimeMin")} />
            </Field>
            <Field label="Cash minimum (pts)">
              <input type="number" className={inputCls} value={s.cashMin} onChange={num("cashMin")} />
            </Field>
            <Field label="Point value (₦)">
              <input type="number" step="0.1" className={inputCls} value={s.pointValueNaira} onChange={num("pointValueNaira")} />
            </Field>
            <Field label="Points per counted item">
              <input type="number" className={inputCls} value={s.pointsPerItem} onChange={num("pointsPerItem")} />
            </Field>
            <Field label="Weight equivalent per item (kg)">
              <input type="number" step="0.01" className={inputCls} value={s.itemKgEquivalent} onChange={num("itemKgEquivalent")} />
            </Field>
          </div>
        </Panel>
      </div>
      <Panel title="Points per verified kg, by material">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {MATERIALS.map((m) => (
            <Field key={m.id} label={m.label}>
              <input type="number" className={inputCls} value={s.pointsPerKg[m.id]} onChange={(e) => setS({ ...s, pointsPerKg: { ...s.pointsPerKg, [m.id]: +e.target.value } })} />
            </Field>
          ))}
        </div>
      </Panel>
      <Button
        onClick={() => {
          update((d) => {
            d.settings = s;
            d.audit.unshift({ at: nowIso(), actor, action: "Settings updated", detail: `Fees ${s.sellerFee}%/${s.partnerFee}%` });
          });
          toast.success("Settings saved");
        }}
      >
        Save settings
      </Button>
      <Panel title="Audit trail" action={<Button size="sm" variant="outline" onClick={() => downloadCsv("akumart-audit.csv", audit.map((a) => ({ ...a })))}><Download /> CSV</Button>}>
        <Table head={["When", "Actor", "Action", "Detail"]}>
          {audit.slice(0, 50).map((a, i) => (
            <tr key={i}>
              <td className={td + " whitespace-nowrap"}>{dt(a.at)}</td>
              <td className={td}>{a.actor}</td>
              <td className={td}>{a.action}</td>
              <td className={td + " text-xs text-muted-foreground"}>{a.detail}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
