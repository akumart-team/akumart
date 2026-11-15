import { useEffect, useState } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Plus,
  Recycle,
} from "lucide-react";
import { useProfile } from "@/lib/api/hooks/use-api";
import { accountHome, tradingMode } from "@/lib/api/account-roles";
import { rows, record, text, type RecordValue } from "@/lib/api/services/resources";
import { dateLabel, decimalLabel, nairaLabel } from "@/lib/api/display";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/status-chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ActionForm, QueryState, useResource } from "./data-view";
import { RequestResponses } from "./request-responses";
import {
  WorkflowEmpty,
  WorkflowGuide,
  WorkflowHeader,
  WorkflowMetric,
  WorkflowPagination,
  WorkflowSearch,
} from "./workflow-ui";

const materials = ["plastic", "metal", "glass", "cardboard", "paper", "wood", "textiles", "rubber"];
export function Requests() {
  const me = useProfile();
  const mode = tradingMode(me.data?.preferences);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [responding, setResponding] = useState<RecordValue | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setPage(1);
    setSearch("");
    setResponding(null);
    setCreating(false);
    setNotice("");
  }, [mode]);
  const params = new URLSearchParams({ page: String(page), limit: "12" });
  if (search) params.set("search", search);
  const query = useResource(
    (mode === "buyer" ? "/users/me/buyer-requests" : "/buyer-requests") + "?" + params,
    "private",
    Boolean(mode),
  );
  if (me.data && !mode) return <Navigate to={accountHome(me.data.preferences?.marketRole)} />;
  if (!mode) return <p role="status">Loading your workspace…</p>;
  const buyer = mode === "buyer";
  const total = query.data?.pagination?.total;
  return (
    <Dialog open={creating} onOpenChange={setCreating}>
      <div className="w-full min-w-0 space-y-6">
        <WorkflowHeader
          title="Buyer requests"
          eyebrow={buyer ? "Marketplace / Buying" : "Marketplace / Selling"}
          icon={ClipboardList}
          intro={
            buyer
              ? "Tell suppliers what you need. Compare responses and find the right materials for your business."
              : "Find buyers looking for your materials and send a response with your price and available quantity."
          }
          actions={
            buyer ? (
              <DialogTrigger asChild>
                <Button className="h-11 bg-lime text-forest hover:bg-lime/90">
                  <Plus className="mr-2 h-4 w-4" />
                  New request
                </Button>
              </DialogTrigger>
            ) : (
              <Button
                asChild
                variant="outline"
                className="h-11 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/app/listings">
                  My listings
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )
          }
        />
        {notice && (
          <p
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {notice}
          </p>
        )}
        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <section
            className="min-w-0 space-y-5"
            aria-label={buyer ? "Your material requests" : "Available material requests"}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">
                {buyer ? "My buyer requests" : "Open buyer requests"}
              </h2>
              <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
                {total ?? "—"} {search ? "matching " : ""}request{total === 1 ? "" : "s"}
              </span>
            </div>
            <WorkflowSearch
              label="Search requests"
              placeholder="Search by title or city"
              value={search}
              onSearch={(value) => {
                setPage(1);
                setSearch(value);
              }}
            />
            <QueryState query={query}>
              {(data) =>
                rows(data).length ? (
                  <div className="grid min-w-0 gap-5 2xl:grid-cols-2">
                    {rows(data).map((request) => (
                      <RequestCard
                        key={text(request.id)}
                        request={request}
                        buyer={buyer}
                        own={request.buyerId === me.data?.id}
                        respond={() => setResponding(request)}
                      />
                    ))}
                  </div>
                ) : (
                  <WorkflowEmpty
                    title={
                      search
                        ? "No matching requests"
                        : buyer
                          ? "Your next supply starts here"
                          : "No open requests right now"
                    }
                    body={
                      search
                        ? "Try a different title or city, or clear your search."
                        : buyer
                          ? "Post the material, quantity and location you need. Supplier responses will appear alongside your request."
                          : "New requests will appear here as buyers post their material needs."
                    }
                    action={
                      buyer && !search ? (
                        <Button onClick={() => setCreating(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Post your first request
                        </Button>
                      ) : undefined
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
          </section>
          <WorkflowGuide
            title={buyer ? "Source with confidence" : "Turn demand into opportunity"}
            steps={
              buyer
                ? [
                    "Describe the material, quantity and city you need.",
                    "Review supplier prices and available quantities.",
                    "Shortlist the responses that suit your requirements.",
                  ]
                : [
                    "Check the requested material, location and deadline.",
                    "Send a clear price and the quantity you can supply.",
                    "Open a request to see the status of your response.",
                  ]
            }
          >
            <p>Posting, responding and shortlisting do not create an order or take payment.</p>
            <Link
              to="/app/marketplace"
              className="mt-4 inline-flex items-center gap-1 font-semibold text-primary"
            >
              Browse the marketplace
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </WorkflowGuide>
        </div>
      </div>
      {buyer && (
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto rounded-3xl p-5 sm:p-7">
          <DialogHeader className="text-left">
            <DialogTitle className="pr-6 font-display text-2xl">Post a buyer request</DialogTitle>
            <DialogDescription>
              Share your requirements so suppliers can respond with relevant terms.
            </DialogDescription>
          </DialogHeader>
          <ActionForm
            embedded
            title="Post a buyer request"
            button="Post request"
            path="/buyer-requests"
            fields={[
              {
                name: "title",
                label: "Request title",
                required: true,
                max: 200,
                pattern: ".*\\S.*",
                placeholder: "What materials are you looking for?",
              },
              {
                name: "material",
                label: "Material",
                type: "select",
                options: materials,
                required: true,
              },
              {
                name: "quantity",
                label: "Quantity needed",
                required: true,
                inputMode: "decimal",
                pattern: "(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,3})?",
                placeholder: "e.g. 500",
              },
              {
                name: "unit",
                label: "Unit",
                type: "select",
                required: true,
                options: [
                  { value: "kg", label: "Kilograms (kg)" },
                  { value: "tonne", label: "Tonnes" },
                  { value: "item", label: "Items" },
                ],
              },
              {
                name: "maxUnitPrice",
                label: "Maximum price per unit (₦)",
                required: true,
                inputMode: "decimal",
                pattern: "(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,2})?",
                placeholder: "e.g. 100.00",
              },
              {
                name: "city",
                label: "Delivery city",
                required: true,
                max: 100,
                pattern: ".*\\S.*",
                value: me.data?.city || "",
                placeholder: "e.g. Lagos",
              },
              {
                name: "needBy",
                label: "Needed by",
                type: "date",
                required: true,
                minDate: new Date().toISOString().slice(0, 10),
              },
            ]}
            onSuccess={() => {
              setCreating(false);
              setPage(1);
              setSearch("");
              setNotice("Your request is live. You can review supplier responses here.");
            }}
          />
        </DialogContent>
      )}
      <SupplierResponse
        request={responding}
        close={() => setResponding(null)}
        sent={() => {
          setResponding(null);
          setNotice("Your response has been sent to the buyer.");
        }}
      />
    </Dialog>
  );
}
function RequestCard({
  request,
  buyer,
  own,
  respond,
}: {
  request: RecordValue;
  buyer: boolean;
  own: boolean;
  respond: () => void;
}) {
  const expired =
    request.status === "open" &&
    Date.parse(text(request.needBy)) < Date.parse(new Date().toISOString().slice(0, 10));
  return (
    <article
      aria-labelledby={"request-" + request.id}
      className="min-w-0 overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-soft"
    >
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/7 px-3 py-1.5 text-xs font-medium capitalize text-primary">
            <Recycle className="h-3.5 w-3.5" />
            {text(request.material)}
          </span>
          <StatusChip status={expired ? "expired" : text(request.status)} />
        </div>
        <h3
          id={"request-" + request.id}
          className="break-words font-display text-xl font-semibold leading-snug"
        >
          {text(request.title)}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {text(request.city)}
        </p>
        <dl className="my-5 grid grid-cols-2 gap-4 rounded-2xl bg-muted/40 p-4">
          <WorkflowMetric label="Quantity needed">
            {decimalLabel(request.quantity)} {text(request.unit)}
          </WorkflowMetric>
          <WorkflowMetric label="Maximum unit price">
            {nairaLabel(request.maxUnitPrice)}{" "}
            <span className="font-normal text-muted-foreground">/ {text(request.unit)}</span>
          </WorkflowMetric>
        </dl>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Needed by <span className="font-medium text-foreground">{dateLabel(request.needBy)}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/15 px-5 py-4 sm:px-6">
        {buyer ? (
          <>
            <RequestResponses id={text(request.id)} title={text(request.title)} />
            <span className="text-xs text-muted-foreground">
              {rows(request.responses).length} response
              {rows(request.responses).length === 1 ? "" : "s"}
            </span>
          </>
        ) : own ? (
          <p className="text-xs text-muted-foreground">
            Your request. Manage responses from your buyer workspace.
          </p>
        ) : (
          <Button variant="outline" className="w-full sm:w-auto" onClick={respond}>
            View & respond
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </article>
  );
}
function SupplierResponse({
  request,
  close,
  sent,
}: {
  request: RecordValue | null;
  close: () => void;
  sent: () => void;
}) {
  const [editing, setEditing] = useState(false);
  useEffect(() => setEditing(false), [request?.id]);
  const query = useResource(
    "/buyer-requests/" + encodeURIComponent(text(request?.id)),
    "private",
    Boolean(request),
  );
  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto rounded-3xl p-5 sm:p-7">
        <DialogHeader className="text-left">
          <DialogTitle className="pr-6 font-display text-2xl">Respond to this request</DialogTitle>
          <DialogDescription className="break-words">{text(request?.title)}</DialogDescription>
        </DialogHeader>
        {request && (
          <QueryState query={query}>
            {(data) => {
              const existing = rows(record(data).responses)[0];
              const open =
                record(data).status === "open" &&
                Date.parse(text(record(data).needBy)) >=
                  Date.parse(new Date().toISOString().slice(0, 10));
              return existing && !editing ? (
                <div className="space-y-4 rounded-2xl border bg-muted/20 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">Your response</h3>
                    <StatusChip status={text(existing.status)} />
                  </div>
                  <dl className="grid grid-cols-2 gap-4">
                    <WorkflowMetric label="Available quantity">
                      {decimalLabel(existing.quantity)} {text(request.unit)}
                    </WorkflowMetric>
                    <WorkflowMetric label="Your unit price">
                      {nairaLabel(existing.unitPrice)}
                    </WorkflowMetric>
                  </dl>
                  <p className="break-words text-sm text-muted-foreground">{text(existing.note)}</p>
                  <p className="border-t pt-4 text-xs text-muted-foreground">
                    {existing.status === "sent"
                      ? "You can edit your terms until the buyer makes a decision."
                      : existing.status === "declined"
                        ? "The buyer declined these terms. You can send a revised response while the request is open."
                        : "The buyer shortlisted this response. These terms are locked."}
                  </p>
                  {open && (existing.status === "sent" || existing.status === "declined") && (
                    <Button onClick={() => setEditing(true)}>
                      {existing.status === "sent" ? "Edit response" : "Send revised response"}
                    </Button>
                  )}
                </div>
              ) : open ? (
                <ActionForm
                  key={text(existing?.updatedAt)}
                  embedded
                  title={
                    existing?.status === "sent"
                      ? "Edit supplier response"
                      : "Send supplier response"
                  }
                  button={
                    existing?.status === "sent"
                      ? "Save changes"
                      : existing
                        ? "Send revised response"
                        : "Send response"
                  }
                  path={
                    "/buyer-requests/" +
                    request.id +
                    "/responses" +
                    (existing?.status === "sent" ? "/" + existing.id + "/terms" : "")
                  }
                  method={existing?.status === "sent" ? "PATCH" : "POST"}
                  body={(values) => ({
                    ...values,
                    ...(existing ? { expectedUpdatedAt: existing.updatedAt } : {}),
                  })}
                  fields={[
                    {
                      name: "unitPrice",
                      value: existing ? text(existing.unitPrice) : "",
                      label: "Your price per unit (₦)",
                      required: true,
                      inputMode: "decimal",
                      pattern: "(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,2})?",
                      placeholder: "0.00",
                    },
                    {
                      name: "quantity",
                      value: existing ? text(existing.quantity) : "",
                      label: "Quantity you can supply",
                      required: true,
                      inputMode: "decimal",
                      pattern: "(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,3})?",
                      placeholder: "Up to " + text(request.quantity) + " " + text(request.unit),
                    },
                    {
                      name: "note",
                      value: existing ? text(existing.note) : "",
                      label: "Message to the buyer",
                      type: "textarea",
                      required: true,
                      max: 2000,
                      placeholder: "Describe your material condition and collection readiness.",
                    },
                  ]}
                  onSuccess={sent}
                />
              ) : (
                <p>This request is closed or expired. Responses can no longer be changed.</p>
              );
            }}
          </QueryState>
        )}
      </DialogContent>
    </Dialog>
  );
}
