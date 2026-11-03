import { createFileRoute } from "@tanstack/react-router";
import { Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { useDB } from "@/lib/store";
import { decidePartner } from "@/lib/actions";
import { useActor } from "@/lib/admin";
import { dt } from "@/lib/format";

export const Route = createFileRoute("/admin/partners")({
  component: Partners,
});

function Partners() {
  const partners = useDB((d) => d.partners);
  const enquiries = useDB((d) => d.enquiries.filter((e) => e.kind === "logistics"));
  const actor = useActor();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display mb-6 text-3xl">Logistics partners</h1>
        <Table head={["Partner", "Base / areas", "Materials", "Capacity", "Docs", "Status", "Actions"]}>
          {partners.map((p) => (
            <tr key={p.id}>
              <td className={td}>
                <p className="font-medium">{p.business}</p>
                <p className="text-xs text-muted-foreground">
                  {p.contact} · applied {dt(p.appliedAt)}
                </p>
              </td>
              <td className={td}>
                {p.base}
                <p className="text-xs text-muted-foreground">{p.areas.join(", ")}</p>
              </td>
              <td className={td + " text-xs capitalize"}>{p.materials.join(", ")}</td>
              <td className={td}>{p.capacityKg.toLocaleString()} kg</td>
              <td className={td + " text-xs"}>{p.docs.join(", ")}</td>
              <td className={td}>
                <StatusChip status={p.status} />
              </td>
              <td className={td}>
                <div className="flex flex-wrap gap-1">
                  {p.status !== "approved" && <Button size="sm" onClick={() => decidePartner(p.id, "approved", actor)}>Approve</Button>}
                  {p.status === "pending" && <Button size="sm" variant="outline" onClick={() => decidePartner(p.id, "rejected", actor, "Documents incomplete (demo)")}>Reject</Button>}
                  {p.status === "approved" && <Button size="sm" variant="ghost" onClick={() => decidePartner(p.id, "suspended", actor, "Suspended pending complaint review (demo)")}>Suspend</Button>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">Partner enquiries from contact form</h2>
        <Table head={["Ref", "Business", "Contact", "Areas", "Received"]}>
          {enquiries.length === 0 ? (
            <tr>
              <td className={td} colSpan={5}>
                None yet.
              </td>
            </tr>
          ) : (
            enquiries.map((e) => (
              <tr key={e.id}>
                <td className={td}>{e.id}</td>
                <td className={td}>{e.data.business}</td>
                <td className={td}>
                  {e.name} · {e.email}
                </td>
                <td className={td}>{e.data.areas}</td>
                <td className={td}>{dt(e.at)}</td>
              </tr>
            ))
          )}
        </Table>
      </div>
    </div>
  );
}
