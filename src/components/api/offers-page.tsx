import { useEffect, useState } from "react";
import { Link, Navigate, useRouter } from "@tanstack/react-router";
import { ArrowUpRight, ArrowRight, Handshake, MessageSquare, PencilLine } from "lucide-react";
import { useProfile } from "@/lib/api/hooks/use-api";
import { accountHome, tradingMode } from "@/lib/api/account-roles";
import { rows, record, text, field, type RecordValue } from "@/lib/api/services/resources";
import { dateLabel, decimalLabel, nairaLabel } from "@/lib/api/display";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/status-chip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActionButton, ActionForm, QueryState, useResource } from "./data-view";
import { OfferDetails } from "./offer-details";
import {
  WorkflowEmpty,
  WorkflowHeader,
  WorkflowMetric,
  WorkflowPagination,
  WorkflowSearch,
} from "./workflow-ui";
export function Offers() {
  const me = useProfile();
  const mode = tradingMode(me.data?.preferences);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [counter, setCounter] = useState<RecordValue | null>(null);
  useEffect(() => {
    setPage(1);
    setSearch("");
    setCounter(null);
  }, [mode]);
  const params = new URLSearchParams({ mode: mode || "buyer", page: String(page), limit: "12" });
  if (search) params.set("search", search);
  const query = useResource("/users/me/offers?" + params, "private", Boolean(mode));
  if (me.data && !mode) return <Navigate to={accountHome(me.data.preferences?.marketRole)} />;
  if (!mode) return <p role="status">Loading your offers…</p>;
  const seller = mode === "seller";
  const total = query.data?.pagination?.total;
  const counterTerms = rows(counter?.steps).at(-1);
  return (
    <div className="w-full min-w-0 space-y-6">
      <WorkflowHeader
        title={seller ? "Incoming offers" : "My offers"}
        eyebrow={seller ? "Marketplace / Selling" : "Marketplace / Buying"}
        icon={Handshake}
        intro={
          seller
            ? "Review buyer proposals, negotiate terms and turn the right offer into your next sale."
            : "Keep your negotiations together. Review the latest terms and respond when it is your turn."
        }
        actions={
          <Button
            asChild
            variant="outline"
            className="h-11 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Link to={seller ? "/app/listings" : "/app/marketplace"}>
              {seller ? "My listings" : "Find materials"}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">
          {seller ? "Buyer proposals" : "Your negotiations"}
        </h2>
        <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          {total ?? "—"} {search ? "matching " : ""}offer{total === 1 ? "" : "s"}
        </span>
      </div>
      <WorkflowSearch
        value={search}
        label="Search offers"
        placeholder="Search by material listing title"
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />
      <QueryState query={query}>
        {(data) =>
          rows(data).length ? (
            <div className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
              {rows(data).map((offer) => {
                const last = rows(offer.steps).at(-1);
                const turn =
                  offer.status ===
                  (offer.sellerId === me.data?.id ? "awaiting_seller" : "awaiting_buyer");
                const title = text(field(offer, "listing.title"));
                const unit = text(field(offer, "listing.unit"));
                return (
                  <article
                    aria-labelledby={"offer-" + offer.id}
                    key={text(offer.id)}
                    className="min-w-0 overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-soft"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          Started {dateLabel(offer.createdAt)}
                        </p>
                        <StatusChip status={text(offer.status)} />
                      </div>
                      <h3
                        id={"offer-" + offer.id}
                        className="break-words font-display text-xl font-semibold leading-snug"
                      >
                        {title}
                      </h3>
                      <Link
                        to="/marketplace/$id"
                        params={{ id: text(offer.listingId) }}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                      >
                        View material listing
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                      <dl className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-muted/40 p-4">
                        <WorkflowMetric label="Proposed quantity">
                          {decimalLabel(last?.quantity)} {unit}
                        </WorkflowMetric>
                        <WorkflowMetric label="Unit price">
                          {nairaLabel(last?.unitPrice)}
                        </WorkflowMetric>
                      </dl>
                      <OfferDetails id={text(offer.id)} />
                    </div>
                    {turn ? (
                      <div className="space-y-4 border-t bg-primary/[0.03] px-5 py-4 sm:px-6">
                        <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          Your response is needed
                        </p>
                        <div className="grid grid-cols-2 gap-3 [&>span>button]:w-full [&>span]:w-full">
                          <ActionButton
                            variant="default"
                            path={"/offers/" + offer.id + "/accept"}
                            onSuccess={(value) => {
                              const id = record(value).orderId;
                              if (typeof id === "string")
                                router.navigate({ to: "/app/orders/$id", params: { id } });
                            }}
                          >
                            Accept offer
                          </ActionButton>
                          <ActionButton path={"/offers/" + offer.id + "/reject"}>
                            Decline offer
                          </ActionButton>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setCounter(offer)}
                        >
                          <PencilLine className="mr-2 h-4 w-4" />
                          Make a counteroffer
                        </Button>
                      </div>
                    ) : (
                      <div className="border-t bg-muted/15 px-5 py-4 text-xs text-muted-foreground sm:px-6">
                        {offer.status === "accepted"
                          ? "Offer accepted. Open the negotiation history to view its order."
                          : offer.status === "awaiting_seller" || offer.status === "awaiting_buyer"
                            ? "Waiting for the other party to respond."
                            : "The latest terms and negotiation history remain available above."}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <WorkflowEmpty
              title={
                search
                  ? "No matching offers"
                  : seller
                    ? "Your next sale starts with an offer"
                    : "Ready to start a conversation?"
              }
              body={
                search
                  ? "Try another listing title or clear your search."
                  : seller
                    ? "Incoming offers will appear here when buyers respond to your published listings."
                    : "Find a material listing and send an offer to begin negotiating."
              }
              action={
                <Button asChild>
                  <Link to={seller ? "/app/listings" : "/app/marketplace"}>
                    {seller ? "Manage listings" : "Browse materials"}
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
      <Dialog
        open={Boolean(counter)}
        onOpenChange={(open) => {
          if (!open) setCounter(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto rounded-3xl p-5 sm:p-7">
          <DialogHeader className="text-left">
            <DialogTitle className="pr-6 font-display text-2xl">Make a counteroffer</DialogTitle>
            <DialogDescription className="break-words">
              {text(field(counter, "listing.title"))}. Update the quantity and price; existing
              conditions are kept.
            </DialogDescription>
          </DialogHeader>
          {counter && (
            <ActionForm
              embedded
              title="Counteroffer"
              button="Send counteroffer"
              path={"/offers/" + counter.id + "/counteroffers"}
              fields={[
                {
                  name: "unitPrice",
                  label: "Your unit price (₦)",
                  required: true,
                  inputMode: "decimal",
                  pattern: "(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,2})?",
                  value: text(counterTerms?.unitPrice),
                },
                {
                  name: "quantity",
                  label: "Quantity",
                  required: true,
                  inputMode: "decimal",
                  pattern: "(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,3})?",
                  value: text(counterTerms?.quantity),
                },
              ]}
              body={(value) => ({
                ...value,
                conditions: Array.isArray(counterTerms?.conditions) ? counterTerms.conditions : [],
              })}
              onSuccess={() => setCounter(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
