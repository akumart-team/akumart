import { useState } from "react";
import { useProfile } from "@/lib/api/hooks/use-api";
import { rows, record, text, field, type RecordValue } from "@/lib/api/services/resources";
import { workflowPaths } from "@/lib/api/services/workflows";
import { getUploadAccess } from "@/lib/api/services/uploads";
import { errorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/app-ui";
import { ActionForm, DataTable } from "./data-view";

export function EvidenceLink({ id, label }: { id: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function open() {
    const tab = window.open("about:blank", "_blank");
    if (!tab) return setError("Allow a new tab to view the document.");
    tab.opener = null;
    setBusy(true);
    setError("");
    try {
      const result = await getUploadAccess(id);
      const url = new URL(result.data.url);
      if (url.protocol !== "https:") throw new Error("Invalid document address.");
      tab.location.replace(url.href);
    } catch (cause) {
      tab.close();
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex flex-col gap-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => void open()}>
        {busy ? "Opening…" : label}
      </Button>
      {error && (
        <span role="alert" className="text-sm text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
export function OrderDispute({ order }: { order: RecordValue }) {
  const me = useProfile();
  const dispute = record(order.dispute);
  const canOpen =
    order.buyerId === me.data?.id &&
    order.paymentStatus === "held" &&
    ["delivered", "proof_uploaded"].includes(String(order.status)) &&
    (!order.inspectionDue || Date.parse(String(order.inspectionDue)) > Date.now()) &&
    !order.dispute;
  if (order.dispute)
    return (
      <Panel title="Delivery dispute">
        <p className="mb-3">
          {text(dispute.status)} · {text(dispute.reason)}
        </p>
        {Boolean(dispute.decisionReason) && (
          <p className="mb-3 text-sm">{text(dispute.decisionReason)}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {rows(dispute.evidence).map((document, index) => (
            <EvidenceLink
              key={text(document.uploadId)}
              id={text(document.uploadId)}
              label={"Evidence " + (index + 1)}
            />
          ))}
        </div>
      </Panel>
    );
  return canOpen ? (
    <ActionForm
      title="Report a delivery issue"
      button="Open dispute"
      path={workflowPaths.dispute(text(order.id))}
      fields={[
        {
          name: "reason",
          label: "Describe the issue",
          type: "textarea",
          required: true,
          min: 10,
          max: 5000,
        },
        {
          name: "evidence",
          label: "Supporting evidence (optional)",
          type: "upload",
          purpose: "dispute_evidence",
        },
        {
          name: "confirmed",
          label: "I have reviewed this issue and want staff to investigate it",
          type: "checkbox",
          required: true,
        },
      ]}
      body={(values) => ({
        reason: values.reason,
        uploadIds: values.evidence ? [values.evidence] : [],
      })}
    />
  ) : null;
}
function ReviewDispute({ row }: { row: RecordValue }) {
  const me = useProfile();
  const finance = ["super", "finance"].includes(me.data?.staff?.role || "");
  const own = [row.openedById, field(row, "order.sellerId")].includes(me.data?.id);
  return (
    <details className="min-w-64 rounded-xl border p-3">
      <summary className="cursor-pointer text-sm font-medium text-primary">Review dispute</summary>
      <div className="mt-4 space-y-4">
        <p className="text-sm">{text(field(row, "order.title"))}</p>
        <div className="flex flex-wrap gap-2">
          {rows(row.evidence).map((document, index) => (
            <EvidenceLink
              key={text(document.uploadId)}
              id={text(document.uploadId)}
              label={"Evidence " + (index + 1)}
            />
          ))}
        </div>
        {own ? (
          <p className="text-sm text-muted-foreground">
            An independent finance reviewer must decide this dispute.
          </p>
        ) : finance && row.status !== "resolved" ? (
          <ActionForm
            title="Dispute decision"
            button="Record decision"
            path={workflowPaths.disputeDecision(text(row.id))}
            fields={[
              {
                name: "decision",
                label: "Decision",
                type: "select",
                required: true,
                options: [
                  { value: "release", label: "Release the delivery hold" },
                  { value: "refund", label: "Full refund, including delivery" },
                  { value: "partial", label: "Partial merchandise refund" },
                ],
              },
              { name: "refundAmount", label: "Partial refund amount (₦, partial decision only)" },
              {
                name: "reason",
                label: "Decision reason",
                type: "textarea",
                required: true,
                min: 10,
                max: 3000,
              },
              {
                name: "reviewed",
                label: "I reviewed the evidence, payment and decision amount",
                type: "checkbox",
                required: true,
              },
            ]}
            body={(values) => ({
              decision: values.decision,
              reason: values.reason,
              ...(values.decision === "partial" ? { refundAmount: values.refundAmount } : {}),
            })}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {row.status === "resolved"
              ? text(row.decisionReason)
              : "Finance staff make the final decision."}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Refund execution depends on the payment provider. A recorded decision and a completed
          refund are separate states.
        </p>
      </div>
    </details>
  );
}
export function DisputeQueue() {
  return (
    <DataTable
      path="/admin/disputes"
      title="Delivery disputes"
      columns={[
        { key: "order.title", label: "Order" },
        { key: "reason", label: "Issue" },
        { key: "status", label: "Status", status: true },
        { key: "createdAt", label: "Opened" },
      ]}
      actions={(row) => <ReviewDispute row={row} />}
    />
  );
}
