import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Logo, Tagline } from "./brand";
import { Button } from "./ui/button";
import { useMe, useHydratedFlag } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/akubin", label: "AkuBin" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const me = useMe();
  const hydrated = useHydratedFlag();
  const authed = hydrated && me;
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-6 md:h-[72px]">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink/75 transition-colors hover:bg-secondary hover:text-forest data-[status=active]:bg-secondary data-[status=active]:text-forest"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {authed ? (
            <Button asChild variant="forest">
              <Link to="/app">
                <LayoutDashboard /> My dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <div className={cn("border-t bg-background lg:hidden", open ? "block" : "hidden")}>
        <nav aria-label="Mobile" className="container-page flex flex-col py-3">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-medium hover:bg-secondary">
              {n.label}
            </Link>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {authed ? (
              <Button asChild variant="forest" className="col-span-2">
                <Link to="/app">My dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

const FOOT: { title: string; links: { label: string; to: string; search?: Record<string, string> }[] }[] = [
  { title: "Explore", links: [{ label: "Home", to: "/" }, { label: "Marketplace", to: "/marketplace" }, { label: "AkuBin", to: "/akubin" }, { label: "How It Works", to: "/how-it-works" }, { label: "Articles", to: "/articles" }] },
  { title: "Company", links: [{ label: "About Us", to: "/about" }, { label: "Contact Us", to: "/contact" }, { label: "Become a Logistics Partner", to: "/contact", search: { interest: "logistics" } }, { label: "Advertise With Us", to: "/advertise" }] },
  { title: "Support", links: [{ label: "Help Centre", to: "/help" }, { label: "FAQs", to: "/faq" }, { label: "Contact Support", to: "/contact", search: { interest: "support" } }, { label: "Report an Issue", to: "/help", search: { report: "1" } }] },
  { title: "Legal", links: [{ label: "Terms & Conditions", to: "/legal/terms" }, { label: "Privacy Policy", to: "/legal/privacy" }, { label: "Cookie Policy", to: "/legal/cookies" }, { label: "Acceptable Use Policy", to: "/legal/acceptable-use" }] },
];

export function SiteFooter() {
  return (
    <footer className="bg-forest text-forest-foreground">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm space-y-4">
          <Logo variant="white" />
          <Tagline className="text-lime" />
          <p className="text-sm leading-relaxed text-forest-foreground/70">
            A Nigerian marketplace for recyclable materials and AkuBin, the smart-bin rewards service, one account for both.
          </p>
          <p className="text-xs text-forest-foreground/50">Official social channels will be listed here once confirmed.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOT.map((c) => (
            <div key={c.title}>
              <h3 className="eyebrow mb-4 text-lime">{c.title}</h3>
              <ul className="space-y-2.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to as "/"} search={l.search as never} className="text-forest-foreground/75 transition-colors hover:text-forest-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-forest-foreground/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-forest-foreground/55 sm:flex-row sm:justify-between">
          <span>© 2026 AkuMart. All rights reserved.</span>
          <span>Prototype, all data, payments, verification and bin events are simulated.</span>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({ eyebrow, title, intro, children, dark }: { eyebrow?: string; title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode; dark?: boolean }) {
  return (
    <section className={cn(dark ? "bg-forest-gradient text-forest-foreground" : "bg-mist")}>
      <div className="container-page py-16 md:py-24">
        {eyebrow && <p className={cn("eyebrow mb-4", dark ? "text-lime" : "text-primary")}>{eyebrow}</p>}
        <h1 className="text-display max-w-3xl text-4xl md:text-6xl">{title}</h1>
        {intro && <p className={cn("mt-5 max-w-2xl text-lg leading-relaxed", dark ? "text-forest-foreground/75" : "text-muted-foreground")}>{intro}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
