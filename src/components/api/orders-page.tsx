import { useEffect, useState } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Package, Receipt } from "lucide-react";
import { useProfile } from "@/lib/api/hooks/use-api";
import { accountHome, tradingMode } from "@/lib/api/account-roles";
import { rows, text } from "@/lib/api/services/resources";
import { dateLabel, decimalLabel, nairaLabel } from "@/lib/api/display";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { QueryState, useResource } from "./data-view";
import {
  WorkflowEmpty,
  WorkflowHeader,
  WorkflowMetric,
  WorkflowPagination,
  WorkflowSearch,
} from "./workflow-ui";
export function Orders() {
  const me = useProfile();
  const mode = tradingMode(me.data?.preferences);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [mode]);
  const params = new URLSearchParams({ mode: mode || "buyer", page: String(page), limit: "12" });
  if (search) params.set("search", search);
  const query = useResource("/orders?" + params, "private", Boolean(mode));
  if (me.data && !mode) return <Navigate to={accountHome(me.data.preferences?.marketRole)} />;
  if (!mode) return <p role="status">Loading your orders…</p>;
  const buyer = mode === "buyer";
  const total = query.data?.pagination?.total;
  return (
    <div className="w-full min-w-0 space-y-6">
      <WorkflowHeader
        title={buyer ? "Purchases" : "Sales & orders"}
        eyebrow={buyer ? "Marketplace / Buying" : "Marketplace / Selling"}
        icon={Receipt}
        intro={
          buyer
            ? "Follow your material purchases, delivery progress and payment status in one place."
            : "Keep track of accepted orders, prepare collections and follow each sale through delivery."
        }
        actions={
          <Button
            asChild
            variant="outline"
            className="h-11 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Link to={buyer ? "/app/marketplace" : "/app/listings"}>
              {buyer ? "Browse materials" : "Manage listings"}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">
          {buyer ? "Your purchases" : "Your sales"}
        </h2>
        <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          {total ?? "—"} {search ? "matching " : ""}order{total === 1 ? "" : "s"}
        </span>
      </div>
      <WorkflowSearch
        label="Search orders"
        placeholder="Search by order title or location"
        value={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />
      <QueryState query={query}>
        {(data) =>
          rows(data).length ? (
            <div className="grid min-w-0 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {rows(data).map((order) => (
                <article
                  aria-labelledby={"order-" + order.id}
                  key={text(order.id)}
                  className="flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-soft"
                >
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                        <Package className="h-5 w-5" />
                      </div>
                      <StatusChip status={text(order.status)} />
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Order #{text(order.id).slice(0, 8)}
                    </p>
                    <h3
                      id={"order-" + order.id}
                      className="mt-2 break-words font-display text-xl font-semibold leading-snug"
                    >
                      <Link
                        to="/app/orders/$id"
                        params={{ id: text(order.id) }}
                        className="hover:text-primary"
                      >
                        {text(order.title)}
                      </Link>
                    </h3>
                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
                      <WorkflowMetric label="Quantity">
                        {decimalLabel(order.quantity)} {text(order.unit)}
                      </WorkflowMetric>
                      <WorkflowMetric label="Price per unit">
                        {nairaLabel(order.unitPrice)}
                      </WorkflowMetric>
                      <WorkflowMetric label="Placed">{dateLabel(order.createdAt)}</WorkflowMetric>
                      <WorkflowMetric label="Payment">
                        <StatusChip status={text(order.paymentStatus)} />
                      </WorkflowMetric>
                    </dl>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t bg-muted/15 px-5 py-4 sm:px-6">
                    <span className="text-xs capitalize text-muted-foreground">
                      {text(order.material)} · {text(order.pickupCity)}
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/app/orders/$id" params={{ id: text(order.id) }}>
                        View order
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <WorkflowEmpty
              title={
                search
                  ? "No matching orders"
                  : buyer
                    ? "Your purchases will appear here"
                    : "Your sales will appear here"
              }
              body={
                search
                  ? "Try another title or location, or clear your search."
                  : "An order is created when an offer is accepted. You can then follow its next steps here."
              }
              action={
                <Button asChild>
                  <Link to="/app/offers">
                    View offers
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
          )
        }
      </QueryState>
      <WorkflowPagination
        page={page}
        total={total ?? 0}
        busy={query.isFetching}
        onChange={setPage}
      />
    </div>
  );
}
