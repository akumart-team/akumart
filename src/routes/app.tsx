import { safeTarget } from "@/lib/after-auth";
import { createFileRoute, Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles, Package, HandCoins, Receipt, Megaphone, ClipboardList, Bookmark, LayoutDashboard, Gift, Trophy, MapPin, ShieldCheck, Bell, Truck, LifeBuoy, Settings, LogOut, Menu, X, Loader2, Store, Recycle,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { useMe, useHydratedFlag, useDB, signOut, updateMe } from "@/lib/store";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/status-chip";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "My AkuMart" },
      { name: "description", content: "Your AkuMart Marketplace and AkuBin dashboard." },
      { property: "og:title", content: "My AkuMart" },
      { property: "og:description", content: "Manage trading and recycling in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

const BUYER_NAV = [
  { to: "/app/marketplace", label: "For You", icon: Sparkles },
  { to: "/app/offers", label: "My offers", icon: HandCoins },
  { to: "/app/orders", label: "Purchases", icon: Receipt },
  { to: "/app/requests", label: "My buyer requests", icon: ClipboardList },
  { to: "/app/saved", label: "Saved", icon: Bookmark },
] as const;
const SELLER_NAV = [
  { to: "/app/listings", label: "My listings", icon: Package },
  { to: "/app/offers", label: "Offers received", icon: HandCoins },
  { to: "/app/orders", label: "Sales", icon: Receipt },
  { to: "/app/requests", label: "Buyer requests", icon: ClipboardList },
] as const;
const AKUBIN = [
  { to: "/app/akubin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/akubin/rewards", label: "Rewards", icon: Gift },
  { to: "/app/akubin/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/akubin", label: "Find a bin", icon: MapPin },
] as const;
const ACCOUNT = [
  { to: "/app/verification", label: "Verification", icon: ShieldCheck },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/partner", label: "Logistics partner", icon: Truck },
  { to: "/app/advertise", label: "Advertise", icon: Megaphone },
  { to: "/app/support", label: "Support", icon: LifeBuoy },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const me = useMe();
  const hydrated = useHydratedFlag();
  const router = useRouter();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const unread = useDB((d) => d.notifications.filter((n) => n.userId === d.sessionUserId && !n.read).length);
  useEffect(() => {
    if (hydrated && !me) router.navigate({ to: "/login", search: { redirect: safeTarget(loc.href) } });
  }, [hydrated, me, router, loc.href]);
  useEffect(() => setOpen(false), [loc.pathname]);

  if (!hydrated || !me)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );

  const service = loc.pathname.startsWith("/app/akubin") ? "akubin" : "marketplace";
  const v = me.verification;
  const role = me.prefs.marketRole;
  const mode: "buyer" | "seller" = role === "seller" ? "seller" : role === "both" ? (me.prefs.activeMode ?? "buyer") : "buyer";
  const MARKET = mode === "seller" ? SELLER_NAV : BUYER_NAV;

  const nav = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <div className="flex items-center justify-between">
        <Logo variant="white" />
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-sidebar-accent p-1" role="tablist" aria-label="Service switcher">
        <Link to="/app/marketplace" role="tab" aria-selected={service === "marketplace"} className={cn("flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold", service === "marketplace" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70")}>
          <Store className="size-3.5" /> Marketplace
        </Link>
        <Link to="/app/akubin" role="tab" aria-selected={service === "akubin"} className={cn("flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold", service === "akubin" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70")}>
          <Recycle className="size-3.5" /> AkuBin
        </Link>
      </div>
      {service === "marketplace" && role === "both" && (
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-sidebar-border p-1" role="tablist" aria-label="Buyer or seller mode">
          {(["buyer", "seller"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => { updateMe((u) => { u.prefs.activeMode = m; }); router.navigate({ to: m === "seller" ? "/app/listings" : "/app/marketplace" }); }} className={cn("rounded-lg py-1.5 text-xs font-semibold capitalize", mode === m ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70")}>
              {m}
            </button>
          ))}
        </div>
      )}
      {service === "marketplace" && (role === "none" || !role) && (
        <Link to="/app/settings" className="rounded-xl bg-sidebar-accent p-3 text-xs text-sidebar-foreground/80">Choose Buy, Sell or Buy &amp; Sell in Settings to unlock trading tools.</Link>
      )}
      <NavGroup title={service === "akubin" ? "AkuBin" : mode === "seller" ? "Selling" : "Buying"} items={service === "akubin" ? AKUBIN : MARKET} path={loc.pathname} />
      <NavGroup title="Account" items={ACCOUNT} path={loc.pathname} badge={{ "/app/notifications": unread }} />
      <div className="mt-auto space-y-3 rounded-2xl bg-sidebar-accent p-4 text-sm">
        <p className="font-semibold text-sidebar-accent-foreground">{me.name}</p>
        <p className="truncate text-xs text-sidebar-foreground/60">{me.email}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-sidebar-foreground/60">Marketplace</span>
          <StatusChip status={v.basic === "approved" && v.full === "approved" ? "approved" : v.basic}>
            {v.basic === "approved" ? (v.full === "approved" ? `Verified ${v.type}` : "Basic verified") : v.basic.replace(/_/g, " ")}
          </StatusChip>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-sidebar-foreground/60">AkuBin points</span>
          <span className="font-semibold text-lime">{me.points.toLocaleString()}</span>
        </div>
        <button
          onClick={() => {
            signOut();
            router.navigate({ to: "/" });
          }}
          className="flex items-center gap-2 pt-1 text-xs text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-sidebar text-sidebar-foreground lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[290px] bg-sidebar text-sidebar-foreground">{nav}</aside>
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
          <Link to="/app/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted" aria-label={`Notifications (${unread} unread)`}>
            <Bell className="size-5" />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unread}</span>}
          </Link>
        </header>
        <main className="px-4 py-8 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavGroup({ title, items, path, badge = {} }: { title: string; items: readonly { to: string; label: string; icon: typeof Bell }[]; path: string; badge?: Record<string, number> }) {
  return (
    <div>
      <p className="eyebrow mb-2 px-3 text-sidebar-foreground/45">{title}</p>
      <ul className="space-y-0.5">
        {items.map((i) => {
          const active = path === i.to || (i.to !== "/app/akubin" && path.startsWith(i.to + "/"));
          return (
            <li key={i.to}>
              <Link to={i.to as "/app"} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", active ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60")}>
                <i.icon className={cn("size-4", active && "text-lime")} />
                <span className="flex-1">{i.label}</span>
                {!!badge[i.to] && <span className="rounded-full bg-lime px-1.5 text-[10px] font-bold text-lime-foreground">{badge[i.to]}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
