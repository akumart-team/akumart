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

// Official URLs not yet supplied, so icons are intentionally non-navigable.
const SOCIALS = [
  { label: "Facebook", d: "M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3Z" },
  { label: "LinkedIn", d: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75ZM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5c0-1.2 0-2.75-1.67-2.75-1.68 0-1.94 1.3-1.94 2.65V21H9.5V9.75Z" },
  { label: "Instagram", d: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 2c-2.7 0-3.1 0-4.1.1C4.3 2.3 2.3 4.3 2.1 7.9 2 8.9 2 9.3 2 12s0 3.1.1 4.1c.2 3.6 2.2 5.6 5.8 5.8 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c3.6-.2 5.6-2.2 5.8-5.8.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.2-3.6-2.2-5.6-5.8-5.8C15.1 2 14.7 2 12 2Zm0 1.8c2.7 0 3 0 4 .1 2.6.1 3.9 1.4 4 4 .1 1 .1 1.3.1 4s0 3-.1 4c-.1 2.6-1.4 3.9-4 4-1 .1-1.3.1-4 .1s-3 0-4-.1c-2.6-.1-3.9-1.4-4-4-.1-1-.1-1.3-.1-4s0-3 .1-4c.1-2.6 1.4-3.9 4-4 1-.1 1.3-.1 4-.1Z" },
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
          <div className="flex gap-3 pt-2">
            {SOCIALS.map((x) => (
              <span key={x.label} role="img" aria-label={x.label} title={x.label} className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-foreground/10 text-forest-foreground/80">
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden><path d={x.d} /></svg>
              </span>
            ))}
          </div>
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
          <span>Payments are handled by a licensed payment provider. AkuMart does not hold customer funds.</span>
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
