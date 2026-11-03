import { cloneElement, isValidElement, useId } from "react";
import { cn } from "@/lib/utils";

/** Labelled form field. Auto-links the label to a single input/select/textarea child for accessibility. */
export function Field({ label, error, hint, children, className, htmlFor }: { label: string; error?: string; hint?: string; children: React.ReactNode; className?: string; htmlFor?: string }) {
  const auto = useId();
  let id = htmlFor;
  let content = children;
  if (!id && isValidElement(children) && typeof children.type === "string" && ["input", "select", "textarea"].includes(children.type)) {
    const props = children.props as { id?: string };
    id = props.id ?? auto;
    content = cloneElement(children as React.ReactElement<{ id?: string; "aria-invalid"?: boolean }>, { id, "aria-invalid": !!error || undefined });
  } else if (!id && isValidElement(children) && (children.type as { displayName?: string }).displayName === "Textarea") {
    id = auto;
    content = cloneElement(children as React.ReactElement<{ id?: string }>, { id });
  }
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {content}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputCls =
  "flex h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15";

export function NativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, "appearance-none bg-[length:1rem] pr-8", props.className)} />;
}

export function Chips<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            type="button"
            key={o.id}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o.id) : [...value, o.id])}
            className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
