import { BinSessionDetails, PointsHistory, RewardRules } from "./bin-account-details";
import { CampaignStatistics, RecommendedJobs } from "./discovery";
import { OrderDispute } from "./disputes";
import { Link, useRouter } from "@tanstack/react-router";
import { BinMap } from "@/components/bin-map";
import type { Bin } from "@/lib/types";
import { useState } from "react";
import { WorkspaceAkuBin } from "./workspace-akubin";
import { PublicShell } from "@/components/site-chrome";
import { Panel } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { rows, record, field, text } from "@/lib/api/services/resources";
import { useProfile } from "@/lib/api/hooks/use-api";
import {
  ActionButton,
  ActionForm,
  DataTable,
  PrivateImage,
  QueryState,
  ResourcePage,
  Summary,
  useResource,
  type FormField,
} from "./data-view";

const c = (key: string, label: string, status = false) => ({ key, label, status });
export function Bins({ embedded = false }: { embedded?: boolean }) {
  const locations = useResource("/akubin/bins?limit=100", "public");
  const router = useRouter();
  const content = (
    <ResourcePage title="Find an AkuBin" intro="Bin locations and current availability.">
      <QueryState query={locations}>
        {(data) =>
          rows(data).length ? (
            <BinMap
              bins={rows(data)
                .filter(
                  (bin) =>
                    Number.isFinite(Number(bin.latitude)) && Number.isFinite(Number(bin.longitude)),
                )
                .map((bin) => ({
                  id: text(bin.code),
                  name: text(bin.name),
                  lat: Number(bin.latitude),
                  lng: Number(bin.longitude),
                  status: bin.status as Bin["status"],
                }))}
              onSelect={(code) =>
                router.navigate({ to: "/akubin/bin/$binId", params: { binId: code } })
              }
            />
          ) : (
            <p>No bin locations are currently listed.</p>
          )
        }
      </QueryState>
      <DataTable
        path="/akubin/bins"
        access="public"
        title="Locations"
        columns={[
          { key: "name", label: "Bin", link: (r) => "/akubin/bin/" + r.code },
          c("code", "Code"),
          c("city", "City"),
          c("area", "Area"),
          c("status", "Status", true),
        ]}
      />
    </ResourcePage>
  );
  return embedded ? (
    content
  ) : (
    <PublicShell>
      <div className="container-page py-12">{content}</div>
    </PublicShell>
  );
}
export function BinDetails({ code, deposit = false }: { code: string; deposit?: boolean }) {
  const query = useResource("/akubin/bins/" + encodeURIComponent(code), "public");
  return (
    <PublicShell>
      <div className="container-page space-y-6 py-12">
        <QueryState query={query}>
          {(data) => {
            const bin = record(data);
            return (
              <>
                <h1 className="text-display text-4xl">{text(bin.name)}</h1>
                <Panel title={text(bin.code)}>
                  <p>
                    {text(bin.area)}, {text(bin.city)}
                  </p>
                  <p className="mt-3">
                    Status: {text(bin.status)} · Materials: {text(bin.materials)}
                  </p>
                </Panel>
                <Panel title={deposit ? "Deposit at the physical bin" : "How to recycle here"}>
                  <p>
                    Set your permanent AkuBin PIN in your account, then enter it on the physical
                    bin. The controller starts the session and records deposits. Points appear after
                    the hardware confirms a deposit.
                  </p>
                  <p className="mt-3">The website cannot simulate an item scan or credit points.</p>
                  <Button asChild className="mt-4">
                    <Link to="/app/akubin">Open my AkuBin account</Link>
                  </Button>
                </Panel>
              </>
            );
          }}
        </QueryState>
      </div>
    </PublicShell>
  );
}
export function AkuBinDashboard() {
  return (
    <ResourcePage title="My AkuBin" intro="Your confirmed recycling activity and points.">
      <Summary
        title="Recycling summary"
        path="/akubin/me/summary"
        fields={[
          c("balancePoints", "Available points"),
          c("lifetimeEarnedPoints", "Lifetime points"),
          c("weightKg", "Recycled (kg)"),
          c("verifiedDepositCount", "Verified deposits"),
        ]}
      />
      <Summary
        title="PIN status"
        path="/akubin/me/pin"
        fields={[c("configured", "PIN configured")]}
      />
      <ActionForm
        title="Set or change PIN"
        path="/akubin/me/pin"
        method="PUT"
        fields={[
          {
            name: "pin",
            label: "New PIN (6–12 digits)",
            type: "password",
            required: true,
            min: 6,
            max: 12,
          },
          {
            name: "currentPin",
            label: "Current PIN (required when changing)",
            type: "password",
            min: 6,
            max: 12,
          },
        ]}
      />
      <DataTable
        title="Deposits"
        path="/akubin/me/deposits"
        columns={[
          c("bin.code", "Bin"),
          c("material", "Material"),
          c("weightKg", "Weight (kg)"),
          c("awardedPoints", "Points"),
          c("status", "Status", true),
        ]}
      />
      <DataTable
        title="Sessions"
        path="/akubin/me/sessions"
        columns={[
          c("bin.code", "Bin"),
          c("status", "Status", true),
          c("startedAt", "Started"),
          c("expiresAt", "Expires"),
        ]}
        actions={(r) => (
          <div className="space-y-3">
            <BinSessionDetails id={text(r.id)} />
            {r.status === "active" && (
              <ActionButton path={"/akubin/me/sessions/" + r.id + "/end"}>End session</ActionButton>
            )}
          </div>
        )}
      />
      <PointsHistory />
    </ResourcePage>
  );
}
export function Rewards() {
  const [selected, setSelected] = useState("");
  const [key, setKey] = useState("");
  return (
    <ResourcePage title="AkuBin rewards">
      <RewardRules />
      <Summary
        title="Points wallet"
        path="/akubin/me/wallet"
        fields={[c("balancePoints", "Available points")]}
      />
      <DataTable
        title="Available rewards"
        path="/akubin/rewards"
        access="public"
        columns={[
          c("name", "Reward"),
          c("kind", "Type"),
          c("costPoints", "Points required"),
          c("stock", "Stock"),
        ]}
        actions={(r) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelected(text(r.id));
              setKey(crypto.randomUUID());
            }}
          >
            Choose reward
          </Button>
        )}
      />
      {selected && (
        <ActionForm
          key={selected + key}
          title="Redeem selected reward"
          button="Submit redemption"
          path="/akubin/redemptions"
          fields={[{ name: "phone", label: "Airtime phone (optional)" }]}
          body={(v) => ({ ...v, rewardId: selected, idempotencyKey: key })}
          onSuccess={() => setSelected("")}
        />
      )}
      <DataTable
        title="Your redemptions"
        path="/akubin/me/redemptions"
        columns={[
          c("rewardName", "Reward"),
          c("costPoints", "Points"),
          c("status", "Status", true),
          c("createdAt", "Created"),
        ]}
      />
    </ResourcePage>
  );
}
export function Leaderboard() {
  const [period, setPeriod] = useState("week");
  return (
    <ResourcePage title="Recycling leaderboard">
      <div className="flex gap-3">
        {["week", "month", "all"].map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            onClick={() => setPeriod(p)}
          >
            {p === "all" ? "All time" : p === "week" ? "This week" : "This month"}
          </Button>
        ))}
      </div>
      <DataTable
        title="Confirmed recycling"
        path={"/akubin/leaderboard?period=" + period}
        columns={[c("rank", "Rank"), c("name", "Name"), c("city", "City"), c("points", "Points")]}
      />
    </ResourcePage>
  );
}
export function Partner() {
  const query = useResource("/partners/me");
  const me = useProfile();
  const basic: FormField[] = [
    { name: "business", label: "Business name", required: true },
    { name: "contact", label: "Contact name", required: true },
    { name: "email", label: "Contact email", type: "email", required: true, value: me.data?.email },
    { name: "phone", label: "Phone", required: true },
    { name: "base", label: "Base city", required: true },
    { name: "serviceAreas", label: "Service cities (comma separated)", required: true },
    { name: "materials", label: "Materials (comma separated)", required: true },
    { name: "vehicles", label: "Vehicle description", required: true },
    { name: "vehicleCount", label: "Number of vehicles", type: "number", min: 1, required: true },
    { name: "capacityKg", label: "Capacity (kg)", required: true },
    ...["cac", "owner_id", "vehicle_registration", "insurance"].map((kind) => ({
      name: kind,
      label: kind.replaceAll("_", " ") + " document",
      type: "upload" as const,
      purpose: "partner_document",
      required: true,
    })),
  ];
  return (
    <ResourcePage title="Logistics partner">
      <QueryState query={query}>
        {(data) =>
          data && record(data).status !== "rejected" ? (
            <>
              <Summary
                title="Application"
                path="/partners/me"
                fields={[
                  c("business", "Business"),
                  c("status", "Status", true),
                  c("reason", "Decision reason"),
                ]}
              />
              {record(data).status === "approved" ? (
                <>
                  <RecommendedJobs />
                  <DataTable
                    title="Available jobs"
                    path="/partners/me/jobs"
                    columns={[
                      c("title", "Job"),
                      c("pickupCity", "Pickup"),
                      c("quantity", "Quantity"),
                      c("proposedFare", "Proposed fare (₦)"),
                    ]}
                    actions={(r) => (
                      <div className="space-y-3">
                        <ActionForm
                          title="Submit quote"
                          path={"/partners/me/jobs/" + r.id + "/quotes"}
                          fields={[
                            { name: "amount", label: "Fare (₦)", required: true },
                            { name: "eta", label: "Estimated arrival", required: true },
                            { name: "vehicle", label: "Vehicle", required: true },
                          ]}
                        />
                        <ActionForm
                          title="Decline job"
                          path={"/partners/me/jobs/" + r.id + "/decline"}
                          fields={[{ name: "reason", label: "Reason", required: true }]}
                        />
                      </div>
                    )}
                  />
                  <DataTable
                    title="Assigned deliveries"
                    path="/partners/me/deliveries"
                    columns={[
                      c("title", "Order"),
                      c("destination", "Destination"),
                      c("status", "Status", true),
                    ]}
                    actions={(r) => (
                      <div className="space-y-3">
                        <ActionForm
                          title="Update delivery"
                          path={"/partners/me/deliveries/" + r.id + "/events"}
                          fields={[
                            {
                              name: "status",
                              label: "Status",
                              type: "select",
                              required: true,
                              options: ["picked_up", "in_transit", "delivered"],
                            },
                            { name: "note", label: "Note" },
                          ]}
                        />
                        <ActionForm
                          title="Delivery proof"
                          path={"/partners/me/deliveries/" + r.id + "/proof"}
                          fields={[
                            {
                              name: "uploadId",
                              label: "Proof document",
                              type: "upload",
                              purpose: "delivery_proof",
                              required: true,
                            },
                            { name: "note", label: "Note" },
                          ]}
                        />
                      </div>
                    )}
                  />
                </>
              ) : (
                <Panel title="Partner access">
                  <p>
                    Your application is {text(record(data).status)}. Jobs are available only to
                    approved partners.
                  </p>
                </Panel>
              )}
            </>
          ) : (
            <ActionForm
              title={
                record(query.data?.data).status === "rejected"
                  ? "Resubmit logistics application"
                  : "Apply as a logistics partner"
              }
              path="/partners/applications"
              fields={basic}
              body={(v) => {
                const { cac, owner_id, vehicle_registration, insurance, ...data } = v;
                return {
                  ...data,
                  serviceAreas: String(data.serviceAreas)
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  materials: String(data.materials)
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  documents: [
                    { kind: "cac", uploadId: cac },
                    { kind: "owner_id", uploadId: owner_id },
                    { kind: "vehicle_registration", uploadId: vehicle_registration },
                    { kind: "insurance", uploadId: insurance },
                  ],
                };
              }}
            />
          )
        }
      </QueryState>
      <WorkspaceAkuBin enabled={me.data?.preferences?.akubin === true} />
    </ResourcePage>
  );
}
export function Advertising() {
  const packages = useResource("/advertising/packages", "public");
  return (
    <ResourcePage
      title="Advertising"
      intro="Choose a configured package and submit your campaign for review. Payment activation is currently unavailable."
    >
      <DataTable
        title="Packages"
        path="/advertising/packages"
        access="public"
        columns={[c("name", "Package"), c("durationDays", "Days"), c("price", "Price (₦)")]}
      />
      <QueryState query={packages}>
        {(data) =>
          rows(data).length ? (
            <ActionForm
              title="Create campaign"
              path="/advertising/campaigns"
              fields={[
                {
                  name: "packageId",
                  label: "Package",
                  type: "select",
                  required: true,
                  options: rows(data).map((p) => ({
                    value: text(p.id),
                    label: text(p.name) + " ? ?" + text(p.price),
                  })),
                },
                { name: "title", label: "Campaign title", required: true, min: 3, max: 150 },
                {
                  name: "body",
                  label: "Campaign description",
                  type: "textarea",
                  required: true,
                  min: 10,
                  max: 2000,
                },
                { name: "destinationUrl", label: "Destination (https URL)", required: true },
                {
                  name: "imageId",
                  label: "Campaign image",
                  type: "upload",
                  purpose: "campaign_creative",
                  required: true,
                },
                { name: "locations", label: "Target cities (comma separated)" },
                { name: "materials", label: "Materials (comma separated)" },
              ]}
              body={(v) => ({
                ...v,
                locations: String(v.locations || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                materials: String(v.materials || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                roles: [],
              })}
            />
          ) : (
            <p>No active advertising packages are currently available.</p>
          )
        }
      </QueryState>
      <DataTable
        title="Your campaigns"
        path="/advertising/campaigns"
        actions={(row) => <CampaignStatistics id={text(row.id)} />}
        columns={[
          c("title", "Campaign"),
          c("status", "Status", true),
          c("price", "Price (₦)"),
          c("paymentStatus", "Payment", true),
        ]}
      />
    </ResourcePage>
  );
}
export function OrderDetails({ id }: { id: string }) {
  const query = useResource("/orders/" + id);
  const me = useProfile();
  return (
    <ResourcePage title="Order details">
      <QueryState query={query}>
        {(data) => {
          const order = record(data);
          const buyer = order.buyerId === me.data?.id;
          return (
            <>
              <Panel title={text(order.title)}>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    "status",
                    "paymentStatus",
                    "quantity",
                    "unit",
                    "unitPrice",
                    "pickupCity",
                    "destination",
                  ].map((k) => (
                    <div key={k}>
                      <dt className="text-sm text-muted-foreground">
                        {k.replace(/([A-Z])/g, " $1")}
                      </dt>
                      <dd>{text(order[k])}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
              {buyer &&
                ["choose_fulfilment", "awaiting_quotes", "no_quotes"].includes(
                  text(order.status),
                ) && (
                  <>
                    <Summary
                      title="Delivery estimate"
                      path={"/orders/" + id + "/logistics/estimate"}
                      fields={[
                        c("recommendedFare", "Recommended fare (₦)"),
                        c("minFare", "Minimum fare (₦)"),
                        c("maxFare", "Maximum fare (₦)"),
                        c("step", "Fare step"),
                      ]}
                    />
                    <ActionForm
                      title="Request logistics"
                      path={"/orders/" + id + "/fulfilment"}
                      fields={[
                        { name: "destination", label: "Delivery address", required: true, min: 5 },
                        { name: "proposedFare", label: "Proposed fare (₦)", required: true },
                      ]}
                    />
                    <DataTable
                      title="Delivery quotes"
                      path={"/orders/" + id + "/quotes"}
                      columns={[
                        c("partner.business", "Partner"),
                        c("amount", "Fare (₦)"),
                        c("eta", "Arrival"),
                        c("status", "Status", true),
                      ]}
                      actions={(r) =>
                        r.status === "submitted" ? (
                          <ActionButton
                            path={"/orders/" + id + "/quotes/select"}
                            body={{ quoteId: r.id }}
                          >
                            Select quote
                          </ActionButton>
                        ) : null
                      }
                    />
                    {order.status !== "choose_fulfilment" && (
                      <ActionButton path={"/orders/" + id + "/quotes/extend"}>
                        Reopen quote request
                      </ActionButton>
                    )}
                  </>
                )}
              {buyer && order.paymentStatus === "unpaid" && order.status !== "cancelled" && (
                <ActionButton path={"/orders/" + id + "/cancel"}>Cancel unpaid order</ActionButton>
              )}
              {order.status === "awaiting_payment" && (
                <Panel title="Payment unavailable">
                  <p>Paystack is not configured for testing yet. This order has not been paid.</p>
                </Panel>
              )}
              {buyer && !order.dispute && order.status === "proof_uploaded" && (
                <ActionButton path={"/orders/" + id + "/confirm-receipt"}>
                  Confirm receipt
                </ActionButton>
              )}
              {buyer && order.status === "settled" && (
                <ActionForm
                  title="Review seller"
                  path={"/orders/" + id + "/review"}
                  fields={[
                    {
                      name: "stars",
                      label: "Rating (1–5)",
                      type: "number",
                      min: 1,
                      max: 5,
                      required: true,
                    },
                    { name: "text", label: "Review", type: "textarea" },
                  ]}
                />
              )}
              <OrderDispute order={order} />
              <Panel title="Timeline">
                <ul className="space-y-3">
                  {rows(order.events).map((event, i) => (
                    <li key={text(event.id) || i}>
                      {text(event.createdAt)} · {text(event.action).replaceAll("_", " ")}
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          );
        }}
      </QueryState>
    </ResourcePage>
  );
}
