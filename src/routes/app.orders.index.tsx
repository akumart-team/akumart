import { createFileRoute, Link } from "@tanstack/react-router";
import { PageTitle, Empty, Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { useDB, useMe } from "@/lib/store";
import { naira, day } from "@/lib/format";

export const Route = createFileRoute("/app/orders/")({
  component: Orders,
});

function Orders() {
  const me = useMe()!;
  const orders = useDB((d) => d.orders.filter((o) => o.buyerId === me.id || o.sellerId === me.id));
  return (
    <div>
      <PageTitle eyebrow="Transactions" title="Orders" intro="Private transaction details, fulfilment, payment and settlement." />
      {orders.length === 0 ? (
        <Empty title="No orders yet" body="Orders are created when an offer is accepted.">
          <Button asChild>
            <Link to="/marketplace">Browse Marketplace</Link>
          </Button>
        </Empty>
      ) : (
        <Table head={["Order", "Role", "Material", "Value", "Fulfilment", "Status", "Payment", "Created"]}>
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-muted/50">
              <td className={td}>
                <Link to="/app/orders/$id" params={{ id: o.id }} className="font-medium text-primary hover:underline">
                  {o.id}
                </Link>
                <p className="text-xs text-muted-foreground">{o.title}</p>
              </td>
              <td className={td}>{o.buyerId === me.id ? "Buyer" : "Seller"}</td>
              <td className={td + " capitalize"}>{o.material}</td>
              <td className={td}>{naira(o.qty * o.unitPrice)}</td>
              <td className={td + " capitalize"}>{o.fulfilment ?? ", "}</td>
              <td className={td}>
                <StatusChip status={o.status} />
              </td>
              <td className={td}>
                <StatusChip status={o.payment} />
              </td>
              <td className={td}>{day(o.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
