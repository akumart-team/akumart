import { UserDirectory, AdminOrderQueue, ArticleEditor } from "./admin-records";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BinCreate, BinManager, RewardOperations } from "./bin-operations";
import type { RecordValue } from "@/lib/api/services/resources";
import { DisputeQueue } from "./disputes";
import { StaffManagement } from "./staff-management";
import { useProfile } from "@/lib/api/hooks/use-api";
import { record, text } from "@/lib/api/services/resources";
import {
  ActionButton,
  ActionForm,
  DataTable,
  QueryState,
  ResourcePage,
  Summary,
  useResource,
} from "./data-view";
const c = (key: string, label: string, status = false) => ({ key, label, status });
export function AdminOverview() {
  const me = useProfile();
  return (
    <ResourcePage
      title="Overview"
      intro="Live administrative records. Access is restricted by your backend staff role."
    >
      <Summary
        title="Staff account"
        path="/admin/me"
        fields={[c("profileId", "Profile"), c("role", "Role")]}
      />
      {["super", "operations"].includes(me.data?.staff?.role || "") && (
        <Summary
          title="Platform activity"
          path="/admin/dashboard"
          fields={[
            c("users", "Users"),
            c("listings", "Listings"),
            c("orders", "Orders"),
            c("verificationsPending", "Pending verification"),
          ]}
        />
      )}
      {["super", "operations", "support"].includes(me.data?.staff?.role || "") && <UserDirectory />}
      {["super", "operations", "support", "finance"].includes(me.data?.staff?.role || "") && (
        <AdminOrderQueue />
      )}
    </ResourcePage>
  );
}
export function AdminListings() {
  return (
    <ResourcePage title="Listing moderation">
      <DataTable
        path="/admin/listings"
        title="Listings"
        columns={[
          c("title", "Title"),
          c("seller.displayName", "Seller"),
          c("status", "Status", true),
          c("quantity", "Quantity"),
        ]}
        actions={(r) => (
          <ActionForm
            title="Moderate listing"
            path={"/admin/listings/" + r.id + "/moderation"}
            method="PATCH"
            fields={[
              {
                name: "status",
                label: "Status",
                type: "select",
                required: true,
                options: ["published", "paused"],
              },
              { name: "reason", label: "Reason", required: true, max: 1000 },
            ]}
          />
        )}
      />
    </ResourcePage>
  );
}
export function AdminPartners() {
  return (
    <ResourcePage title="Logistics partners">
      <DataTable
        path="/admin/partners"
        title="Partner applications"
        columns={[
          c("business", "Business"),
          c("email", "Email"),
          c("serviceAreas", "Service areas"),
          c("status", "Status", true),
        ]}
        actions={(r) => (
          <ActionForm
            title="Application decision"
            path={"/admin/partners/" + r.id}
            method="PATCH"
            fields={[
              {
                name: "status",
                label: "Status",
                type: "select",
                required: true,
                options: ["approved", "rejected", "suspended"],
              },
              { name: "reason", label: "Reason", required: true, min: 5, max: 2000 },
            ]}
          />
        )}
      />
    </ResourcePage>
  );
}
export function AdminBins() {
  const [selected, setSelected] = useState<RecordValue | null>(null);
  return (
    <ResourcePage
      title="AkuBin operations"
      intro="Manage real bin records, controllers and maintenance. Hardware reports deposits and telemetry."
    >
      <BinCreate />
      <DataTable
        path="/admin/akubin/bins"
        title="Bins"
        columns={[
          c("code", "Code"),
          c("name", "Name"),
          c("city", "City"),
          c("status", "Status", true),
        ]}
        actions={(row) => (
          <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
            Manage bin
          </Button>
        )}
      />
      <BinManager bin={selected} onClose={() => setSelected(null)} />
    </ResourcePage>
  );
}
export function AdminSupport() {
  const role = useProfile().data?.staff?.role;
  return (
    <ResourcePage title="Support and disputes">
      {["super", "support"].includes(role || "") && (
        <DataTable
          path="/admin/support/tickets"
          title="Support tickets"
          columns={[
            c("subject", "Subject"),
            c("email", "Email"),
            c("message", "Message"),
            c("status", "Status", true),
          ]}
          actions={(r) => (
            <ActionForm
              title="Update ticket"
              path={"/admin/support/tickets/" + r.id}
              method="PATCH"
              fields={[
                {
                  name: "status",
                  label: "Status",
                  type: "select",
                  options: ["open", "assigned", "resolved"],
                },
                {
                  name: "priority",
                  label: "Priority",
                  type: "select",
                  options: ["low", "normal", "high", "urgent"],
                },
              ]}
            />
          )}
        />
      )}
      <DisputeQueue />
      {["super", "support"].includes(role || "") && (
        <DataTable
          path="/admin/enquiries"
          title="Enquiries"
          columns={[
            c("name", "Name"),
            c("email", "Email"),
            c("kind", "Topic"),
            c("createdAt", "Received"),
          ]}
        />
      )}
    </ResourcePage>
  );
}
export function AdminFinance() {
  return (
    <ResourcePage
      title="Finance"
      intro="Payment records from the backend. Paystack processing is currently unavailable; no payments or settlements are simulated."
    >
      <DataTable
        path="/admin/finance/payments"
        title="Payments"
        columns={[
          c("providerReference", "Reference"),
          c("amount", "Amount (₦)"),
          c("currency", "Currency"),
          c("status", "Status", true),
          c("paidAt", "Paid at"),
        ]}
      />
      <RewardOperations />
      <DisputeQueue />
      <AdminOrderQueue />
    </ResourcePage>
  );
}
export function AdminContent() {
  return (
    <ResourcePage title="Content and editorial">
      <DataTable
        path="/admin/articles"
        title="Articles"
        columns={[c("title", "Title"), c("category", "Category"), c("status", "Status", true)]}
        actions={(row) => <ArticleEditor slug={text(row.slug)} />}
      />
      <ActionForm
        title="Create article"
        path="/admin/articles"
        fields={[
          { name: "title", label: "Title", required: true, min: 3, max: 200 },
          {
            name: "slug",
            label: "URL slug (lowercase, hyphens)",
            required: true,
            min: 3,
            max: 180,
          },
          {
            name: "excerpt",
            label: "Excerpt",
            type: "textarea",
            required: true,
            min: 10,
            max: 1000,
          },
          {
            name: "body",
            label: "Article text",
            type: "textarea",
            required: true,
            min: 20,
            max: 100000,
          },
          { name: "category", label: "Category", required: true, min: 2, max: 80 },
          {
            name: "readMinutes",
            label: "Reading minutes",
            type: "number",
            required: true,
            min: 1,
            max: 180,
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: ["draft", "published", "unpublished"],
          },
          {
            name: "imageId",
            label: "Article image (optional)",
            type: "upload",
            purpose: "article_image",
          },
        ]}
      />
      <details className="rounded-3xl border bg-card p-5">
        <summary className="cursor-pointer font-semibold">Propose news</summary>
        <div className="mt-4">
          <ActionForm
            title="New news candidate"
            button="Submit for editorial review"
            path="/admin/news"
            fields={[
              { name: "title", label: "Headline", required: true, min: 3, max: 300 },
              { name: "source", label: "Source", required: true, min: 2, max: 100 },
              {
                name: "summary",
                label: "Summary",
                type: "textarea",
                required: true,
                min: 10,
                max: 3000,
              },
              { name: "url", label: "Source link (https)", required: true },
            ]}
          />
        </div>
      </details>
      <DataTable
        path="/admin/news"
        title="News review"
        columns={[c("title", "Title"), c("source", "Source"), c("status", "Status", true)]}
        actions={(r) => (
          <ActionForm
            title="News decision"
            path={"/admin/news/" + r.id}
            method="PATCH"
            fields={[
              {
                name: "status",
                label: "Status",
                type: "select",
                required: true,
                options: ["approved", "rejected"],
              },
            ]}
          />
        )}
      />
    </ResourcePage>
  );
}
export function AdminAds() {
  const profile = useProfile();
  return (
    <ResourcePage title="Advertising review">
      {profile.data?.staff?.role === "super" && (
        <details className="rounded-3xl border bg-card p-5">
          <summary className="cursor-pointer font-semibold">Manage advertising packages</summary>
          <div className="mt-4">
            <ActionForm
              title="Create or update package"
              button="Save advertising package"
              path="/admin/advertising/packages"
              method="PUT"
              fields={[
                { name: "id", label: "Package code", required: true, max: 40 },
                { name: "name", label: "Package name", required: true, min: 2, max: 100 },
                {
                  name: "durationDays",
                  label: "Duration (days)",
                  type: "number",
                  required: true,
                  min: 1,
                  max: 365,
                },
                { name: "price", label: "Price (?)", required: true },
                {
                  name: "active",
                  label: "Available to advertisers",
                  type: "checkbox",
                  value: true,
                },
              ]}
            />
          </div>
        </details>
      )}
      <DataTable
        path="/admin/advertising/campaigns"
        title="Campaigns"
        columns={[
          c("title", "Title"),
          c("status", "Status", true),
          c("price", "Price (₦)"),
          c("paymentStatus", "Payment", true),
        ]}
        actions={(r) => (
          <ActionForm
            title="Campaign decision"
            path={"/admin/advertising/campaigns/" + r.id}
            method="PATCH"
            fields={[
              {
                name: "status",
                label: "Status",
                type: "select",
                required: true,
                options: ["approved", "rejected", "paused"],
              },
              { name: "reason", label: "Reason", required: true, min: 5, max: 2000 },
            ]}
          />
        )}
      />
    </ResourcePage>
  );
}
export function AdminSettings() {
  const query = useResource("/admin/settings");
  const profile = useProfile();
  return (
    <ResourcePage title="Platform settings">
      <QueryState query={query}>
        {(data) => {
          if (!data)
            return <ActionButton path="/admin/settings">Initialize platform settings</ActionButton>;
          const settings = record(data);
          return (
            <ActionForm
              key={text(settings.version)}
              title="Fees, rewards and delivery settings"
              path="/admin/settings"
              method="PATCH"
              fields={[
                "sellerFeePct",
                "partnerFeePct",
                "pointValueNaira",
                "fareBase",
                "farePerKg",
                "fareStep",
                "fareMinPct",
                "fareMaxPct",
              ].map((name) => ({
                name,
                label: name.replace(/([A-Z])/g, " $1"),
                value: text(settings[name]),
                required: true,
              }))}
              body={(v) => ({ ...v, version: settings.version })}
            />
          );
        }}
      </QueryState>
      <StaffManagement />
      <DataTable
        path="/admin/audit"
        title="Audit log"
        columns={[c("action", "Action"), c("resourceType", "Entity"), c("createdAt", "Recorded")]}
      />
    </ResourcePage>
  );
}
