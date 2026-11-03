import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { Logo, DemoTag } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useDB, useHydratedFlag } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ADMIN_TABS, ROLE_LABEL } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "AkuMart Admin" },
      { name: "description", content: "Internal AkuMart administration console." },
      { property: "og:title", content: "AkuMart Admin" },
      { property: "og:description", content: "Internal console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const role = useDB((d) => d.devRole);
  const hydrated = useHydratedFlag();
  const loc = useLocation();
  if (!hydrated) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!role)
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist p-6">
        <div className="max-w-md rounded-3xl border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="text-display mt-4 text-2xl">Restricted area</h1>
          <p className="mt-2 text-sm text-muted-foreground">The admin console requires an internal staff role. For prototype testing, use the development-only role switcher.</p>
          <Button asChild className="mt-6">
            <Link to="/dev/roles">Open dev role switcher</Link>
          </Button>
        </div>
      </div>
    );
  const tabs = ADMIN_TABS.filter((t) => t.roles.includes(role));
  const current = ADMIN_TABS.find((t) => t.to === loc.pathname);
  const allowed = !current || current.roles.includes(role);
  return (
    <div className="min-h-screen bg-mist">
      <header className="bg-forest text-forest-foreground">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo variant="white" />
            <span className="hidden rounded-full bg-lime px-3 py-1 text-xs font-bold text-lime-foreground sm:inline">Admin · {ROLE_LABEL[role]}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <DemoTag>Internal demo</DemoTag>
            <Link to="/dev/roles" className="text-forest-foreground/70 hover:text-forest-foreground">
              Switch role
            </Link>
          </div>
        </div>
        <nav className="container-page flex gap-1 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <Link key={t.to} to={t.to as "/admin"} className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm", loc.pathname === t.to ? "bg-forest-foreground text-forest" : "text-forest-foreground/75 hover:bg-forest-soft")}>
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-page py-8">
        {allowed ? (
          <Outlet />
        ) : (
          <div className="rounded-3xl border bg-card p-10 text-center">
            <p className="font-display text-xl font-semibold">Your role ({ROLE_LABEL[role]}) can’t access this section.</p>
          </div>
        )}
      </main>
    </div>
  );
}
