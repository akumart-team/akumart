import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pencil, Pause, Play } from "lucide-react";
import { PageTitle, Empty, Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { useDB, useMe, update } from "@/lib/store";
import { naira, day } from "@/lib/format";
import { img } from "@/lib/images";

export const Route = createFileRoute("/app/listings/")({
  component: MyListings,
});

function MyListings() {
  const me = useMe()!;
  const mine = useDB((d) => d.listings.filter((l) => l.sellerId === d.sessionUserId));
  const offers = useDB((d) => d.offers);
  return (
    <div>
      <PageTitle
        eyebrow="Seller"
        title="My listings"
        intro={me.prefs.marketRole === "buyer" ? "You signed up as a buyer — you can still sell any time." : undefined}
        actions={
          <Button asChild>
            <Link to="/app/listings/new">
              <Plus /> New listing
            </Link>
          </Button>
        }
      />
      {mine.length === 0 ? (
        <Empty title="No listings yet" body="Create your first listing. You can save drafts before verifying; publishing requires basic verification.">
          <Button asChild>
            <Link to="/app/listings/new">Create listing</Link>
          </Button>
        </Empty>
      ) : (
        <Table head={["Listing", "Status", "Price", "Available", "Offers", "Created", ""]}>
          {mine.map((l) => (
            <tr key={l.id}>
              <td className={td}>
                <div className="flex items-center gap-3">
                  <img src={img(l.image)} alt="" className="h-10 w-14 rounded-lg object-cover" />
                  <div>
                    <Link to="/marketplace/$id" params={{ id: l.id }} className="font-medium hover:text-primary">
                      {l.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{l.id}</p>
                  </div>
                </div>
              </td>
              <td className={td}>
                <StatusChip status={l.status} />
              </td>
              <td className={td}>
                {naira(l.price)}/{l.unit}
              </td>
              <td className={td}>
                {l.qty.toLocaleString()} {l.unit}
              </td>
              <td className={td}>{offers.filter((o) => o.listingId === l.id).length}</td>
              <td className={td}>{day(l.createdAt)}</td>
              <td className={td}>
                <div className="flex gap-1">
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/app/listings/new" search={{ edit: l.id }}>
                      <Pencil /> Edit
                    </Link>
                  </Button>
                  {(l.status === "published" || l.status === "paused") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        update((d) => {
                          const x = d.listings.find((y) => y.id === l.id)!;
                          x.status = x.status === "paused" ? "published" : "paused";
                        })
                      }
                    >
                      {l.status === "paused" ? <Play /> : <Pause />}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
