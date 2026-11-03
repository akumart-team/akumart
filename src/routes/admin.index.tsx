import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Panel, Stat } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { useDB } from "@/lib/store";
import { naira, downloadCsv } from "@/lib/format";
import { checkoutSplit } from "@/lib/rules";
import { MATERIALS } from "@/lib/seed";

export const Route = createFileRoute("/admin/")({
  component: Overview,
});

function Overview() {
  const db = useDB((d) => d);
  const paid = db.orders.filter((o) => ["paid", "picked_up", "in_transit", "delivered", "proof_uploaded", "settled", "disputed"].includes(o.status));
  const gmv = paid.reduce((s, o) => s + o.qty * o.unitPrice, 0);
  const fees = paid.reduce((s, o) => s + checkoutSplit(o.qty * o.unitPrice, o.quotes.find((q) => q.id === o.quoteId)?.amount ?? 0, db.settings).akumartRevenue, 0);
  const deposits = db.users.flatMap((u) => u.deposits.filter((d) => d.status === "verified"));
  const kg = deposits.reduce((s, d) => s + d.kg, 0);
  const points = db.users.reduce((s, u) => s + u.points, 0);
  const adRev = db.campaigns.filter((c) => c.payment === "paid").reduce((s, c) => s + c.price, 0);
  const chart = MATERIALS.map((m) => ({ m: m.label, listings: db.listings.filter((l) => l.material === m.id && l.status === "published").length }));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display text-3xl">Overview</h1>
          <p className="text-sm text-muted-foreground">All figures computed from simulated prototype data.</p>
        </div>
        <Button variant="outline" onClick={() => downloadCsv("akumart-orders.csv", db.orders.map((o) => ({ id: o.id, title: o.title, buyer: o.buyerName, seller: o.sellerName, qty: o.qty, unit: o.unit, unitPrice: o.unitPrice, status: o.status, payment: o.payment })))}>
          <Download /> Export orders CSV
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat dark label="Users" value={db.users.length} hint={`${db.users.filter((u) => !u.demo).length} created in this session`} />
        <Stat label="Published listings" value={db.listings.filter((l) => l.status === "published").length} hint={`${db.listings.filter((l) => l.status === "flagged").length} flagged`} />
        <Stat label="GMV (paid orders)" value={naira(gmv)} />
        <Stat label="Fee revenue (provisional)" value={naira(fees)} />
        <Stat label="AkuBin verified weight" value={`${kg.toFixed(1)} kg`} />
        <Stat label="Points liability" value={points.toLocaleString()} hint={`≈ ${naira(points * db.settings.pointValueNaira)}`} />
        <Stat label="Ad revenue (paid)" value={naira(adRev)} />
        <Stat label="Bins online" value={`${db.bins.filter((b) => b.status === "online").length}/${db.bins.length}`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Active listings by material">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="listings" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Queues">
          <ul className="divide-y text-sm">
            {[
              ["Verifications pending review", db.users.filter((u) => u.verification.basic === "pending_review" || u.verification.full === "pending_review").length],
              ["Partner applications", db.partners.filter((p) => p.status === "pending").length],
              ["Flagged listings", db.listings.filter((l) => l.status === "flagged").length],
              ["Open tickets", db.tickets.filter((t) => t.status !== "resolved").length],
              ["Open disputes", db.orders.filter((o) => o.dispute && o.dispute.status !== "resolved").length],
              ["Redemptions to review", db.redemptions.filter((r) => r.status === "pending_review").length],
              ["Ads to review", db.campaigns.filter((c) => c.status === "pending_review").length],
              ["News candidates", db.news.filter((n) => n.status === "proposed").length],
            ].map(([k, v]) => (
              <li key={k as string} className="flex justify-between py-2.5">
                <span>{k}</span>
                <strong>{v}</strong>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
