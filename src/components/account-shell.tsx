import { safeTarget } from "@/lib/after-auth";
import {
  isAccountRole,
  tradingMode,
  signInHome,
  hasLogisticsWorkspace,
} from "@/lib/api/account-roles";
import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Package,
  HandCoins,
  Receipt,
  Megaphone,
  ClipboardList,
  Bookmark,
  LayoutDashboard,
  Gift,
  Trophy,
  MapPin,
  ShieldCheck,
  Bell,
  Truck,
  LifeBuoy,
  Settings,
  LogOut,
  Menu,
  X,
  Loader2,
  Store,
  Recycle,
  Plus,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { useResource } from "@/components/api/data-view";
import {
  useApiSession,
  useProfile,
  useLogout,
  useVerification,
  apiKeys,
} from "@/lib/api/hooks/use-api";
import { errorMessage } from "@/lib/api/client";
import { approvedBasic, levelState } from "@/lib/api/verification-policy";
import { updatePreferences } from "@/lib/api/services/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/status-chip";

const BUYER_NAV = [
  { to: "/app/marketplace", label: "For You", icon: Sparkles },
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/offers", label: "My offers", icon: HandCoins },
  { to: "/app/orders", label: "Purchases", icon: Receipt },
  { to: "/app/requests", label: "My buyer requests", icon: ClipboardList },
  { to: "/app/saved", label: "Saved", icon: Bookmark },
] as const;
const SELLER_NAV = [
  { to: "/app/marketplace", label: "For You", icon: Sparkles },
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/listings", label: "My listings", icon: Package },
  { to: "/app/listings/new", label: "Create listing", icon: Plus },
  { to: "/app/offers", label: "Incoming offers & negotiations", icon: HandCoins },
  { to: "/app/orders", label: "Sales & orders", icon: Receipt },
  { to: "/app/requests", label: "Buyer requests", icon: ClipboardList },
] as const;
const AKUBIN = [
  { to: "/app/akubin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/akubin/rewards", label: "Rewards", icon: Gift },
  { to: "/app/akubin/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/app/akubin/map", label: "Find a bin", icon: MapPin },
] as const;
const ACCOUNT = [
  { to: "/app/verification", label: "Verification", icon: ShieldCheck },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/partner", label: "Logistics partner", icon: Truck },
  { to: "/app/advertise", label: "Advertise", icon: Megaphone },
  { to: "/app/support", label: "Support", icon: LifeBuoy },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function AccountShell({ children }: { children?: React.ReactNode }) {
  const session = useApiSession();
  const profile = useProfile();
  const verification = useVerification();
  const logout = useLogout();
  const qc = useQueryClient();
  const preferences = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeys.profile }),
    onError: (error) => toast.error(errorMessage(error)),
  });
  const me = profile.data;
  const router = useRouter();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const notificationQuery = useResource("/users/me/notifications?limit=1");
  const unread = notificationQuery.data?.unreadCount || 0;
  useEffect(() => {
    if (session.isSuccess && !session.data)
      router.navigate({ to: "/login", search: { redirect: safeTarget(loc.href) } });
  }, [session.isSuccess, session.data, router, loc.href]);
  useEffect(() => setOpen(false), [loc.pathname]);

  if (session.isError || profile.isError)
    return (
      <div className="p-8" role="alert">
        <p>{errorMessage(session.error || profile.error)}</p>
        <button
          onClick={() => {
            void session.refetch();
            void profile.refetch();
          }}
        >
          Try again
        </button>
        <Link to="/login" search={{ redirect: safeTarget(loc.href) }}>
          Sign in
        </Link>
      </div>
    );
  if (!me)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );

  if (loc.pathname === "/app" || loc.pathname === "/app/")
    return <div className="min-h-screen bg-mist">{children ?? <Outlet />}</div>;
  const service = loc.pathname.startsWith("/app/akubin")
    ? "akubin"
    : loc.pathname.startsWith("/app/partner")
      ? "logistics"
      : "marketplace";
  const records = verification.data || [];
  const basic = approvedBasic(records);
  const v = {
    basic: levelState(records, "basic").status,
    full: levelState(records, "full", basic?.type).status,
    type: basic?.type,
  };
  const role = me.preferences?.marketRole || "none";
  const mode = tradingMode(me.preferences) || "buyer";
  const switchMode = (m: "buyer" | "seller") => {
    preferences.mutate(
      { activeMode: m },
      { onSuccess: () => router.navigate({ to: "/app/dashboard" }) },
    );
  };
  const tradingRole = ["buyer", "seller", "both"].includes(role);
  const showAkuBin = me.preferences?.akubin === true || service === "akubin";
  const showLogistics = hasLogisticsWorkspace(me);
  const serviceCount = 1 + Number(showAkuBin) + Number(showLogistics);
  const MARKET = !tradingRole
    ? BUYER_NAV.filter((item) => item.to === "/app/marketplace" || item.to === "/marketplace")
    : mode === "seller"
      ? SELLER_NAV
      : BUYER_NAV;

  const nav = (
    <div
      role="navigation"
      aria-label="Account navigation"
      tabIndex={0}
      className="sidebar-scroll flex h-full flex-col gap-6 overflow-y-auto overscroll-contain p-5"
    >
      <div className="flex items-center justify-between">
        <Logo variant="white" />
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <div
        className={cn(
          "grid gap-1 rounded-full bg-sidebar-accent p-1",
          serviceCount === 3 ? "grid-cols-3" : serviceCount === 2 ? "grid-cols-2" : "grid-cols-1",
        )}
        role="tablist"
        aria-label="Service switcher"
      >
        <Link
          to="/app/marketplace"
          role="tab"
          aria-selected={service === "marketplace"}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold",
            service === "marketplace"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/70",
          )}
        >
          <Store className="size-3.5" /> Market
        </Link>
        {showAkuBin && (
          <Link
            to="/app/akubin"
            role="tab"
            aria-selected={service === "akubin"}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold",
              service === "akubin"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70",
            )}
          >
            <Recycle className="size-3.5" /> AkuBin
          </Link>
        )}
        {showLogistics && (
          <Link
            to="/app/partner"
            role="tab"
            aria-selected={service === "logistics"}
            className={cn(
              "flex items-center justify-center gap-1 rounded-full py-2 text-xs font-semibold",
              service === "logistics"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70",
            )}
          >
            <Truck className="size-3.5" /> Logistics
          </Link>
        )}
      </div>
      {service === "marketplace" && role === "both" && (
        <div
          className="grid grid-cols-2 gap-1 rounded-xl border border-sidebar-border p-1"
          role="tablist"
          aria-label="Buyer or seller mode"
        >
          {(["buyer", "seller"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={cn(
                "rounded-lg py-1.5 text-xs font-semibold capitalize",
                mode === m
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      )}
      {service === "marketplace" && !tradingRole && (
        <Link
          to="/app/settings"
          className="rounded-xl bg-sidebar-accent p-3 text-xs text-sidebar-foreground/80"
        >
          {isAccountRole(role)
            ? "Want to buy or sell? Update your account role in Settings."
            : "Complete account setup and choose your role."}
        </Link>
      )}
      <NavGroup
        title={
          service === "akubin"
            ? "AkuBin"
            : service === "logistics"
              ? "Logistics workspace"
              : !tradingRole
                ? "Browse materials"
                : mode === "seller"
                  ? "Selling"
                  : "Buying"
        }
        items={
          service === "akubin"
            ? AKUBIN
            : service === "logistics"
              ? showLogistics
                ? [
                    {
                      to: "/app/partner",
                      label:
                        me.partner?.status === "approved"
                          ? "Jobs, quotes & deliveries"
                          : "Logistics application",
                      icon: Truck,
                    },
                  ]
                : [{ to: "/app/settings", label: "Account settings", icon: Settings }]
              : MARKET
        }
        path={loc.pathname}
      />
      <NavGroup
        title="Account"
        items={ACCOUNT.filter((item) => item.to !== "/app/partner" || showLogistics)}
        path={loc.pathname}
        badge={{ "/app/notifications": unread }}
      />
      {me.staff?.active && (
        <Link
          to={signInHome(me)}
          className="flex items-center gap-2 rounded-xl border border-sidebar-border px-3 py-2.5 text-sm font-semibold text-sidebar-foreground"
        >
          <ShieldCheck className="h-4 w-4 text-lime" />
          Staff console
        </Link>
      )}
      <div className="mt-auto space-y-3 rounded-2xl bg-sidebar-accent p-4 text-sm">
        <p className="font-semibold text-sidebar-accent-foreground">
          {me.displayName || `${me.firstName} ${me.lastName}`}
        </p>
        <p className="truncate text-xs text-sidebar-foreground/60">{me.email}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-sidebar-foreground/60">Marketplace</span>
          <StatusChip
            status={v.basic === "approved" && v.full === "approved" ? "approved" : v.basic}
          >
            {v.basic === "approved"
              ? v.full === "approved"
                ? `Verified ${v.type}`
                : "Basic verified"
              : v.basic.replace(/_/g, " ")}
          </StatusChip>
        </div>
        <button
          onClick={() => {
            logout.mutate(undefined, {
              onSuccess: () => router.navigate({ to: "/" }),
              onError: (error) => toast.error(errorMessage(error)),
            });
          }}
          disabled={logout.isPending}
          className="flex items-center gap-2 pt-1 text-xs text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-sidebar text-sidebar-foreground lg:block">
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[290px] bg-sidebar text-sidebar-foreground">
            {nav}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <Link to="/" className="hidden text-sm text-muted-foreground hover:text-primary lg:block">
            ← Back to website
          </Link>
          <Link
            to="/app/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
            aria-label={`Notifications (${unread} unread)`}
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </Link>
        </header>
        <main className="px-4 py-8 md:px-8 md:py-10">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}

function NavGroup({
  title,
  items,
  path,
  badge = {},
}: {
  title: string;
  items: readonly { to: string; label: string; icon: typeof Bell }[];
  path: string;
  badge?: Record<string, number>;
}) {
  return (
    <div>
      <p className="eyebrow mb-2 px-3 text-sidebar-foreground/45">{title}</p>
      <ul className="space-y-0.5">
        {items.map((i) => {
          const active =
            path === i.to ||
            (i.to !== "/app/akubin" && i.to !== "/app/listings" && path.startsWith(i.to + "/"));
          return (
            <li key={i.to}>
              <Link
                to={i.to as "/app"}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/60",
                )}
              >
                <i.icon className={cn("size-4", active && "text-lime")} />
                <span className="flex-1">{i.label}</span>
                {!!badge[i.to] && (
                  <span className="rounded-full bg-lime px-1.5 text-[10px] font-bold text-lime-foreground">
                    {badge[i.to]}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
