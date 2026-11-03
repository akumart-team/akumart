import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ variant = "primary", className }: { variant?: "primary" | "white"; className?: string }) {
  return (
    <Link to="/" aria-label="AkuMart home" className={cn("inline-flex shrink-0 items-center", className)}>
      <img
        src={variant === "white" ? "/brand/logo-white.svg" : "/brand/logo.svg"}
        alt="AkuMart"
        width={590}
        height={190}
        className="h-9 w-auto md:h-10"
      />
    </Link>
  );
}

export function Tagline({ className }: { className?: string }) {
  return <p className={cn("font-display text-sm font-medium tracking-tight", className)}>Waste Today. Resource Tomorrow.</p>;
}

export function DemoTag({ children = "Demo", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-dashed border-warning bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning-foreground", className)}>
      {children}
    </span>
  );
}
