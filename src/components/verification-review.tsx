import { useState } from "react";
import { Panel } from "./app-ui";
import { Button } from "./ui/button";
import { Field, inputCls } from "./field";
import { StatusChip } from "./status-chip";
import { useDecision, useProfile, useReviewQueue } from "@/lib/api/hooks/use-api";
import { errorMessage } from "@/lib/api/client";
import { getUploadAccess } from "@/lib/api/services/uploads";
import type { Decision, VerificationRecord } from "@/lib/api/types";

function Review({ row, self }: { row: VerificationRecord; self: boolean }) {
  const decision = useDecision();
  const [reason, setReason] = useState("");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  const open = ["pending_review", "checking", "collecting"].includes(row.status);
  async function decide(value: Decision["decision"]) {
    setError("");
    if (!reason.trim()) return setError("Give a reason for this decision.");
    if (expiry && (!Number.isFinite(Date.parse(expiry)) || Date.parse(expiry) <= Date.now()))
      return setError("Expiry must be in the future.");
    try {
      await decision.mutateAsync({
        id: row.id,
        decision: value,
        reason: reason.trim(),
        ...(value === "approved" && expiry ? { expiresAt: new Date(expiry).toISOString() } : {}),
      });
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }
  async function viewDocument(id: string) {
    // Open synchronously to avoid popup blocking while the signed URL is fetched.
    const tab = window.open("about:blank", "_blank");
    if (!tab) return setError("Allow a new tab to view the document.");
    tab.opener = null;
    setOpening(true);
    setError("");
    try {
      const result = await getUploadAccess(id);
      const url = new URL(result.data.url);
      if (url.protocol !== "https:" && url.hostname !== "localhost")
        throw new Error("Invalid document URL.");
      tab.location.replace(url.href);
    } catch (cause) {
      tab.close();
      setError(errorMessage(cause));
    } finally {
      setOpening(false);
    }
  }
  return (
    <Panel
      title={`${row.profile?.email || row.profileId} · ${row.level} · ${row.type}`}
      action={<StatusChip status={row.status} />}
    >
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {Object.entries(row.data).map(([key, value]) => (
          <div key={key}>
            <dt className="font-medium">{key}</dt>
            <dd className="break-words text-muted-foreground">
              {/idnumber/i.test(key) ? "••••" + value.slice(-4) : value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="my-4 flex flex-wrap gap-2">
        {row.documents.map((document) => (
          <Button
            key={document.uploadId}
            variant="outline"
            disabled={opening}
            onClick={() => void viewDocument(document.uploadId)}
          >
            View {document.kind}
          </Button>
        ))}
      </div>
      {row.reason && <p className="mb-3 text-sm">Decision reason: {row.reason}</p>}
      {self && (
        <p className="text-sm text-muted-foreground">You cannot review your own verification.</p>
      )}
      {open && !self && (
        <fieldset disabled={decision.isPending} className="space-y-3">
          <Field label="Decision reason">
            <textarea
              className={inputCls}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          <Field label="Approval expiry (optional)">
            <input
              type="datetime-local"
              className={inputCls}
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void decide("approved")}>Approve</Button>
            <Button variant="outline" onClick={() => void decide("needs_resubmission")}>
              Request resubmission
            </Button>
            <Button variant="destructive" onClick={() => void decide("rejected")}>
              Reject
            </Button>
          </div>
        </fieldset>
      )}
      {error && (
        <p role="alert" className="mt-3 text-destructive">
          {error}
        </p>
      )}
      <ul className="mt-4 text-xs text-muted-foreground">
        {row.events.map((event) => (
          <li key={event.id}>
            {new Date(event.createdAt).toLocaleString()} · {event.action} ·{" "}
            {event.status.replaceAll("_", " ")}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
export function VerificationReview() {
  const profile = useProfile();
  const [page, setPage] = useState(1);
  const staff = profile.data?.staff;
  const allowed = Boolean(staff?.active && ["super", "support", "operations"].includes(staff.role));
  const queue = useReviewQueue(page, allowed);
  if (profile.isPending) return <p role="status">Loading staff access…</p>;
  if (!allowed)
    return <p role="alert">An active support, operations or super staff role is required.</p>;
  return (
    <div className="space-y-5">
      <h1 className="text-display text-3xl">Verification review</h1>
      <p>
        Review submitted information and private documents. Decisions and reasons are recorded by
        the backend.
      </p>
      {queue.isPending ? (
        <p role="status">Loading submissions…</p>
      ) : queue.isError ? (
        <div role="alert">
          {errorMessage(queue.error)}{" "}
          <Button onClick={() => void queue.refetch()}>Try again</Button>
        </div>
      ) : (
        <>
          {!queue.data.data.length && <p>No submissions on this page.</p>}
          {queue.data.data.map((row) => (
            <Review key={row.id} row={row} self={row.profileId === profile.data?.id} />
          ))}
          <div className="flex items-center gap-3">
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span>Page {page}</span>
            <Button
              disabled={page * 20 >= queue.data.pagination.total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
