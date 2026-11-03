import { createFileRoute, Link } from "@tanstack/react-router";
import { Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { useDB, update } from "@/lib/store";
import { useActor } from "@/lib/admin";
import { naira, nowIso } from "@/lib/format";

export const Route = createFileRoute("/admin/listings")({
  component: Listings,
});

function Listings() {
  const listings = useDB((d) => [...d.listings].sort((a, b) => (a.status === "flagged" ? -1 : 0) - (b.status === "flagged" ? -1 : 0)));
  const actor = useActor();
  const set = (id: string, status: "published" | "paused") =>
    update((d) => {
      const l = d.listings.find((x) => x.id === id)!;
      l.status = status;
      l.flagReason = undefined;
      d.audit.unshift({ at: nowIso(), actor, action: `Listing ${status === "published" ? "restored" : "removed"}`, detail: id });
    });
  return (
    <div>
      <h1 className="text-display mb-6 text-3xl">Listing moderation</h1>
      <Table head={["Listing", "Seller", "Price", "Status", "Actions"]}>
        {listings.map((l) => (
          <tr key={l.id}>
            <td className={td}>
              <Link to="/marketplace/$id" params={{ id: l.id }} className="font-medium hover:text-primary">
                {l.title}
              </Link>
              {l.flagReason && <p className="text-xs text-destructive">{l.flagReason}</p>}
            </td>
            <td className={td}>{l.sellerName}</td>
            <td className={td}>{naira(l.price)}/{l.unit}</td>
            <td className={td}>
              <StatusChip status={l.status} />
            </td>
            <td className={td}>
              {l.status === "flagged" && (
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => set(l.id, "published")}>Restore</Button>
                  <Button size="sm" variant="destructive" onClick={() => set(l.id, "paused")}>Remove</Button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
