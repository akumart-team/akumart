import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { PageTitle, Panel } from "@/components/app-ui";
import { useDB, useMe } from "@/lib/store";
import { cn } from "@/lib/utils";
import { DemoTag } from "@/components/brand";

export const Route = createFileRoute("/app/akubin/leaderboard")({
  component: Leaderboard,
});

const PERIODS = { week: "This week", month: "This month", all: "All time" } as const;

function Leaderboard() {
  const me = useMe()!;
  const seed = useDB((d) => d.leaderboard);
  const [p, setP] = useState<keyof typeof PERIODS>("week");
  const since = { week: 7, month: 30, all: 100000 }[p] * 86400_000;
  const myKg = +me.deposits.filter((d) => d.status === "verified" && Date.now() - new Date(d.at).getTime() < since).reduce((s, d) => s + d.kg, 0).toFixed(2);
  const rows = [...seed.map((s) => ({ name: s.name, city: s.city, kg: s[p], me: false })), { name: `${me.name} (you)`, city: me.city ?? "—", kg: myKg, me: true }].sort((a, b) => b.kg - a.kg);
  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow="AkuBin" title="Leaderboard" intro="Ranked by verified deposited weight — not points. Count-only items use verified weight equivalents." />
      <div className="mb-6 inline-flex rounded-full border bg-card p-1">
        {(Object.keys(PERIODS) as (keyof typeof PERIODS)[]).map((k) => (
          <button key={k} onClick={() => setP(k)} className={cn("rounded-full px-5 py-2 text-sm font-semibold", p === k ? "bg-forest text-forest-foreground" : "text-muted-foreground")}>
            {PERIODS[k]}
          </button>
        ))}
      </div>
      <Panel action={<DemoTag>Demo participants</DemoTag>} title={PERIODS[p]}>
        <ol className="divide-y">
          {rows.map((r, i) => (
            <li key={r.name} className={cn("flex items-center gap-4 py-3", r.me && "-mx-3 rounded-xl bg-secondary px-3")}>
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-full font-display font-bold", i < 3 ? "bg-lime text-lime-foreground" : "bg-muted")}>{i < 3 ? <Trophy className="size-4" /> : i + 1}</span>
              <div className="flex-1">
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.city}</p>
              </div>
              <p className="font-display text-lg font-bold">{r.kg.toFixed(1)} kg</p>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
