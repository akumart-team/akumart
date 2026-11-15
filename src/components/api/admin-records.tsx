import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/field";
import { Panel } from "@/components/app-ui";
import { useProfile } from "@/lib/api/hooks/use-api";
import { rows, record, text, field } from "@/lib/api/services/resources";
import { ActionForm, DataTable, QueryState, useResource } from "./data-view";
import { EvidenceLink } from "./disputes";

export function UserDirectory() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const detail = useResource(
    "/admin/users/" + encodeURIComponent(selected || ""),
    "private",
    Boolean(selected),
  );
  return (
    <section className="space-y-4">
      <Panel title="Account directory">
        <form
          className="flex gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search.trim());
          }}
        >
          <input
            aria-label="Search member accounts"
            className={inputCls}
            placeholder="Search name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button type="submit">Search accounts</Button>
        </form>
      </Panel>
      <DataTable
        title="Member accounts"
        path={"/admin/users" + (query ? "?search=" + encodeURIComponent(query) : "")}
        columns={[
          { key: "email", label: "Email" },
          { key: "displayName", label: "Name" },
          { key: "city", label: "City" },
        ]}
        actions={(row) => (
          <Button variant="outline" size="sm" onClick={() => setSelected(text(row.id))}>
            View account
          </Button>
        )}
      />
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Member account</DialogTitle>
            <DialogDescription>
              Account information and current backend verification records.
            </DialogDescription>
          </DialogHeader>
          <QueryState query={detail}>
            {(data) => {
              const user = record(data);
              return (
                <div className="space-y-5">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {[
                      "email",
                      "firstName",
                      "lastName",
                      "displayName",
                      "phone",
                      "city",
                      "termsAcceptedAt",
                    ].map((key) => (
                      <div key={key}>
                        <dt className="text-xs capitalize text-muted-foreground">
                          {key.replace(/([A-Z])/g, " $1")}
                        </dt>
                        <dd className="break-words text-sm">{text(user[key])}</dd>
                      </div>
                    ))}
                  </dl>
                  <Panel title="Marketplace verification">
                    <ul className="space-y-2 text-sm">
                      {rows(user.verifications).map((row) => (
                        <li className="flex flex-wrap justify-between gap-2" key={text(row.id)}>
                          <span className="capitalize">
                            {text(row.level)} · {text(row.type)}
                          </span>
                          <span>
                            {text(row.status)}
                            {row.expiresAt ? " · expires " + text(row.expiresAt) : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                  <p className="text-sm">Recycling points: {text(field(user, "wallet.balance"))}</p>
                  <p className="text-sm">
                    Logistics application: {text(field(user, "partner.status"))}
                  </p>
                </div>
              );
            }}
          </QueryState>
        </DialogContent>
      </Dialog>
    </section>
  );
}
export function AdminOrderQueue() {
  const [id, setId] = useState<string | null>(null);
  const detail = useResource(
    "/admin/orders/" + encodeURIComponent(id || ""),
    "private",
    Boolean(id),
  );
  const me = useProfile();
  return (
    <>
      <DataTable
        title="Order records"
        path="/admin/orders"
        columns={[
          { key: "title", label: "Order" },
          { key: "status", label: "Status", status: true },
          { key: "paymentStatus", label: "Payment", status: true },
        ]}
        actions={(row) => (
          <Button size="sm" variant="outline" onClick={() => setId(text(row.id))}>
            Inspect order
          </Button>
        )}
      />
      <Dialog
        open={Boolean(id)}
        onOpenChange={(open) => {
          if (!open) setId(null);
        }}
      >
        <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Order record</DialogTitle>
            <DialogDescription>
              Commercial terms, delivery evidence, payments and settlement holds.
            </DialogDescription>
          </DialogHeader>
          <QueryState query={detail}>
            {(data) => {
              const order = record(data);
              const finance = ["super", "finance"].includes(me.data?.staff?.role || "");
              const canHold = finance && ![order.buyerId, order.sellerId].includes(me.data?.id);
              return (
                <div className="space-y-5">
                  <Panel title={text(order.title)}>
                    <dl className="grid gap-3 sm:grid-cols-3">
                      {[
                        "status",
                        "paymentStatus",
                        "quantity",
                        "unit",
                        "unitPrice",
                        "destination",
                      ].map((key) => (
                        <div key={key}>
                          <dt className="text-xs capitalize text-muted-foreground">
                            {key.replace(/([A-Z])/g, " $1")}
                          </dt>
                          <dd className="text-sm">{text(order[key])}</dd>
                        </div>
                      ))}
                    </dl>
                  </Panel>
                  <Panel title="Delivery evidence">
                    <div className="flex flex-wrap gap-2">
                      {rows(order.proofs).map((proof, index) => (
                        <EvidenceLink
                          key={text(proof.uploadId)}
                          id={text(proof.uploadId)}
                          label={"Delivery proof " + (index + 1)}
                        />
                      ))}
                      {!rows(order.proofs).length && (
                        <p className="text-sm text-muted-foreground">
                          No delivery proof submitted.
                        </p>
                      )}
                    </div>
                  </Panel>
                  <Panel title="Payments">
                    <ul className="space-y-2 text-sm">
                      {rows(order.payments).map((payment) => (
                        <li key={text(payment.id)}>
                          {text(payment.providerReference)} · ₦{text(payment.amount)} ·{" "}
                          {text(payment.status)}
                        </li>
                      ))}
                      {!rows(order.payments).length && <li>No payment attempts.</li>}
                    </ul>
                  </Panel>
                  <Panel title="Settlement holds">
                    <ul className="space-y-4">
                      {rows(order.holds).map((hold) => (
                        <li className="rounded-xl border p-3" key={text(hold.id)}>
                          <p className="text-sm">{text(hold.reason)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {hold.releasedAt ? "Released " + text(hold.releasedAt) : "Active hold"}
                          </p>
                          {canHold && !hold.releasedAt && (
                            <ActionForm
                              title="Release hold"
                              button="Release this hold"
                              path={"/admin/orders/" + id + "/holds/" + hold.id + "/release"}
                              fields={[
                                {
                                  name: "reason",
                                  label: "Reason for releasing hold",
                                  required: true,
                                  min: 5,
                                  max: 2000,
                                },
                              ]}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                    {!rows(order.holds).length && (
                      <p className="text-sm text-muted-foreground">No holds recorded.</p>
                    )}
                  </Panel>
                  {canHold && (
                    <ActionForm
                      title="Place settlement hold"
                      button="Place hold"
                      path={"/admin/orders/" + id + "/holds"}
                      fields={[
                        {
                          name: "reason",
                          label: "Reason for holding settlement",
                          required: true,
                          min: 5,
                          max: 2000,
                        },
                      ]}
                    />
                  )}
                  <Panel title="Timeline">
                    <ul className="space-y-2 text-sm">
                      {rows(order.events).map((event) => (
                        <li key={text(event.id)}>
                          {text(event.createdAt)} · {text(event.action).replaceAll("_", " ")}
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </div>
              );
            }}
          </QueryState>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function ArticleEditor({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const query = useResource("/admin/articles/" + encodeURIComponent(slug), "private", open);
  return (
    <details
      className="min-w-64 rounded-xl border p-3"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm font-medium text-primary">Edit article</summary>
      {open && (
        <div className="mt-4">
          <QueryState query={query}>
            {(data) => {
              const article = record(data);
              return (
                <ActionForm
                  key={text(article.updatedAt)}
                  title="Article content"
                  button="Save article changes"
                  path={"/admin/articles/" + article.id}
                  method="PATCH"
                  fields={[
                    {
                      name: "title",
                      label: "Title",
                      required: true,
                      min: 3,
                      max: 200,
                      value: text(article.title),
                    },
                    {
                      name: "slug",
                      label: "URL slug",
                      required: true,
                      min: 3,
                      max: 180,
                      value: text(article.slug),
                    },
                    {
                      name: "excerpt",
                      label: "Excerpt",
                      type: "textarea",
                      required: true,
                      min: 10,
                      max: 1000,
                      value: text(article.excerpt),
                    },
                    {
                      name: "body",
                      label: "Article text",
                      type: "textarea",
                      required: true,
                      min: 20,
                      max: 100000,
                      value: text(article.body),
                    },
                    {
                      name: "category",
                      label: "Category",
                      required: true,
                      min: 2,
                      max: 80,
                      value: text(article.category),
                    },
                    {
                      name: "readMinutes",
                      label: "Reading minutes",
                      type: "number",
                      required: true,
                      min: 1,
                      max: 180,
                      value: text(article.readMinutes),
                    },
                    {
                      name: "status",
                      label: "Status",
                      type: "select",
                      required: true,
                      options: ["draft", "published", "unpublished"],
                      value: text(article.status),
                    },
                    {
                      name: "imageId",
                      label: "Replace article image (optional)",
                      type: "upload",
                      purpose: "article_image",
                    },
                  ]}
                />
              );
            }}
          </QueryState>
        </div>
      )}
    </details>
  );
}
