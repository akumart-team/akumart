import { createFileRoute } from "@tanstack/react-router";
import { Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { useDB } from "@/lib/store";
import { decideCampaign } from "@/lib/actions";
import { useActor } from "@/lib/admin";
import { naira } from "@/lib/format";
import { img } from "@/lib/images";

export const Route = createFileRoute("/admin/ads")({
  component: Ads,
});

function Ads() {
  const campaigns = useDB((d) => d.campaigns);
  const actor = useActor();
  return (
    <div>
      <h1 className="text-display mb-2 text-3xl">Advertising review</h1>
      <p className="mb-6 text-sm text-muted-foreground">Only paid campaigns can be reviewed. Approved campaigns appear as labelled sponsored posts in the feed.</p>
      <Table head={["Creative", "Advertiser", "Targeting", "Package", "Payment", "Status", ""]}>
        {campaigns.map((c) => (
          <tr key={c.id}>
            <td className={td}>
              <div className="flex items-center gap-3">
                <img src={img(c.image)} alt="" className="h-10 w-14 rounded-lg object-cover" />
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="max-w-xs truncate text-xs text-muted-foreground">{c.body}</p>
                </div>
              </div>
            </td>
            <td className={td}>{c.advertiser}</td>
            <td className={td + " text-xs"}>
              {c.locations.join(", ")}
              <br />
              {c.materials.join(", ") || "all materials"} · {c.roles.join(", ") || "all roles"}
            </td>
            <td className={td}>
              {c.pkg} · {naira(c.price)}
            </td>
            <td className={td}>
              <StatusChip status={c.payment} />
            </td>
            <td className={td}>
              <StatusChip status={c.status} />
            </td>
            <td className={td}>
              {c.status === "pending_review" && (
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => decideCampaign(c.id, true, actor)}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decideCampaign(c.id, false, actor, "Creative does not meet ad policy (demo)")}>Reject</Button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
