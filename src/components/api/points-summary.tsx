import { Wallet, Leaf, CircleCheck } from "lucide-react";
import { Panel } from "@/components/app-ui";
import { decimalLabel, nairaLabel } from "@/lib/api/display";
import { record } from "@/lib/api/services/resources";
import { QueryState, useResource } from "./data-view";

export function PointsSummary({
  title = "AkuBin points",
  walletOnly = false,
  showVerified = false,
}: {
  title?: string;
  walletOnly?: boolean;
  showVerified?: boolean;
}) {
  const query = useResource(walletOnly ? "/akubin/me/wallet" : "/akubin/me/summary");
  return (
    <Panel title={title}>
      <QueryState query={query}>
        {(data) => {
          const row = record(data);
          const validMoney = (value: unknown) =>
            typeof value === "string" && /^\d+(\.\d+)?$/.test(value);
          const equivalent = (value: unknown) =>
            validMoney(value) ? (
              <>
                <span aria-hidden="true">{"\u2248"} </span>
                <span className="sr-only">Equivalent value: </span>
                {nairaLabel(value)}
              </>
            ) : (
              <span className="text-xs">Equivalent value unavailable</span>
            );
          return (
            <>
              <div className={walletOnly ? "" : "grid gap-3 lg:grid-cols-5"}>
                <div
                  className={`min-w-0 rounded-2xl bg-forest p-5 text-forest-foreground sm:p-6 ${walletOnly ? "sm:flex sm:items-center sm:justify-between sm:gap-8" : "lg:col-span-3"}`}
                >
                  <dl className="min-w-0">
                    <dt className="flex items-center gap-2.5 text-sm font-medium text-forest-foreground/80">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <Wallet aria-hidden="true" className="size-4" />
                      </span>
                      Available points
                    </dt>
                    <dd className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="break-all font-display text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
                        {decimalLabel(row.balancePoints)}
                      </span>
                      <span className="text-sm text-forest-foreground/65">pts</span>
                    </dd>
                  </dl>
                  <dl
                    className={`mt-5 flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-white/15 pt-4 ${walletOnly ? "sm:mt-0 sm:block sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0" : ""}`}
                  >
                    <dt className="text-xs text-forest-foreground/65">Naira equivalent</dt>
                    <dd
                      className={`break-all font-display text-xl font-semibold tracking-tight text-lime tabular-nums ${walletOnly ? "sm:mt-2 sm:text-3xl" : ""}`}
                    >
                      {equivalent(row.balanceValueNaira)}
                    </dd>
                  </dl>
                </div>
                {!walletOnly && (
                  <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
                    <dl className="flex flex-1 flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/25 px-5 py-4 sm:px-6">
                      <div className="min-w-0">
                        <dt className="text-sm text-muted-foreground">Lifetime points</dt>
                        <dd className="mt-1 flex flex-wrap items-baseline gap-1.5">
                          <span className="break-all font-display text-3xl font-semibold tracking-tight tabular-nums">
                            {decimalLabel(row.lifetimeEarnedPoints)}
                          </span>
                          <span className="text-xs text-muted-foreground">pts</span>
                        </dd>
                      </div>
                      <div className="min-w-0 text-right">
                        <dt className="sr-only">Lifetime equivalent at the current rate</dt>
                        <dd className="break-all text-sm font-medium text-primary tabular-nums">
                          {equivalent(row.lifetimeEarnedValueNaira)}
                        </dd>
                        <dd className="mt-1 text-[11px] text-muted-foreground">Total earned</dd>
                      </div>
                    </dl>
                    <dl
                      className={`grid rounded-2xl border bg-card ${showVerified ? "grid-cols-2 divide-x" : "grid-cols-1"}`}
                    >
                      <div className="min-w-0 px-4 py-3.5 sm:px-5">
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Leaf aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
                          Recycled (kg)
                        </dt>
                        <dd className="mt-1.5 break-all text-xl font-semibold tabular-nums">
                          {decimalLabel(row.weightKg)}
                        </dd>
                      </div>
                      {showVerified && (
                        <div className="min-w-0 px-4 py-3.5 sm:px-5">
                          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CircleCheck
                              aria-hidden="true"
                              className="size-3.5 shrink-0 text-primary"
                            />
                            Verified deposits
                          </dt>
                          <dd className="mt-1.5 break-all text-xl font-semibold tabular-nums">
                            {decimalLabel(row.verifiedDepositCount)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] leading-relaxed text-muted-foreground">
                {validMoney(row.pointValueNaira) && (
                  <p>
                    1 point = {nairaLabel(row.pointValueNaira)}{" "}
                    <span className="mx-1" aria-hidden="true">
                      {"\u00b7"}
                    </span>{" "}
                    Current rate
                  </p>
                )}
                <p>Reward value, not a cash balance.</p>
              </div>
            </>
          );
        }}
      </QueryState>
    </Panel>
  );
}
