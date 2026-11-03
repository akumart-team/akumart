import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { QrCode, ExternalLink } from "lucide-react";
import { Panel, Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/field";
import { useDB, update } from "@/lib/store";
import { useActor } from "@/lib/admin";
import { dt, nowIso, uid } from "@/lib/format";
import type { Bin } from "@/lib/types";

export const Route = createFileRoute("/admin/bins")({
  component: Bins,
});

const STATES: Bin["status"][] = ["online", "offline", "full", "maintenance"];

function Bins() {
  const bins = useDB((d) => d.bins);
  const actor = useActor();
  const [sel, setSel] = useState<string | null>(null);
  const [issue, setIssue] = useState("");
  const b = bins.find((x) => x.id === sel);
  const mut = (id: string, fn: (b: Bin) => void, action: string) =>
    update((d) => {
      const x = d.bins.find((y) => y.id === id)!;
      fn(x);
      x.events.unshift({ at: nowIso(), actor, action });
      d.audit.unshift({ at: nowIso(), actor, action, detail: id });
    });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-3xl">AkuBin operations</h1>
        <p className="text-sm text-muted-foreground">Simulate bin state changes and open the public QR page to see how it reacts.</p>
      </div>
      <Table head={["Bin", "Location", "Materials", "Capacity", "Status", "Collector / next", "Simulate", ""]}>
        {bins.map((x) => (
          <tr key={x.id} className={sel === x.id ? "bg-secondary" : ""}>
            <td className={td}>
              <p className="font-mono font-semibold">{x.id}</p>
              <p className="text-xs text-muted-foreground">{x.name}</p>
            </td>
            <td className={td}>
              {x.area}, {x.city}
            </td>
            <td className={td + " text-xs capitalize"}>{x.materials.join(", ")}</td>
            <td className={td}>{x.capacity}%</td>
            <td className={td}>
              <StatusChip status={x.status} />
            </td>
            <td className={td + " text-xs"}>
              {x.collector ?? "Unassigned"}
              <br />
              {dt(x.nextCollection)}
            </td>
            <td className={td}>
              <select className={inputCls + " h-8 w-32"} value={x.status} onChange={(e) => mut(x.id, (b) => (b.status = e.target.value as Bin["status"]), `Status → ${e.target.value} (simulated)`)}>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </td>
            <td className={td}>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setSel(sel === x.id ? null : x.id)}>
                  Details
                </Button>
                <Button asChild size="icon" variant="ghost" aria-label="Open public QR page">
                  <Link to="/akubin/bin/$binId" params={{ binId: x.id }} target="_blank">
                    <ExternalLink />
                  </Link>
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      {b && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title={`QR link · ${b.id}`}>
            <QrCode className="size-20 text-forest" />
            <p className="mt-2 break-all font-mono text-xs">{typeof window !== "undefined" ? window.location.origin : ""}/akubin/bin/{b.id}</p>
            <p className="mt-1 text-xs text-muted-foreground">Short alias: /bin/{b.id}</p>
          </Panel>
          <Panel title="Collections & maintenance">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => mut(b.id, (x) => { x.capacity = 5; if (x.status === "full") x.status = "online"; x.nextCollection = new Date(Date.now() + 3 * 86400_000).toISOString(); }, "Collection completed — emptied")}>
                Mark collected
              </Button>
              <Button size="sm" variant="outline" onClick={() => mut(b.id, (x) => (x.collector = x.collector ? undefined : "Mainland Collect Co."), "Collector assignment changed")}>
                {b.collector ? "Unassign collector" : "Assign collector"}
              </Button>
            </div>
            <div className="mt-4 flex gap-2">
              <input className={inputCls} placeholder="New maintenance issue" value={issue} onChange={(e) => setIssue(e.target.value)} />
              <Button size="sm" disabled={!issue} onClick={() => { mut(b.id, (x) => x.tickets.unshift({ id: uid("MT"), issue, status: "open", at: nowIso() }), `Maintenance ticket: ${issue}`); setIssue(""); }}>
                Add
              </Button>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {b.tickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span>
                    {t.id}: {t.issue}
                  </span>
                  {t.status === "open" ? (
                    <Button size="sm" variant="ghost" onClick={() => mut(b.id, (x) => (x.tickets.find((y) => y.id === t.id)!.status = "resolved"), `Resolved ${t.id}`)}>
                      Resolve
                    </Button>
                  ) : (
                    <StatusChip status="resolved" />
                  )}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Device event history">
            <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
              {b.events.map((e, i) => (
                <li key={i} className="border-l-2 pl-2">
                  <p className="font-medium">{e.action}</p>
                  <p className="text-muted-foreground">
                    {e.actor} · {dt(e.at)} {e.detail && `· ${e.detail}`}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  );
}
