import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Table, td, Stat } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { useDB, update } from "@/lib/store";
import { decideRedemption } from "@/lib/actions";
import { checkoutSplit } from "@/lib/rules";
import { useActor } from "@/lib/admin";
import { naira, dt, downloadCsv, nowIso } from "@/lib/format";

export const Route = createFileRoute("/admin/finance")({
  component: Finance,
});

function Finance() {
  const orders = useDB((d) => d.orders.filter((o) => o.payment !== "unpaid"));
  const settings = useDB((d) => d.settings);
  const redemptions = useDB((d) => d.redemptions);
  const actor = useActor();
  const rows = orders.map((o) => {
    const q = o.quotes.find((x) => x.id === o.quoteId);
    return { o, s: checkoutSplit(o.qty * o.unitPrice, q?.amount ?? 0, settings) };
  });
  const held = rows.filter((r) => r.o.payment === "held").reduce((s, r) => s + r.s.buyerTotal, 0);
  const released = rows.filter((r) => r.o.payment === "released").reduce((s, r) => s + r.s.akumartRevenue, 0);
  const hold = (id: string, on: boolean) =>
    update((d) => {
      const o = d.orders.find((x) => x.id === id)!;
      o.timeline.push({ at: nowIso(), actor, action: on ? "Finance hold placed" : "Finance hold lifted" });
      if (on) o.status = "disputed";
      d.audit.unshift({ at: nowIso(), actor, action: on ? "Hold placed" : "Hold lifted", detail: id });
    });
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display text-3xl">Finance</h1>
          <p className="text-sm text-muted-foreground">Provider-held funds and settlements are simulated. AkuMart never takes custody.</p>
        </div>
        <Button variant="outline" onClick={() => downloadCsv("akumart-settlements.csv", rows.map(({ o, s }) => ({ order: o.id, payment: o.payment, buyerTotal: s.buyerTotal, sellerPayout: s.sellerPayout, partnerPayout: s.partnerPayout, sellerFee: s.sellerCommission, partnerFee: s.partnerCommission })))}>
          <Download /> Export settlements CSV
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat dark label="Held by provider" value={naira(held)} />
        <Stat label="Fees earned (released)" value={naira(released)} hint={`${settings.sellerFee}% seller · ${settings.partnerFee}% partner`} />
        <Stat label="Redemptions to review" value={redemptions.filter((r) => r.status === "pending_review").length} />
      </div>
      <Table head={["Order", "Buyer total", "Seller payout", "Partner payout", "AkuMart fees", "Payment", ""]}>
        {rows.length === 0 && (
          <tr>
            <td className={td} colSpan={7}>
              No paid orders yet.
            </td>
          </tr>
        )}
        {rows.map(({ o, s }) => (
          <tr key={o.id}>
            <td className={td}>
              {o.id}
              <p className="text-xs text-muted-foreground">{o.title}</p>
            </td>
            <td className={td}>{naira(s.buyerTotal)}</td>
            <td className={td}>{naira(s.sellerPayout)}</td>
            <td className={td}>{naira(s.partnerPayout)}</td>
            <td className={td}>{naira(s.akumartRevenue)}</td>
            <td className={td}>
              <StatusChip status={o.payment} />
            </td>
            <td className={td}>{o.payment === "held" && o.status !== "disputed" && <Button size="sm" variant="outline" onClick={() => hold(o.id, true)}>Place hold</Button>}</td>
          </tr>
        ))}
      </Table>
      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">Reward redemptions</h2>
        <Table head={["User", "Reward", "Points", "Status", "Date", ""]}>
          {redemptions.length === 0 && (
            <tr>
              <td className={td} colSpan={6}>
                None yet.
              </td>
            </tr>
          )}
          {redemptions.map((r) => (
            <tr key={r.id}>
              <td className={td}>{r.userName}</td>
              <td className={td}>{r.rewardName}</td>
              <td className={td}>{r.cost.toLocaleString()}</td>
              <td className={td}>
                <StatusChip status={r.status} />
              </td>
              <td className={td}>{dt(r.at)}</td>
              <td className={td}>
                {r.status === "pending_review" && (
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => decideRedemption(r.id, true, actor)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => decideRedemption(r.id, false, actor)}>Reject</Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
