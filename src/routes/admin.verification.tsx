import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { Panel, Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/field";
import { useDB } from "@/lib/store";
import { adminDecideVerification } from "@/lib/actions";
import { useActor } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/verification")({
  component: AdminVerification,
});

const REDACT = ["idNumber", "idNumberMasked"];

function AdminVerification() {
  const users = useDB((d) => d.users);
  const actor = useActor();
  const [filter, setFilter] = useState("queue");
  const [open, setOpen] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const list = users.filter((u) => (filter === "queue" ? [u.verification.basic, u.verification.full].some((s) => s === "pending_review" || s === "checking") : filter === "all" ? true : u.verification.basic === filter));
  return (
    <div>
      <h1 className="text-display mb-2 text-3xl">Verification review</h1>
      <p className="mb-6 text-sm text-muted-foreground">Redacted previews only. Decisions update the user’s status and trading permissions immediately.</p>
      <div className="mb-4 flex gap-2">
        {["queue", "all", "approved", "needs_resubmission", "not_started"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full border px-3 py-1 text-sm", filter === f && "border-forest bg-forest text-forest-foreground")}>
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <Table head={["User", "Type", "Basic", "Full", ""]}>
        {list.length === 0 && (
          <tr>
            <td className={td} colSpan={5}>
              Nothing in this view.
            </td>
          </tr>
        )}
        {list.map((u) => (
          <Fragment key={u.id}>
            <tr>
              <td className={td}>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}{u.demo && " · seed"}</p>
              </td>
              <td className={td + " capitalize"}>{u.verification.type ?? "—"}</td>
              <td className={td}>
                <StatusChip status={u.verification.basic} />
              </td>
              <td className={td}>
                <StatusChip status={u.verification.full} />
              </td>
              <td className={td}>
                <Button size="sm" variant="outline" onClick={() => setOpen(open === u.id ? null : u.id)}>
                  Review
                </Button>
              </td>
            </tr>
            {open === u.id && (
              <tr>
                <td colSpan={5} className="bg-muted/50 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Panel title="Submitted data (redacted)">
                      <dl className="space-y-1 text-sm">
                        {Object.entries(u.verification.data).filter(([k]) => !REDACT.includes(k)).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">{k}</dt>
                            <dd className="truncate">{k.toLowerCase().includes("address") ? v.slice(0, 6) + "…" : v}</dd>
                          </div>
                        ))}
                        {u.verification.data.idNumberMasked && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">ID number</dt>
                            <dd>{u.verification.data.idNumberMasked}</dd>
                          </div>
                        )}
                        {!Object.keys(u.verification.data).length && <p className="text-muted-foreground">No submission.</p>}
                      </dl>
                      <p className="mt-3 text-xs text-muted-foreground">Automated check outcome: {u.verification.reason ?? "—"} (DEMO)</p>
                    </Panel>
                    <Panel title="Decision">
                      <input className={inputCls} placeholder="Reason (shown to user, no sensitive data)" value={reason} onChange={(e) => setReason(e.target.value)} />
                      {(["basic", "full"] as const).map((lvl) => (
                        <div key={lvl} className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="w-12 text-sm font-medium capitalize">{lvl}</span>
                          <Button size="sm" onClick={() => adminDecideVerification(u.id, lvl, "approved", reason || undefined, actor)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => adminDecideVerification(u.id, lvl, "needs_resubmission", reason || "Please resubmit clearer documents.", actor)}>
                            Request resubmission
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => adminDecideVerification(u.id, lvl, "rejected", reason || "Verification rejected.", actor)}>
                            Reject
                          </Button>
                        </div>
                      ))}
                      <ul className="mt-4 max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                        {u.verification.history.map((h, i) => (
                          <li key={i}>
                            {h.action} — {h.actor}
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </Table>
    </div>
  );
}
