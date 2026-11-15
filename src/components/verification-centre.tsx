import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { Panel, PageTitle } from "./app-ui";
import { Field, inputCls } from "./field";
import { Button } from "./ui/button";
import { StatusChip } from "./status-chip";
import { useProfile, useSubmitVerification, useVerification } from "@/lib/api/hooks/use-api";
import { errorMessage } from "@/lib/api/client";
import { approvedBasic, canTrade, levelState } from "@/lib/api/verification-policy";
import { uploadVerificationDocument, validateDocument } from "@/lib/api/services/uploads";
import type { VerificationLevel, VerificationType, VerificationRecord } from "@/lib/api/types";
import { setIntent, useDB } from "@/lib/store";

type Attachment = { file: File; kind: string; uploadId?: string };
const emptyRows: VerificationRecord[] = [];
const kinds = [
  ["identity", "Government ID"],
  ["selfie", "Selfie"],
  ["address", "Address evidence"],
  ["cac", "Business registration"],
  ["other", "Other supporting document"],
];
export function VerificationPage({ requestedLevel }: { requestedLevel?: VerificationLevel }) {
  const profile = useProfile();
  const verification = useVerification();
  const submission = useSubmitVerification();
  const router = useRouter();
  const intent = useDB((db) => db.intent);
  const [now, setNow] = useState(Date.now());
  const [formLevel, setFormLevel] = useState<VerificationLevel | null>(null);
  const [step, setStep] = useState(0);
  const [type, setType] = useState<VerificationType>("individual");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const initialized = useRef(false);
  const formRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const rows = verification.data || emptyRows;
  const basic = approvedBasic(rows, now);
  const basicState = levelState(rows, "basic", undefined, now);
  const fullState = levelState(rows, "full", basic?.type, now);
  const fullyVerified = canTrade(profile.data, rows, "full", now);
  const currentLevel = formLevel || (!basic ? "basic" : "full");
  const actualType = currentLevel === "full" ? basic?.type || type : type;
  const pending = (level: VerificationLevel) =>
    rows.some(
      (row) =>
        row.level === level && ["collecting", "checking", "pending_review"].includes(row.status),
    );
  const start = useCallback(
    (level: VerificationLevel) => {
      const latest = rows.find((row) => row.level === level);
      setFormLevel(level);
      setStep(0);
      setType(level === "full" ? basic?.type || "individual" : latest?.type || "individual");
      setFields({
        ...latest?.data,
        legalName:
          latest?.data.legalName ||
          [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(" "),
        phone: latest?.data.phone || profile.data?.phone || "",
      });
      setAttachments([]);
      setConsent(false);
      setError("");
      setNotice("");
    },
    [rows, basic?.type, profile.data],
  );
  useEffect(() => {
    if (initialized.current || verification.isPending || profile.isPending) return;
    initialized.current = true;
    const target = requestedLevel || intent?.level;
    if (
      target &&
      (target === "basic" ? basicState : fullState).status !== "approved" &&
      !rows.some(
        (row) =>
          row.level === target && ["collecting", "checking", "pending_review"].includes(row.status),
      ) &&
      (target === "basic" || basic)
    )
      start(target);
  }, [
    verification.isPending,
    profile.isPending,
    requestedLevel,
    intent?.level,
    basicState,
    fullState,
    rows,
    basic,
    start,
  ]);
  useEffect(() => {
    if (formLevel) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formLevel]);
  function next() {
    setError("");
    if (step === 1 && !attachments.length)
      return setError("Attach at least one supporting document to continue.");
    setStep((old) => Math.min(2, old + 1));
  }
  async function submit() {
    setError("");
    if (!attachments.length) return setError("Attach at least one supporting document.");
    if (!consent) return setError("Please consent to verification processing.");
    setBusy(true);
    try {
      const documents = [];
      for (const [index, item] of attachments.entries()) {
        const uploadId = item.uploadId || (await uploadVerificationDocument(item.file));
        setAttachments((old) =>
          old.map((entry, i) => (i === index ? { ...entry, uploadId } : entry)),
        );
        documents.push({ uploadId, kind: item.kind });
      }
      await submission.mutateAsync({
        level: currentLevel,
        type: actualType,
        data: { ...fields, consentAcceptedAt: new Date().toISOString() },
        documents,
      });
      setFormLevel(null);
      setAttachments([]);
      setConsent(false);
      setNotice("Submitted for staff review. We’ll notify you when a decision is available.");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  if (verification.isPending || profile.isPending)
    return (
      <div role="status" className="animate-pulse space-y-4">
        <div className="h-9 w-60 rounded-lg bg-muted" />
        <div className="h-44 rounded-3xl bg-muted" />
        <p>Loading verification…</p>
      </div>
    );
  if (verification.isError || profile.isError)
    return (
      <div role="alert" className="rounded-2xl border p-6">
        <p>{errorMessage(verification.error || profile.error)}</p>
        <Button
          className="mt-3"
          onClick={() => {
            void verification.refetch();
            void profile.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  const overviewPending = pending("basic") || pending("full");
  return (
    <div className="w-full min-w-0 space-y-7">
      <PageTitle
        eyebrow="Your account"
        title="Verification centre"
        intro="Build trust before you trade. Choose the verification you need, and we’ll guide you through it."
      />
      <section className="relative overflow-hidden rounded-3xl bg-forest p-6 text-forest-foreground sm:p-8">
        <ShieldCheck
          className="pointer-events-none absolute -right-5 -top-8 h-48 w-48 text-white/5"
          aria-hidden
        />
        <div className="relative flex items-start gap-4">
          <div className="rounded-2xl bg-white/10 p-3">
            {fullyVerified ? (
              <CheckCircle2 className="h-7 w-7 text-lime" />
            ) : overviewPending ? (
              <Clock3 className="h-7 w-7 text-lime" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-lime" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-lime">
              Marketplace access
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
              {fullyVerified
                ? "You’re verified and ready to trade"
                : overviewPending
                  ? "Your application is with our team"
                  : basic
                    ? "Basic approved. Full verification is next."
                    : "Let’s get you ready to trade"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              {fullyVerified
                ? "Your current approvals cover Marketplace trading and checkout. Your documents remain private."
                : overviewPending
                  ? "You can keep browsing while staff review your documents. You’ll find the decision here and in Notifications."
                  : "Browsing, saving listings and AkuBin recycling stay available. Verification is needed for Marketplace trading."}
            </p>
          </div>
        </div>
      </section>
      {notice && (
        <div
          role="status"
          className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
          {notice}
        </div>
      )}
      {intent && canTrade(profile.data, rows, intent.level, now) && (
        <Panel title="Continue where you left off">
          <Button
            onClick={() => {
              const path = intent.path;
              setIntent(null);
              router.history.push(path);
            }}
          >
            Resume: {intent.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Panel>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {(["basic", "full"] as const).map((level) => {
          const state = level === "basic" ? basicState : fullState;
          const locked = level === "full" && !basic;
          const reviewing = pending(level);
          return (
            <section key={level} className="flex flex-col rounded-3xl border bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {level === "basic" ? "01 · Start trading" : "02 · Complete your profile"}
                </span>
                <StatusChip
                  status={locked && state.status === "approved" ? "basic_required" : state.status}
                />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold capitalize">
                {level} verification
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {level === "basic"
                  ? "For publishing listings, making offers and responding to buyer requests."
                  : "For checkout and full Marketplace eligibility, using the same individual or business profile."}
              </p>
              <ul className="my-5 space-y-2 text-sm">
                {(level === "basic"
                  ? ["Individual or registered business", "A supporting document for staff review"]
                  : ["Current basic approval", "Supporting identity or business evidence"]
                ).map((label) => (
                  <li key={label} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {label}
                  </li>
                ))}
              </ul>
              {state.record?.reason && (
                <details className="mb-4 rounded-xl bg-muted p-3 text-sm">
                  <summary className="cursor-pointer text-muted-foreground">Review details</summary>
                  <p className="mt-2">{state.record.reason}</p>
                </details>
              )}
              {state.record?.expiresAt && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Valid until {new Date(state.record.expiresAt).toLocaleDateString()}
                </p>
              )}
              <div className="mt-auto">
                {reviewing ? (
                  <div>
                    <p className="mb-3 text-sm font-medium">Pending staff review</p>
                    <Button
                      variant="outline"
                      disabled={verification.isFetching}
                      onClick={() => void verification.refetch()}
                    >
                      Refresh status
                    </Button>
                  </div>
                ) : state.status === "approved" ? (
                  <>
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      Current approval is active
                    </p>
                    <button
                      className="text-xs text-muted-foreground underline underline-offset-4"
                      disabled={busy}
                      onClick={() => start(level)}
                    >
                      Update my {level} information
                    </button>
                  </>
                ) : (
                  <Button className="w-full" disabled={locked || busy} onClick={() => start(level)}>
                    {locked ? (
                      <>
                        <LockKeyhole className="mr-2 h-4 w-4" />
                        Complete basic first
                      </>
                    ) : state.status === "not_started" ? (
                      `Start ${level} verification`
                    ) : (
                      "Review and resubmit"
                    )}
                    {!locked && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {formLevel && (
        <section
          ref={formRef}
          className="scroll-mt-24 overflow-hidden rounded-3xl border bg-card"
          aria-label="Verification application"
        >
          <div className="flex items-center justify-between border-b p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                {currentLevel} application
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                {
                  ["Tell us about yourself", "Add your supporting documents", "Check and submit"][
                    step
                  ]
                }
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close verification application"
              disabled={busy}
              onClick={() => setFormLevel(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ol
            className="grid grid-cols-3 border-b bg-muted/30 px-4 py-4 sm:px-6"
            aria-label="Application steps"
          >
            {["Details", "Documents", "Review"].map((label, index) => (
              <li
                key={label}
                aria-current={step === index ? "step" : undefined}
                className={
                  "flex items-center gap-2 text-xs font-medium sm:text-sm " +
                  (step >= index ? "text-primary" : "text-muted-foreground")
                }
              >
                <span
                  className={
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full " +
                    (step >= index ? "bg-primary text-primary-foreground" : "border bg-card")
                  }
                >
                  {step > index ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
          <div className="p-6 sm:p-8">
            <fieldset disabled={busy} className="space-y-6">
              {step === 0 && (
                <>
                  <div>
                    <p className="mb-3 text-sm font-medium">I’m verifying as</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(["individual", "business"] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={actualType === value}
                          disabled={currentLevel === "full"}
                          onClick={() => setType(value)}
                          className={
                            "flex items-center gap-3 rounded-2xl border p-4 text-left " +
                            (actualType === value ? "border-primary bg-primary/5" : "bg-card")
                          }
                        >
                          {value === "individual" ? (
                            <UserRound className="h-6 w-6 text-primary" />
                          ) : (
                            <Building2 className="h-6 w-6 text-primary" />
                          )}
                          <span>
                            <strong className="block capitalize">{value}</strong>
                            <span className="text-xs text-muted-foreground">
                              {value === "individual"
                                ? "A personal trading account"
                                : "A registered organisation"}
                            </span>
                          </span>
                          {actualType === value && (
                            <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                    {currentLevel === "full" && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Your account type follows your approved basic verification.
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(actualType === "business"
                      ? [
                          ["businessName", "Registered business name"],
                          ["cac", "CAC registration number"],
                          ["contactPerson", "Contact person"],
                          ["registeredAddress", "Registered address"],
                        ]
                      : [
                          ["legalName", "Full legal name"],
                          ["idType", "Government ID type"],
                        ]
                    )
                      .concat(
                        [
                          ["phone", "Phone"],
                          ["city", "City"],
                        ],
                        currentLevel === "full"
                          ? [["pickupAddress", "Pickup / storage address"]]
                          : [],
                      )
                      .map(([key, label]) => (
                        <Field key={key} label={label} htmlFor={"verification-" + key}>
                          <input
                            id={"verification-" + key}
                            className={inputCls}
                            maxLength={2000}
                            value={fields[key] || ""}
                            onChange={(event) =>
                              setFields((old) => ({ ...old, [key]: event.target.value }))
                            }
                          />
                        </Field>
                      ))}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Provide the information that supports your application. Staff review it
                    alongside your documents; no automated identity or CAC check is performed.
                  </p>
                </>
              )}
              {step === 1 && (
                <>
                  <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed bg-muted/20 px-5 py-9 text-center transition-colors hover:border-primary/50">
                    <UploadCloud className="mb-3 h-9 w-9 text-primary" />
                    <span className="font-semibold">Choose supporting documents</span>
                    <span className="mt-1 text-sm text-muted-foreground">
                      JPEG, PNG, WebP or PDF · up to 3 MiB each
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      At least one document is required for either tier.
                    </span>
                    <input
                      aria-label="Supporting documents"
                      className="sr-only"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(event) => {
                        try {
                          const files = Array.from(event.target.files || []);
                          files.forEach(validateDocument);
                          setAttachments((old) => [
                            ...old,
                            ...files.map((file) => ({
                              file,
                              kind: actualType === "business" ? "cac" : "identity",
                            })),
                          ]);
                          setError("");
                        } catch (cause) {
                          setError(errorMessage(cause));
                        }
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <ul className="space-y-3">
                    {attachments.map((item, index) => (
                      <li
                        key={index}
                        className="flex flex-wrap items-center gap-3 rounded-2xl border p-4"
                      >
                        <FileCheck2 className="h-5 w-5 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(item.file.size / 1024).toFixed(0)} KB ·{" "}
                            {item.uploadId ? "Uploaded securely" : "Ready to upload"}
                          </p>
                        </div>
                        <select
                          aria-label={`Document ${index + 1} type`}
                          className={inputCls + " w-auto max-w-full"}
                          value={item.kind}
                          onChange={(event) =>
                            setAttachments((old) =>
                              old.map((entry, i) =>
                                i === index ? { ...entry, kind: event.target.value } : entry,
                              ),
                            )
                          }
                        >
                          {kinds.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${item.file.name}`}
                          onClick={() => setAttachments((old) => old.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                    <LockKeyhole className="h-5 w-5 shrink-0" />
                    <p>
                      Your documents are private. They are used for staff review and are not shown
                      on your listings.
                    </p>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-muted/40 p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Application
                      </p>
                      <p className="mt-2 font-semibold capitalize">
                        {currentLevel} · {actualType}
                      </p>
                      <dl className="mt-3 space-y-2 text-sm">
                        {Object.entries(fields)
                          .filter(([key, value]) => value && key !== "consentAcceptedAt")
                          .map(([key, value]) => (
                            <div key={key}>
                              <dt className="text-xs capitalize text-muted-foreground">
                                {key.replace(/([A-Z])/g, " $1")}
                              </dt>
                              <dd className="break-words">{value}</dd>
                            </div>
                          ))}
                      </dl>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Documents
                      </p>
                      <ul className="mt-3 space-y-3 text-sm">
                        {attachments.map((item, index) => (
                          <li key={index} className="flex gap-2">
                            <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span className="break-all">
                              {item.file.name}
                              <span className="block text-xs text-muted-foreground">
                                {kinds.find(([value]) => value === item.kind)?.[1]}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <label className="flex items-start gap-3 rounded-2xl border p-4 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                    />
                    <span>
                      I consent to processing this information for Marketplace verification as
                      described in the Privacy Policy.
                    </span>
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Submitting sends your application to staff. It does not approve verification
                    automatically.
                  </p>
                </>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              <div className="flex items-center justify-between gap-3 border-t pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError("");
                    if (step === 0) setFormLevel(null);
                    else setStep((old) => old - 1);
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {step === 0 ? "Cancel" : "Back"}
                </Button>
                {step < 2 ? (
                  <Button type="button" onClick={next}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" disabled={busy} onClick={() => void submit()}>
                    {busy ? "Uploading and submitting…" : "Submit for staff review"}
                    <ShieldCheck className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </fieldset>
          </div>
        </section>
      )}
      <details className="rounded-3xl border bg-card p-6">
        <summary className="cursor-pointer font-display text-lg font-semibold">
          Submission history{" "}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {rows.length} application{rows.length === 1 ? "" : "s"}
          </span>
        </summary>
        <div className="mt-5 space-y-5">
          {rows.length ? (
            rows.map((row) => (
              <article key={row.id} className="border-t pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold capitalize">
                    {row.level} · {row.type}
                  </p>
                  <StatusChip
                    status={
                      row.status === "approved" && row.expiresAt && Date.parse(row.expiresAt) <= now
                        ? "expired"
                        : row.status
                    }
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString()} · {row.documents.length} document(s)
                </p>
                {row.reason && <p className="mt-2 text-sm">{row.reason}</p>}
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {row.events.map((event) => (
                    <li key={event.id}>
                      {new Date(event.createdAt).toLocaleString()} ·{" "}
                      {event.status.replaceAll("_", " ")}
                      {event.reason ? " · " + event.reason : ""}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Your applications and review decisions will appear here.
            </p>
          )}
        </div>
      </details>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        AkuBin recycling and rewards do not require Marketplace verification.
      </p>
    </div>
  );
}
