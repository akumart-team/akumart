import { PointsSummary } from "./points-summary";
import { Link } from "@tanstack/react-router";
import { Recycle } from "lucide-react";
import { Panel } from "@/components/app-ui";
import { rows, text, field } from "@/lib/api/services/resources";
import { QueryState, useResource } from "./data-view";

export function WorkspaceAkuBin() {
  return <RecyclingOverview />;
}
function RecyclingOverview() {
  const deposits = useResource("/akubin/me/deposits?limit=5");
  return (
    <section aria-label="AkuBin in your workspace" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
          <Recycle className="h-6 w-6 text-primary" />
          My AkuBin
        </h2>
        <div className="flex gap-4 text-sm font-semibold text-primary">
          <Link to="/app/akubin">View recycling</Link>
          <Link to="/app/akubin/rewards">Rewards</Link>
        </div>
      </div>
      <PointsSummary />
      <Panel title="Recent recycling activity">
        <QueryState query={deposits}>
          {(data) =>
            rows(data).length ? (
              <ul className="divide-y">
                {rows(data).map((deposit) => (
                  <li
                    key={text(deposit.id)}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium capitalize">
                        {text(deposit.material)} · {text(deposit.weightKg)} kg
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {text(field(deposit, "bin.code"))} ·{" "}
                        {new Date(text(deposit.createdAt)).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {text(deposit.awardedPoints)} points
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {text(deposit.status)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recycling activity recorded yet.</p>
            )
          }
        </QueryState>
      </Panel>
    </section>
  );
}
