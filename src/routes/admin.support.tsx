import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel, Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/field";
import { useDB, update } from "@/lib/store";
import { decideDispute } from "@/lib/actions";
import { useActor } from "@/lib/admin";
import { dt, nowIso } from "@/lib/format";
import type { Ticket } from "@/lib/types";

export const Route = createFileRoute("/admin/support")({
  component: Support,
});

function Support() {
  const tickets = useDB((d) => d.tickets);
  const disputes = useDB((d) => d.orders.filter((o) => o.dispute));
  const actor = useActor();
  const mut = (id: string, fn: (t: Ticket) => void, action: string) =>
    update((d) => {
      fn(d.tickets.find((t) => t.id === id)!);
      d.audit.unshift({ at: nowIso(), actor, action, detail: id });
    });
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display mb-6 text-3xl">Disputes</h1>
        {disputes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No disputes.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {disputes.map((o) => (
              <Panel key={o.id} title={`${o.id} · ${o.title}`} action={<StatusChip status={o.dispute!.status} />}>
                <p className="text-sm">
                  <strong>Reason:</strong> {o.dispute!.reason}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Evidence:</strong> {o.dispute!.evidence}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Buyer {o.buyerName} · Seller {o.sellerName} · Proof: {o.proof ?? "none"}
                </p>
                {o.dispute!.status !== "resolved" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => decideDispute(o.id, "refund", actor)}>Full refund</Button>
                    <Button size="sm" variant="outline" onClick={() => decideDispute(o.id, "partial", actor)}>Partial / adjust</Button>
                    <Button size="sm" variant="ghost" onClick={() => decideDispute(o.id, "release", actor)}>Close & release</Button>
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-muted p-2 text-sm">{o.dispute!.decision}</p>
                )}
                <Link to="/app/orders/$id" params={{ id: o.id }} className="mt-2 inline-block text-xs text-primary">
                  (Order page visible to participants only)
                </Link>
              </Panel>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-display mb-4 text-2xl">Support tickets</h2>
        <Table head={["Ticket", "From", "Subject", "Channel", "Priority", "Assignee", "Status", ""]}>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td className={td}>
                {t.id}
                <p className="text-xs text-muted-foreground">{dt(t.at)}</p>
              </td>
              <td className={td}>
                {t.name}
                <p className="text-xs text-muted-foreground">{t.email}</p>
              </td>
              <td className={td}>
                <p className="font-medium">{t.subject}</p>
                <p className="max-w-xs truncate text-xs text-muted-foreground">{t.message}</p>
              </td>
              <td className={td}>{t.channel.replace("_", " ")}</td>
              <td className={td}>
                <select className={inputCls + " h-8 w-28"} value={t.priority} onChange={(e) => mut(t.id, (x) => (x.priority = e.target.value as Ticket["priority"]), `Priority → ${e.target.value}`)}>
                  {["low", "normal", "high", "urgent"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </td>
              <td className={td}>{t.assignee ?? "—"}</td>
              <td className={td}>
                <StatusChip status={t.status} />
              </td>
              <td className={td}>
                <div className="flex gap-1">
                  {t.status === "open" && <Button size="sm" variant="outline" onClick={() => mut(t.id, (x) => { x.status = "assigned"; x.assignee = actor; }, "Ticket assigned")}>Assign to me</Button>}
                  {t.status !== "resolved" && <Button size="sm" onClick={() => mut(t.id, (x) => (x.status = "resolved"), "Ticket resolved")}>Resolve</Button>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
