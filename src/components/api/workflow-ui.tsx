import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Search, X, PackageSearch, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/field";

export function WorkflowHeader({
  title,
  eyebrow,
  intro,
  actions,
  icon: Icon,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  actions?: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-forest p-6 text-forest-foreground sm:p-8">
      <Icon
        aria-hidden
        className="pointer-events-none absolute -right-5 -top-6 h-48 w-48 opacity-[0.06]"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">
            {eyebrow}
          </p>
          <h1 className="text-display break-words text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-forest-foreground/75 sm:text-base">
            {intro}
          </p>
        </div>
        {actions && <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">{actions}</div>}
      </div>
    </header>
  );
}
export function WorkflowSearch({
  value,
  onSearch,
  placeholder,
  label,
}: {
  value: string;
  onSearch: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <form
      role="search"
      aria-label={label}
      className="flex w-full gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
        />
        <input
          type="search"
          aria-label={label}
          className={inputCls + " pl-10"}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          maxLength={100}
        />
      </div>
      <Button variant="outline" className="h-11 bg-card" type="submit">
        Search
      </Button>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Clear search"
          onClick={() => {
            setDraft("");
            onSearch("");
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
export function WorkflowPagination({
  page,
  total,
  size = 12,
  busy,
  onChange,
}: {
  page: number;
  total: number;
  size?: number;
  busy: boolean;
  onChange: (page: number) => void;
}) {
  if (!total) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Showing {(page - 1) * size + 1}–{Math.min(page * size, total)} of {total}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy || page * size >= total}
          onClick={() => onChange(page + 1)}
        >
          Next
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
export function WorkflowEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed bg-card px-5 py-14 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
        <PackageSearch className="h-7 w-7" />
      </div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
export function WorkflowGuide({
  title,
  steps,
  children,
}: {
  title: string;
  steps: string[];
  children?: ReactNode;
}) {
  return (
    <aside className="self-start rounded-3xl border bg-card p-6 xl:sticky xl:top-24">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary">
        A little guidance
      </p>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <ol className="mt-6 space-y-5">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/8 text-xs font-bold text-primary">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {children && (
        <div className="mt-6 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
          {children}
        </div>
      )}
    </aside>
  );
}
export function WorkflowMetric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold">{children}</dd>
    </div>
  );
}
