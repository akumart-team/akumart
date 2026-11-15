import { WorkspaceAkuBin } from "./workspace-akubin";
import { MarketplaceFeed } from "./discovery";
import { Link, Navigate, useRouter } from "@tanstack/react-router";
import {
  accountHome,
  accountRoleOptions,
  isAccountRole,
  tradingMode,
} from "@/lib/api/account-roles";
import { useState } from "react";
import { useProfile } from "@/lib/api/hooks/use-api";
import { record, rows, text, field } from "@/lib/api/services/resources";
import { Panel } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { useTradeGate } from "@/components/gate";
import {
  ActionButton,
  ActionForm,
  DataTable,
  QueryState,
  ResourcePage,
  Summary,
  useResource,
  type FormField,
} from "./data-view";
import { Marketplace } from "./marketplace";

const materials = ["plastic", "metal", "glass", "cardboard", "paper", "wood", "textiles", "rubber"];
const col = (key: string, label: string, status = false) => ({ key, label, status });
const listingColumns = [
  { key: "title", label: "Listing", link: (r: Record<string, unknown>) => "/marketplace/" + r.id },
  col("material", "Material"),
  col("availableQuantity", "Available"),
  col("unitPrice", "Price (₦/unit)"),
  col("status", "Status", true),
];
export function Dashboard() {
  const profile = useProfile();
  const role = profile.data?.preferences?.marketRole;
  const mode = tradingMode(profile.data?.preferences);
  if (profile.data && !isAccountRole(role))
    return (
      <ResourcePage title="Dashboard" intro="Your account and recycling activity.">
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/app/akubin">Open My AkuBin</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/settings">Account settings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/marketplace">Browse marketplace</Link>
          </Button>
        </div>
        <WorkspaceAkuBin />
      </ResourcePage>
    );
  if (role === "logistics" || role === "recycler") return <Navigate to={accountHome(role)} />;
  if (!mode) return <p role="status">Loading your workspace…</p>;
  return (
    <ResourcePage
      title={mode === "buyer" ? "Buyer dashboard" : "Seller dashboard"}
      intro={
        mode === "buyer"
          ? "Your purchases, offers and material requests."
          : "Your listings, incoming offers and sales."
      }
    >
      <Summary
        path="/users/me/dashboard"
        title="Trading overview"
        fields={
          mode === "buyer"
            ? [
                col("outgoingOffers", "Offers awaiting your response"),
                col("purchases", "Purchases"),
              ]
            : [
                col("listings", "Listings"),
                col("incomingOffers", "Incoming offers"),
                col("sales", "Sales"),
              ]
        }
      />
      <DataTable
        path={"/orders?mode=" + mode}
        title={mode === "buyer" ? "Your purchases" : "Your sales"}
        columns={[
          { key: "title", label: "Order", link: (r) => "/app/orders/" + r.id },
          col("status", "Status", true),
          col("paymentStatus", "Payment", true),
          col("quantity", "Quantity"),
        ]}
      />
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          {mode === "buyer" ? (
            <Link to="/marketplace">Browse materials</Link>
          ) : (
            <Link to="/app/listings/new">Create listing</Link>
          )}
        </Button>
        <Button asChild variant="outline">
          {mode === "buyer" ? (
            <Link to="/app/requests">Post a buyer request</Link>
          ) : (
            <Link to="/app/requests">Find buyer requests</Link>
          )}
        </Button>
      </div>
      <WorkspaceAkuBin />
    </ResourcePage>
  );
}
export function AccountMarketplace() {
  return <MarketplaceFeed browse={<Marketplace embedded />} />;
}
export function OwnListings() {
  return (
    <ResourcePage title="My listings" intro="Drafts, published listings and available stock.">
      <Button asChild>
        <Link to="/app/listings/new">Create listing</Link>
      </Button>
      <DataTable
        path="/users/me/listings"
        title="Listings"
        columns={listingColumns}
        actions={(r) => (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/app/listings/new" search={{ edit: text(r.id) }}>
                Edit
              </Link>
            </Button>
            <ActionButton
              path={"/listings/" + r.id}
              method="PATCH"
              body={{ status: r.status === "published" ? "paused" : "published" }}
            >
              {r.status === "published" ? "Pause" : "Publish"}
            </ActionButton>
          </div>
        )}
      />
    </ResourcePage>
  );
}
export function ListingEditor({ id }: { id?: string }) {
  const query = useResource("/listings/" + id, "private", Boolean(id));
  const router = useRouter();
  const gate = useTradeGate();
  const [allowed, setAllowed] = useState(false);
  const form = (source: unknown) => {
    const row = record(source);
    const fields: FormField[] = [
      { name: "title", label: "Title", required: true, value: String(row.title || "") },
      {
        name: "material",
        label: "Material",
        type: "select",
        options: materials,
        required: true,
        value: String(row.material || "plastic"),
      },
      { name: "grade", label: "Grade", required: true, value: String(row.grade || "") },
      {
        name: "condition",
        label: "Condition",
        type: "select",
        options: ["baled", "loose", "sorted", "shredded", "mixed"],
        required: true,
        value: String(row.condition || "sorted"),
      },
      {
        name: "quantity",
        label: "Total quantity",
        required: true,
        value: String(row.quantity || ""),
      },
      {
        name: "unit",
        label: "Unit",
        type: "select",
        options: ["kg", "tonne"],
        required: true,
        value: String(row.unit || "kg"),
      },
      {
        name: "unitPrice",
        label: "Price per unit (₦)",
        required: true,
        value: String(row.unitPrice || ""),
      },
      {
        name: "minOrder",
        label: "Minimum order",
        required: true,
        value: String(row.minOrder || ""),
      },
      {
        name: "allowPartial",
        label: "Allow partial orders",
        type: "checkbox",
        value: row.allowPartial !== false,
      },
      { name: "city", label: "Pickup city", required: true, value: String(row.city || "") },
      { name: "area", label: "Pickup area", required: true, value: String(row.area || "") },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        value: String(row.description || ""),
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: ["draft", "published", "paused"],
        value: String(row.status || "draft"),
      },
      {
        name: "imageId",
        label: id ? "Replace listing image (optional)" : "Listing image",
        type: "upload",
        purpose: "listing_image",
        required: !id,
      },
    ];
    return (
      <ActionForm
        key={id || "new"}
        title={id ? "Edit listing" : "Listing details"}
        fields={fields}
        path={id ? "/listings/" + id : "/listings"}
        method={id ? "PATCH" : "POST"}
        body={(v) => {
          const { imageId, ...body } = v;
          return {
            ...body,
            imageIds: imageId ? [imageId] : rows(row.images).map((i) => i.uploadId),
          };
        }}
        onSuccess={(value) =>
          router.navigate({ to: "/marketplace/$id", params: { id: text(record(value).id) } })
        }
      />
    );
  };
  return (
    <ResourcePage
      title={id ? "Edit listing" : "Create a listing"}
      intro="Basic Marketplace verification is required to create or update a listing. Upload a real image of your materials."
    >
      {!allowed ? (
        <Button
          onClick={() =>
            void gate(
              {
                path: "/app/listings/new" + (id ? "?edit=" + id : ""),
                label: "Create or edit a listing",
                level: "basic",
              },
              () => setAllowed(true),
            )
          }
        >
          Continue to listing form
        </Button>
      ) : id ? (
        <QueryState query={query}>{form}</QueryState>
      ) : (
        form({})
      )}
    </ResourcePage>
  );
}
export { Orders } from "./orders-page";
export { Offers } from "./offers-page";
export { Requests } from "./requests-page";
export function Saved() {
  return (
    <ResourcePage title="Saved items">
      <DataTable
        title="Saved listings"
        path="/users/me/saved-listings"
        columns={listingColumns}
        actions={(r) => (
          <ActionButton path={"/users/me/saved-listings/" + r.id} method="DELETE">
            Remove
          </ActionButton>
        )}
      />
      <DataTable
        title="Saved articles"
        path="/users/me/saved-articles"
        columns={[
          { key: "title", label: "Article", link: (r) => "/articles/" + r.slug },
          col("category", "Category"),
        ]}
        actions={(r) => (
          <ActionButton path={"/users/me/saved-articles/" + r.id} method="DELETE">
            Remove
          </ActionButton>
        )}
      />
    </ResourcePage>
  );
}
export function Notifications() {
  return (
    <ResourcePage title="Notifications">
      <ActionButton path="/users/me/notifications/read-all">Mark all as read</ActionButton>
      <DataTable
        title="Messages"
        path="/users/me/notifications"
        columns={[col("title", "Title"), col("body", "Message"), col("createdAt", "Received")]}
        actions={(r) =>
          r.readAt ? (
            <span>Read</span>
          ) : (
            <ActionButton method="PATCH" path={"/users/me/notifications/" + r.id}>
              Mark read
            </ActionButton>
          )
        }
      />
    </ResourcePage>
  );
}
export function Support() {
  const me = useProfile();
  return (
    <ResourcePage title="Support">
      <ActionForm
        title="New support ticket"
        button="Submit ticket"
        path="/support/tickets"
        fields={[
          { name: "subject", label: "Subject", required: true, max: 200 },
          { name: "message", label: "Message", type: "textarea", required: true },
        ]}
        body={(v) => ({
          ...v,
          name: me.data?.displayName || `${me.data?.firstName} ${me.data?.lastName}`,
          email: me.data?.email,
          channel: "contact",
        })}
      />
      <DataTable
        title="Your tickets"
        path="/users/me/support/tickets"
        columns={[
          col("subject", "Subject"),
          col("message", "Message"),
          col("status", "Status", true),
          col("createdAt", "Created"),
        ]}
      />
    </ResourcePage>
  );
}
export function Settings() {
  const me = useProfile();
  const query = useResource("/users/me");
  return (
    <ResourcePage title="Settings">
      <QueryState query={query}>
        {(data) => {
          const row = record(data);
          const prefs = record(row.preferences);
          return (
            <>
              <ActionForm
                key={text(row.updatedAt)}
                title="Profile"
                path="/users/me"
                method="PATCH"
                fields={[
                  "firstName",
                  "lastName",
                  "displayName",
                  "phone",
                  "city",
                  "companyName",
                  "businessType",
                  "location",
                ].map((name) => ({
                  name,
                  label: name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
                  value: String(row[name] || ""),
                  type: name === "phone" ? ("tel" as const) : undefined,
                  pattern:
                    name === "phone"
                      ? "\\+?[0-9]{10,15}"
                      : ["firstName", "lastName", "city"].includes(name)
                        ? ".*\\S.*"
                        : undefined,
                  required: ["firstName", "lastName", "displayName", "phone", "city"].includes(
                    name,
                  ),
                  min:
                    name === "city"
                      ? 2
                      : ["firstName", "lastName", "displayName"].includes(name)
                        ? 1
                        : undefined,
                  max: ["firstName", "lastName"].includes(name)
                    ? 50
                    : name === "phone"
                      ? 16
                      : name === "city" || name === "displayName"
                        ? 100
                        : undefined,
                }))}
              />
              <ActionForm
                key={text(prefs.updatedAt) + text(prefs.marketRole)}
                title="How you use AkuMart"
                path="/users/me/preferences"
                method="PATCH"
                fields={[
                  {
                    name: "marketRole",
                    label: "Account role",
                    type: "select",
                    options: [...accountRoleOptions],
                    placeholder: "Choose how you use AkuMart",
                    required: true,
                    value: isAccountRole(prefs.marketRole) ? String(prefs.marketRole) : "",
                  },
                  {
                    name: "interests",
                    label: "Material interests (comma separated)",
                    value: Array.isArray(prefs.interests) ? prefs.interests.join(", ") : "",
                  },
                  ...(!row.termsAcceptedAt
                    ? [
                        {
                          name: "acceptedTerms",
                          label:
                            "I accept the Terms & Conditions and acknowledge the Privacy Policy",
                          type: "checkbox" as const,
                          required: true,
                        },
                      ]
                    : []),
                ]}
                body={(v) => ({
                  ...v,
                  akubin: true,
                  interests: String(v.interests || "")
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                })}
              />
              <p className="text-sm text-muted-foreground">
                AkuBin is included with every account. Your PIN, points and recycling activity are
                available whatever account role you choose.
              </p>
              {prefs.marketRole !== "logistics" && (
                <Panel title="Logistics partnership">
                  <p className="text-sm text-muted-foreground">
                    Want to deliver materials? Submit your business application for review. Delivery
                    jobs require approval.
                  </p>
                  <Button asChild variant="outline" className="mt-3">
                    <Link to="/app/partner">
                      {row.partner ? "View logistics application" : "Apply as a logistics partner"}
                    </Link>
                  </Button>
                </Panel>
              )}
              <p className="text-sm text-muted-foreground">
                {!row.termsAcceptedAt && (
                  <>
                    <Link to="/legal/$doc" params={{ doc: "terms" }} className="underline">
                      Read the terms
                    </Link>
                    {" · "}
                    <Link to="/legal/$doc" params={{ doc: "privacy" }} className="underline">
                      Read the privacy policy
                    </Link>
                    <br />
                  </>
                )}
                Signed in as {me.data?.email}. Roles and Marketplace verification are managed by the
                backend.
              </p>
            </>
          );
        }}
      </QueryState>
    </ResourcePage>
  );
}
