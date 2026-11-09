import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gift, Smartphone, Banknote, Lock } from "lucide-react";
import { toast } from "sonner";
import { PageTitle, Panel, Stat, Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { inputCls } from "@/components/field";
import { useDB, useMe } from "@/lib/store";
import { redeem } from "@/lib/actions";
import { rewardEligibility } from "@/lib/rules";
import { dt, naira } from "@/lib/format";
import type { Reward } from "@/lib/types";

export const Route = createFileRoute("/app/akubin/rewards")({
  component: Rewards,
});

const ICON = { airtime: Smartphone, cash: Banknote, physical: Gift };

function Rewards() {
  const me = useMe()!;
  const rewards = useDB((d) => d.rewards);
  const settings = useDB((d) => d.settings);
  const mine = useDB((d) => d.redemptions.filter((r) => r.userId === me.id));
  const [pick, setPick] = useState<Reward | null>(null);
  const [cat, setCat] = useState<"all" | Reward["kind"]>("all");
  const [phone, setPhone] = useState(me.phone ?? "");
  return (
    <div>
      <PageTitle eyebrow="AkuBin" title="Rewards wallet" intro="Points are separate from any Marketplace balance. Save them as long as you like under current rules." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Stat dark label="Available points" value={me.points.toLocaleString()} />
        <Stat label="Airtime from" value={`${settings.airtimeMin.toLocaleString()} pts`} hint="Sent automatically" />
        <Stat label="Cash withdrawal from" value={`${settings.cashMin.toLocaleString()} pts`} hint={`≈ ${naira(settings.cashMin * settings.pointValueNaira)} · reviewed`} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Reward category">
        {([["all", "All"], ["airtime", "Airtime & Data"], ["cash", "Cash Rewards"], ["physical", "Gift Items"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={cat === k} onClick={() => setCat(k)} className={"rounded-full border px-4 py-1.5 text-sm " + (cat === k ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>
            {l}
          </button>
        ))}
        <span className="rounded-full border border-dashed px-4 py-1.5 text-sm text-muted-foreground">Bills & Utilities, Charity: not yet available</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.filter((r) => cat === "all" || r.kind === cat).map((r) => {
          const el = rewardEligibility(me.points, r.cost, r.kind, settings, r.stock);
          const I = ICON[r.kind];
          return (
            <Panel key={r.id} className={el.ok ? "" : "opacity-80"}>
              <div className="flex h-20 items-center justify-center rounded-2xl bg-secondary"><I className="size-10 text-primary" strokeWidth={1.5} /></div>
              <p className="mt-3 font-display text-lg font-semibold">{r.name}</p>
              <p className="text-sm text-muted-foreground">
                {r.cost.toLocaleString()} pts · {r.automated ? "Automatic" : "Manual review"}
                {r.stock !== undefined && ` · ${r.stock} in stock`}
              </p>
              <Button className="mt-4 w-full" variant={el.ok ? "default" : "outline"} disabled={!el.ok} onClick={() => setPick(r)}>
                {el.ok ? "Redeem" : (
                  <>
                    <Lock /> {el.reason}
                  </>
                )}
              </Button>
            </Panel>
          );
        })}
      </div>
      <Panel title="Redemption history" className="mt-6">
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">No redemptions yet.</p>
        ) : (
          <Table head={["Reward", "Points", "Status", "Date"]}>
            {mine.map((r) => (
              <tr key={r.id}>
                <td className={td}>
                  {r.rewardName}
                  {r.reason && <p className="text-xs text-muted-foreground">{r.reason}</p>}
                </td>
                <td className={td}>{r.cost.toLocaleString()}</td>
                <td className={td}>
                  <StatusChip status={r.status} />
                </td>
                <td className={td}>{dt(r.at)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      <Dialog open={!!pick} onOpenChange={(o) => !o && setPick(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem {pick?.name}</DialogTitle>
            <DialogDescription>
              {pick?.kind === "airtime" ? "Airtime is sent automatically to this number ." : pick?.kind === "cash" ? "Cash withdrawals are reviewed and paid via the payment provider. Identity/payout checks may apply." : "Item requests are reviewed, then arranged for collection."}
            </DialogDescription>
          </DialogHeader>
          {pick?.kind === "airtime" && <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234…" aria-label="Phone for airtime" />}
          <DialogFooter>
            <Button
              onClick={() => {
                const r = redeem(pick!.id, pick!.kind === "airtime" ? phone || undefined : undefined);
                r.ok ? toast.success(r.msg) : toast.error(r.msg);
                setPick(null);
              }}
            >
              Confirm redemption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
