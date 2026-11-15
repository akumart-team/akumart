import { createFileRoute, Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { Loader2, LogOut, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useApiSession, useLogout, useProfile } from "@/lib/api/hooks/use-api";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/client";
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
  const session = useApiSession();
  const profile = useProfile();
  const logout = useLogout();
  const router = useRouter();
  const role = profile.data?.staff?.active ? profile.data.staff.role : null;
  const loc = useLocation();
  if (session.isPending || (session.data && profile.isPending))
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  if (session.isError || profile.isError)
    return (
      <p role="alert" className="p-8">
        {errorMessage(session.error || profile.error)}
      </p>
    );
  if (!role)
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist p-6">
        <div className="max-w-md rounded-3xl border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="text-display mt-4 text-2xl">Restricted area</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The admin console requires an active staff role assigned by an authorized administrator.
          </p>
          <Button asChild className="mt-6">
            <Link to="/login" search={{ redirect: "/admin/verification" }}>
              Sign in
            </Link>
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
        <div className="container-page flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-4">
            <Logo variant="white" />
            <span className="hidden rounded-full bg-lime px-3 py-1 text-xs font-bold text-lime-foreground sm:inline">
              Admin · {ROLE_LABEL[role]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/app/dashboard">
              <span className="sm:hidden">My account</span>
              <span className="hidden sm:inline">Switch to my account</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-forest-foreground hover:bg-forest-soft hover:text-forest-foreground"
              disabled={logout.isPending}
              onClick={() =>
                logout.mutate(undefined, {
                  onSuccess: () => router.navigate({ to: "/login" }),
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            >
              <LogOut className="mr-1.5 size-4" />
              {logout.isPending ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
        <nav className="sidebar-scroll container-page flex gap-1 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to as "/admin"}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm",
                loc.pathname === t.to
                  ? "bg-forest-foreground text-forest"
                  : "text-forest-foreground/75 hover:bg-forest-soft",
              )}
            >
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
            <p className="font-display text-xl font-semibold">
              Your role ({ROLE_LABEL[role]}) can’t access this section.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
