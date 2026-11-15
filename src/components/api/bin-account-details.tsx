import { useState } from "react";
import { rows, record, text } from "@/lib/api/services/resources";
import { DataTable, QueryState, useResource } from "./data-view";
export function BinSessionDetails({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const query = useResource("/akubin/me/sessions/" + encodeURIComponent(id), "private", open);
  return (
    <details
      className="min-w-56 rounded-xl border p-3"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm font-medium text-primary">Session details</summary>
      {open && (
        <div className="mt-4">
          <QueryState query={query}>
            {(data) => {
              const session = record(data);
              return (
                <dl className="space-y-2 text-sm">
                  {[
                    ["status", "Status"],
                    ["startedAt", "Started"],
                    ["lastActivityAt", "Last activity"],
                    ["expiresAt", "Expires"],
                    ["endedAt", "Ended"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd>{text(session[key])}</dd>
                    </div>
                  ))}
                </dl>
              );
            }}
          </QueryState>
        </div>
      )}
    </details>
  );
}
export function PointsHistory() {
  return (
    <details className="rounded-3xl border bg-card p-5">
      <summary className="cursor-pointer font-semibold">Points activity</summary>
      <div className="mt-5">
        <DataTable
          title="Points credits and debits"
          path="/akubin/me/points-ledger"
          columns={[
            { key: "kind", label: "Activity" },
            { key: "amount", label: "Points" },
            { key: "reason", label: "Reason" },
            { key: "createdAt", label: "Recorded" },
          ]}
        />
      </div>
    </details>
  );
}
export function RewardRules() {
  const [open, setOpen] = useState(false);
  const query = useResource("/akubin/reward-rules", "public", open);
  return (
    <details
      className="rounded-3xl border bg-card p-5"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer font-semibold">How recycling points work</summary>
      {open && (
        <div className="mt-5">
          <QueryState query={query}>
            {(data) => {
              const rules = record(data);
              return (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Current configured value: ₦{text(rules.pointValueNaira)} per point. Points are
                    not a cash wallet. Minimums: {text(rules.airtimeMinPoints)} points for airtime;{" "}
                    {text(rules.cashMinPoints)} points for cash requests.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {rows(rules.rates).map((rate) => (
                      <div className="rounded-xl bg-muted/40 p-4" key={text(rate.material)}>
                        <p className="text-sm font-semibold capitalize">{text(rate.material)}</p>
                        <p className="mt-1 text-sm">{text(rate.pointsPerKg)} points / kg</p>
                      </div>
                    ))}
                  </div>
                </>
              );
            }}
          </QueryState>
        </div>
      )}
    </details>
  );
}
