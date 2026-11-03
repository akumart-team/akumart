import { cn } from "@/lib/utils";

export function PageTitle({ eyebrow, title, intro, actions }: { eyebrow?: string; title: string; intro?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2 text-primary">{eyebrow}</p>}
        <h1 className="text-display text-3xl md:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-muted-foreground">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className, title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-3xl border bg-card p-5 md:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, dark }: { label: string; value: React.ReactNode; hint?: string; dark?: boolean }) {
  return (
    <div className={cn("rounded-3xl p-5", dark ? "bg-forest text-forest-foreground" : "border bg-card")}>
      <p className={cn("text-sm", dark ? "text-forest-foreground/65" : "text-muted-foreground")}>{label}</p>
      <p className={cn("text-display mt-2 text-3xl", dark && "text-lime")}>{value}</p>
      {hint && <p className={cn("mt-1 text-xs", dark ? "text-forest-foreground/55" : "text-muted-foreground")}>{hint}</p>}
    </div>
  );
}

export function Empty({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed bg-card p-10 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>}
      {children && <div className="mt-5 flex justify-center gap-2">{children}</div>}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export const td = "px-4 py-3 align-middle";
