import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  good: "bg-primary/12 text-primary border-primary/25",
  warn: "bg-warning/20 text-warning-foreground border-warning/40",
  bad: "bg-destructive/10 text-destructive border-destructive/25",
  info: "bg-info/10 text-info border-info/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

const map: Record<string, keyof typeof tone> = {
  approved: "good", verified: "good", online: "good", published: "good", completed: "good", settled: "good", confirmed: "good", accepted: "good", resolved: "good", paid: "good", released: "good", selected: "good", delivered: "good",
  pending_review: "warn", checking: "info", collecting: "info", pending: "warn", awaiting_seller: "warn", awaiting_buyer: "warn", awaiting_quotes: "info", awaiting_payment: "warn", held: "info", maintenance: "warn", full: "warn", open: "warn", assigned: "info", in_transit: "info", picked_up: "info", proof_uploaded: "info", under_review: "warn", draft: "neutral", proposed: "info", submitted: "info", choose_fulfilment: "info",
  rejected: "bad", needs_resubmission: "bad", offline: "bad", failed: "bad", disputed: "bad", cancelled: "bad", expired: "neutral", flagged: "bad", suspended: "bad", no_quotes: "bad", refunded: "neutral", declined: "neutral", unpaid: "neutral", not_started: "neutral", unpublished: "neutral", sold: "neutral", paused: "neutral",
};

export const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function StatusChip({ status, className, children }: { status: string; className?: string; children?: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", tone[map[status] ?? "neutral"], className)}>
      {children ?? label(status)}
    </span>
  );
}
