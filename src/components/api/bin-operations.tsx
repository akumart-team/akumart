import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/app-ui";
import { inputCls } from "@/components/field";
import { request, json, errorMessage } from "@/lib/api/client";
import { record, rows, text, type RecordValue } from "@/lib/api/services/resources";
import { workflowPaths, csv, localDateTime } from "@/lib/api/services/workflows";
import {
  ActionButton,
  ActionForm,
  DataTable,
  QueryState,
  useResource,
  type FormField,
} from "./data-view";

const c = (key: string, label: string, status = false) => ({ key, label, status });
export function BinCreate() {
  return (
    <details className="rounded-3xl border bg-card p-5">
      <summary className="cursor-pointer font-semibold">Register a bin</summary>
      <div className="mt-5">
        <ActionForm
          title="New bin details"
          button="Register bin"
          path="/admin/akubin/bins"
          fields={[
            { name: "code", label: "Printed bin code", required: true, max: 40 },
            { name: "name", label: "Location name", required: true, max: 200 },
            { name: "city", label: "City", required: true, max: 100 },
            { name: "area", label: "Area", required: true, max: 200 },
            { name: "landmark", label: "Landmark" },
            {
              name: "latitude",
              label: "Latitude",
              type: "number",
              step: "any",
              min: -90,
              max: 90,
              required: true,
            },
            {
              name: "longitude",
              label: "Longitude",
              type: "number",
              step: "any",
              min: -180,
              max: 180,
              required: true,
            },
            { name: "materials", label: "Materials (comma separated)", required: true },
            { name: "hours", label: "Opening hours", required: true },
            {
              name: "status",
              label: "Availability",
              type: "select",
              options: ["offline", "online", "maintenance", "full"],
              required: true,
              value: "offline",
            },
          ]}
          body={(values) => ({ ...values, materials: csv(values.materials) })}
        />
      </div>
    </details>
  );
}
function DeviceRegistration({ binId }: { binId: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  return (
    <Panel title="Register controller">
      {key ? (
        <div className="space-y-3 rounded-xl border p-4">
          <p className="text-sm font-semibold">Save this controller key now</p>
          <p className="text-sm text-muted-foreground">
            It is shown once. Provision it on the controller; it is not your account password.
          </p>
          <code className="block break-all rounded-lg bg-muted p-3" data-sensitive="true">
            {key}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(key);
                  setNotice("Copied to clipboard.");
                } catch {
                  setError("Copy the key manually.");
                }
              }}
            >
              Copy key
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setKey(null);
                setNotice("Controller registered. The key has been cleared from this view.");
              }}
            >
              I saved the key
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const form = event.currentTarget;
            setBusy(true);
            setError("");
            setNotice("");
            try {
              const result = await request<{ data: { deviceKey: string | null } }>(
                workflowPaths.bin(binId) + "/devices",
                json("POST", {
                  serialNumber: String(values.get("serialNumber")),
                  authMode: String(values.get("authMode")),
                }),
              );
              setKey(result.data.deviceKey);
              if (!result.data.deviceKey)
                setNotice("Legacy controller registered. No device key was generated.");
              form.reset();
              await qc.invalidateQueries({ queryKey: ["api", "resource"] });
            } catch (cause) {
              setError(errorMessage(cause));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block text-sm font-medium">
            Controller serial number
            <input
              className={inputCls + " mt-2"}
              name="serialNumber"
              required
              maxLength={100}
              disabled={busy}
            />
          </label>
          <label className="block text-sm font-medium">
            Controller authentication
            <select className={inputCls + " mt-2"} name="authMode" disabled={busy}>
              <option value="authenticated">Device key</option>
              <option value="legacy_bin_id">Legacy firmware pilot</option>
            </select>
          </label>
          <p className="text-xs text-muted-foreground">
            Only one active controller is allowed per bin. Legacy registration requires the backend
            pilot setting.
          </p>
          <Button type="submit" disabled={busy}>
            {busy ? "Registering…" : "Register controller"}
          </Button>
        </form>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-primary">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </Panel>
  );
}
export function BinManager({ bin, onClose }: { bin: RecordValue | null; onClose: () => void }) {
  const [tab, setTab] = useState("details");
  if (!bin) return null;
  const id = text(bin.id);
  const base = workflowPaths.bin(id);
  const editFields: FormField[] = ["name", "city", "area", "landmark", "hours", "collector"].map(
    (name) => ({
      name,
      label: name.replace(/^./, (s) => s.toUpperCase()),
      value: typeof bin[name] === "string" ? String(bin[name]) : "",
      required: ["name", "city", "area", "hours"].includes(name),
    }),
  );
  editFields.push(
    {
      name: "materials",
      label: "Materials (comma separated)",
      required: true,
      value: Array.isArray(bin.materials) ? bin.materials.join(", ") : "",
    },
    {
      name: "latitude",
      label: "Latitude",
      type: "number",
      step: "any",
      required: true,
      value: String(bin.latitude),
      min: -90,
      max: 90,
    },
    {
      name: "longitude",
      label: "Longitude",
      type: "number",
      step: "any",
      required: true,
      value: String(bin.longitude),
      min: -180,
      max: 180,
    },
    {
      name: "status",
      label: "Availability",
      type: "select",
      required: true,
      value: String(bin.status),
      options: ["online", "offline", "full", "maintenance"],
    },
  );
  return (
    <Dialog
      open={Boolean(bin)}
      onOpenChange={(open) => {
        if (!open) {
          setTab("details");
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[88dvh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{text(bin.name)}</DialogTitle>
          <DialogDescription>
            {text(bin.code)} · Manage this bin’s availability, controller and operational history.
          </DialogDescription>
        </DialogHeader>
        <div
          className="sidebar-scroll flex gap-2 overflow-x-auto py-2"
          role="tablist"
          aria-label="Bin management sections"
        >
          {["details", "maintenance", "collections", "devices", "telemetry", "events"].map(
            (value) => (
              <Button
                key={value}
                role="tab"
                aria-selected={tab === value}
                size="sm"
                variant={tab === value ? "default" : "outline"}
                onClick={() => setTab(value)}
              >
                {value.replace(/^./, (s) => s.toUpperCase())}
              </Button>
            ),
          )}
        </div>
        <div className="space-y-5">
          {tab === "details" && (
            <ActionForm
              title="Bin details"
              button="Save bin details"
              path={base}
              method="PATCH"
              fields={editFields}
              body={(values) => ({ ...values, materials: csv(values.materials) })}
            />
          )}
          {tab === "maintenance" && (
            <>
              <ActionForm
                title="Report maintenance issue"
                button="Open maintenance ticket"
                path={base + "/maintenance-tickets"}
                fields={[
                  { name: "issue", label: "Issue", type: "textarea", required: true, max: 1000 },
                ]}
              />
              <DataTable
                title="Maintenance history"
                path={base + "/maintenance-tickets"}
                columns={[
                  c("issue", "Issue"),
                  c("status", "Status", true),
                  c("createdAt", "Opened"),
                ]}
                actions={(row) =>
                  row.status === "open" ? (
                    <ActionButton path={base + "/maintenance-tickets/" + row.id + "/resolve"}>
                      Resolve issue
                    </ActionButton>
                  ) : null
                }
              />
              <p className="text-xs text-muted-foreground">
                Resolving a ticket does not automatically put the bin online. Check it physically,
                then update availability in Details.
              </p>
            </>
          )}
          {tab === "collections" && (
            <>
              <ActionForm
                title="Record collection"
                button="Record collection"
                path={base + "/collections"}
                fields={[
                  { name: "collector", label: "Collector", required: true, max: 200 },
                  { name: "note", label: "Collection note", type: "textarea", max: 1000 },
                  { name: "nextCollectionAt", label: "Next collection (ISO date/time, optional)" },
                ]}
              />
              <p className="text-sm text-muted-foreground">
                Record a completed collection. The backend resets recorded capacity; this does not
                operate the physical lock.
              </p>
            </>
          )}
          {tab === "devices" && (
            <>
              <DeviceRegistration key={id} binId={id} />
              <DataTable
                title="Controller history"
                path={base + "/devices"}
                columns={[
                  c("serialNumber", "Serial"),
                  c("authMode", "Authentication"),
                  c("lastSeenAt", "Last seen"),
                  c("revokedAt", "Revoked"),
                ]}
                actions={(row) =>
                  !row.revokedAt ? (
                    <details className="min-w-52">
                      <summary className="cursor-pointer text-sm text-destructive">
                        Revoke controller
                      </summary>
                      <ActionForm
                        title="Confirm controller revocation"
                        path={"/admin/akubin/devices/" + row.id}
                        method="DELETE"
                        button="Revoke controller"
                        fields={[
                          {
                            name: "confirmed",
                            label:
                              "I understand this disables the controller and ends its sessions",
                            type: "checkbox",
                            required: true,
                          },
                        ]}
                        body={() => undefined}
                      />
                    </details>
                  ) : (
                    <span className="text-xs text-muted-foreground">Revoked</span>
                  )
                }
              />
            </>
          )}
          {tab === "telemetry" && (
            <DataTable
              title="Sensor reports"
              path={base + "/telemetry"}
              columns={[
                c("distanceCm", "Distance (cm)"),
                c("reportedFull", "Full reported"),
                c("deviceUptimeMs", "Controller uptime (ms)"),
                c("receivedAt", "Received"),
              ]}
            />
          )}
          {tab === "events" && (
            <DataTable
              title="Operational history"
              path={base + "/events"}
              columns={[
                c("action", "Event"),
                c("actorLabel", "Recorded by"),
                c("createdAt", "Recorded"),
              ]}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function RewardOperations() {
  const rules = useResource("/akubin/reward-rules", "public");
  return (
    <section className="space-y-5" aria-label="AkuBin reward operations">
      <h2 className="font-display text-2xl font-semibold">AkuBin rewards</h2>
      <DataTable
        title="Redemption review"
        path="/admin/akubin/redemptions"
        columns={[
          c("rewardName", "Reward"),
          c("profileId", "Member"),
          c("costPoints", "Points"),
          c("status", "Status", true),
          c("reason", "Reason"),
        ]}
        actions={(row) =>
          row.status === "pending_review" ? (
            <ActionForm
              title="Review redemption"
              button="Save redemption decision"
              path={workflowPaths.redemptionDecision(text(row.id))}
              fields={[
                {
                  name: "decision",
                  label: "Decision",
                  type: "select",
                  required: true,
                  options: [
                    { value: "approve", label: "Approve for fulfilment" },
                    { value: "reject", label: "Reject and return points" },
                  ],
                },
                { name: "reason", label: "Reason", required: true, max: 1000 },
              ]}
            />
          ) : row.status === "approved" ? (
            <ActionForm
              title="Record completed fulfilment"
              button="Record fulfilment receipt"
              path={workflowPaths.redemptionFulfillment(text(row.id))}
              fields={[
                { name: "provider", label: "Operator or provider", required: true, max: 50 },
                {
                  name: "reference",
                  label: "Existing fulfilment receipt/reference",
                  required: true,
                  max: 200,
                },
                {
                  name: "confirmed",
                  label: "I verified that this reward was already fulfilled",
                  type: "checkbox",
                  required: true,
                },
              ]}
              body={(values) => ({ provider: values.provider, reference: values.reference })}
            />
          ) : null
        }
      />
      <details className="rounded-3xl border bg-card p-5">
        <summary className="cursor-pointer font-semibold">Reward catalogue and rates</summary>
        <div className="mt-5 space-y-5">
          <DataTable
            title="Active rewards"
            path="/akubin/rewards"
            access="public"
            columns={[
              c("name", "Reward"),
              c("kind", "Type"),
              c("costPoints", "Points"),
              c("valueLabel", "Value"),
              c("stock", "Stock"),
            ]}
            actions={(row) => (
              <ActionButton path={"/admin/akubin/rewards/" + row.id} method="DELETE">
                Archive reward
              </ActionButton>
            )}
          />
          <ActionForm
            title="Create reward"
            button="Create reward"
            path="/admin/akubin/rewards"
            fields={[
              { name: "name", label: "Reward name", required: true, max: 200 },
              {
                name: "kind",
                label: "Reward type",
                type: "select",
                required: true,
                options: ["physical", "airtime", "cash"],
              },
              {
                name: "costPoints",
                label: "Cost in points",
                type: "number",
                min: 1,
                required: true,
              },
              { name: "valueLabel", label: "Reward value label", required: true, max: 200 },
              { name: "valueAmount", label: "Value amount (₦, optional)" },
              { name: "stock", label: "Available stock (optional)", type: "number", min: 0 },
              { name: "active", label: "Available for redemption", type: "checkbox", value: true },
            ]}
          />
          <QueryState query={rules}>
            {(data) => {
              const current = record(data);
              return (
                <ActionForm
                  key={text(current.updatedAt)}
                  title="Reward rates and thresholds"
                  button="Save reward rules"
                  path="/admin/akubin/reward-rules"
                  method="PATCH"
                  fields={[
                    {
                      name: "pointValueNaira",
                      label: "Naira value per point",
                      required: true,
                      value: text(current.pointValueNaira),
                    },
                    {
                      name: "airtimeMinPoints",
                      label: "Minimum airtime points",
                      type: "number",
                      min: 0,
                      value: text(current.airtimeMinPoints),
                    },
                    {
                      name: "cashMinPoints",
                      label: "Minimum cash points",
                      type: "number",
                      min: 0,
                      value: text(current.cashMinPoints),
                    },
                    ...rows(current.rates).map((rate) => ({
                      name: "rate_" + rate.material,
                      label: text(rate.material) + " points per gram",
                      required: true,
                      value: text(rate.pointsPerGram),
                    })),
                  ]}
                  body={(values) => ({
                    pointValueNaira: values.pointValueNaira,
                    airtimeMinPoints: values.airtimeMinPoints,
                    cashMinPoints: values.cashMinPoints,
                    rates: rows(current.rates).map((rate) => ({
                      material: rate.material,
                      pointsPerGram: values["rate_" + rate.material],
                    })),
                  })}
                />
              );
            }}
          </QueryState>
          <p className="text-xs text-muted-foreground">
            Fulfilment records an existing receipt. It does not initiate cash or airtime transfers.
            Archiving preserves redemption history.
          </p>
        </div>
      </details>
    </section>
  );
}
