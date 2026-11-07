import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Gift, Trophy, Recycle } from "lucide-react";
import { PageTitle, Panel, Stat, Empty } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BinRow } from "@/components/bin-map";
import { MarketplacePromo } from "@/components/promo-cards";
import { useDB, useMe } from "@/lib/store";
import { dt } from "@/lib/format";

export const Route = createFileRoute("/app/akubin/")({
  component: AkuBinDash,
});

function AkuBinDash() {
  const me = useMe()!;
  const bins = useDB((d) => d.bins.filter((b) => b.status === "online").slice(0, 3));
  const rewards = useDB((d) => d.rewards);
  const settings = useDB((d) => d.settings);
  const verified = me.deposits.filter((d) => d.status === "verified");
  const kg = verified.reduce((s, d) => s + d.kg, 0);
  const next = rewards.filter((r) => r.cost > me.points).sort((a, b) => a.cost - b.cost)[0];
  return (
    <div>
      <PageTitle
        eyebrow="AkuBin"
        title="Recycle & Earn"
        intro="No Marketplace verification needed here."
        actions={
          <Button asChild variant="forest">
            <Link to="/app/akubin/map">
              <MapPin /> Find a bin
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat dark label="Points balance" value={me.points.toLocaleString()} hint={`≈ ₦${(me.points * settings.pointValueNaira).toLocaleString()} at current rate`} />
        <Stat label="Verified deposits" value={verified.length} />
        <Stat label="Verified weight" value={`${kg.toFixed(2)} kg`} hint="Used for leaderboard ranking" />
        <Stat label="Rejected deposits" value={me.deposits.length - verified.length} hint="Earn 0 points" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Recent activity" action={<Link to="/app/akubin/rewards" className="text-sm font-semibold text-primary">Rewards →</Link>}>
          {me.deposits.length === 0 ? (
            <Empty title="No deposits yet" body="Scan a bin’s QR code or open a bin page to start your first deposit.">
              <Button asChild>
                <Link to="/akubin/bin/$binId" params={{ binId: "BIN-001" }}>
                  <Recycle /> Try BIN-001
                </Link>
              </Button>
            </Empty>
          ) : (
            <ul className="divide-y">
              {me.deposits.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium capitalize">
                      {d.material} · {d.measure === "weight" ? `${d.kg} kg` : `${d.count} items (${d.kg} kg eq.)`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.binId} · {dt(d.at)}
                      {d.reason && ` · ${d.reason}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusChip status={d.status} />
                    <p className="mt-1 font-semibold">+{d.points}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="space-y-6">
          {next && (
            <Panel title="Next reward">
              <p className="font-medium">{next.name}</p>
              <Progress value={(me.points / next.cost) * 100} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {me.points.toLocaleString()} / {next.cost.toLocaleString()} pts
              </p>
            </Panel>
          )}
          <Panel title="Nearby bins" action={<Link to="/app/akubin/map" className="text-sm font-semibold text-primary">View map →</Link>}>
            <div className="space-y-2">
              {bins.map((b) => (
                <BinRow key={b.id} b={b} />
              ))}
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline">
              <Link to="/app/akubin/leaderboard">
                <Trophy /> Leaderboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/akubin/rewards">
                <Gift /> Redeem
              </Link>
            </Button>
          </div>
          <MarketplacePromo />
        </div>
      </div>
    </div>
  );
}
