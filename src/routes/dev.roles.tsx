import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDB, resetDemo } from "@/lib/store";
import { setDevRole } from "@/lib/actions";
import { ROLE_LABEL } from "@/lib/admin";
import type { AdminRole } from "@/lib/types";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dev/roles")({
  head: () => ({
    meta: [
      { title: "Dev role switcher — AkuMart (internal)" },
      { name: "description", content: "Development-only internal role switcher for prototype testing." },
      { property: "og:title", content: "Dev role switcher" },
      { property: "og:description", content: "Internal testing tool." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DevRoles,
});

const DESC: Record<AdminRole, string> = {
  super: "All modules, roles, commission & reward configuration, audit trail.",
  operations: "Logistics partners, listing flags, bins, maintenance and collections.",
  support: "Tickets, priorities, evidence, disputes and escalations; verification exceptions.",
  finance: "Simulated provider settlements, fees, refunds, holds and redemption review.",
  content: "Articles, news approvals and ad creative review.",
};

function DevRoles() {
  const role = useDB((d) => d.devRole);
  const users = useDB((d) => d.users.filter((u) => !u.demo).length);
  const router = useRouter();
  return (
    <div className="min-h-screen bg-mist">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <Logo />
        <div className="mt-8 flex gap-3 rounded-2xl border border-warning bg-warning/15 p-4 text-sm text-warning-foreground">
          <AlertTriangle className="size-5 shrink-0" />
          <p>
            <strong>Development-only tool.</strong> This internal page simulates staff roles for prototype testing. It is not linked from public navigation and would not exist in production.
          </p>
        </div>
        <h1 className="text-display mt-8 text-4xl">Choose a staff role</h1>
        <div className="mt-6 grid gap-3">
          {(Object.keys(ROLE_LABEL) as AdminRole[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setDevRole(r);
                router.navigate({ to: "/admin" });
              }}
              className={cn("rounded-2xl border bg-card p-5 text-left hover:border-primary", role === r && "border-primary")}
            >
              <p className="font-display text-lg font-semibold">{ROLE_LABEL[r]}</p>
              <p className="text-sm text-muted-foreground">{DESC[r]}</p>
            </button>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {role && (
            <Button variant="outline" onClick={() => setDevRole(null)}>
              Clear staff role
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Reset all demo data in this browser?")) resetDemo();
            }}
          >
            Reset all demo data ({users} real test account{users === 1 ? "" : "s"})
          </Button>
          <Button asChild variant="link">
            <Link to="/">Back to site</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
