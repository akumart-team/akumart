import { createFileRoute, Link } from "@tanstack/react-router";
import { PageTitle, Empty } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { useDB, update } from "@/lib/store";
import { dt } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/notifications")({
  component: Notifications,
});

function Notifications() {
  const items = useDB((d) => d.notifications.filter((n) => n.userId === d.sessionUserId));
  return (
    <div className="max-w-3xl">
      <PageTitle
        title="Notifications"
        intro="In-app notifications. Sensitive identity details are never included."
        actions={
          <Button variant="outline" size="sm" onClick={() => update((d) => d.notifications.forEach((n) => n.userId === d.sessionUserId && (n.read = true)))}>
            Mark all read
          </Button>
        }
      />
      {items.length === 0 ? (
        <Empty title="You’re all caught up" />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className={cn("rounded-2xl border bg-card p-4", !n.read && "border-primary/40 bg-secondary")}>
              <div className="flex justify-between gap-4">
                <p className="font-semibold">{n.title}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{dt(n.at)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{n.body}</p>
              {n.href && (
                <Link
                  to={n.href as "/app"}
                  onClick={() => update((d) => (d.notifications.find((x) => x.id === n.id)!.read = true))}
                  className="mt-2 inline-block text-sm font-semibold text-primary"
                >
                  View →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
