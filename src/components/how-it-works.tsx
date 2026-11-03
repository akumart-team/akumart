import { useState } from "react";
import { UserPlus, Search, Handshake, Truck, CheckCircle2, MapPin, QrCode, Recycle, Coins, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const FLOWS = {
  marketplace: [
    { icon: UserPlus, t: "Join", d: "Create one free account with basic details." },
    { icon: Search, t: "Discover or list", d: "Browse graded materials or publish your own listing." },
    { icon: Handshake, t: "Agree on trade", d: "Structured offers and counteroffers — verified traders only." },
    { icon: Truck, t: "Arrange fulfilment", d: "Pick up yourself or compare quotes from approved partners." },
    { icon: CheckCircle2, t: "Complete", d: "Provider-handled payment, confirmation, then settlement." },
  ],
  akubin: [
    { icon: MapPin, t: "Find a bin", d: "Search by area or landmark, or use your location." },
    { icon: QrCode, t: "Scan & identify", d: "Scan the bin’s QR, or use your phone and PIN." },
    { icon: Recycle, t: "Deposit", d: "The bin checks your material and its weight or count." },
    { icon: Coins, t: "Earn", d: "Points are credited only for verified deposits." },
    { icon: Gift, t: "Redeem", d: "Airtime, cash above a minimum, or reward items." },
  ],
};

export function HowItWorks({ initial = "marketplace" }: { initial?: keyof typeof FLOWS }) {
  const [tab, setTab] = useState<keyof typeof FLOWS>(initial);
  const [step, setStep] = useState(0);
  const steps = FLOWS[tab];
  return (
    <div>
      <div role="tablist" aria-label="Service" className="inline-flex rounded-full border bg-background p-1">
        {(["marketplace", "akubin"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => {
              setTab(k);
              setStep(0);
            }}
            className={cn("rounded-full px-5 py-2 text-sm font-semibold transition-colors", tab === k ? (k === "akubin" ? "bg-forest text-lime" : "bg-primary text-primary-foreground") : "text-muted-foreground hover:text-foreground")}
          >
            {k === "marketplace" ? "Marketplace" : "AkuBin"}
          </button>
        ))}
      </div>
      <ol className="relative mt-10 grid gap-6 md:grid-cols-5 md:gap-4">
        <div aria-hidden className="absolute left-0 right-0 top-7 hidden h-0.5 bg-border md:block" />
        <div aria-hidden className={cn("absolute left-0 top-7 hidden h-0.5 transition-all duration-500 md:block", tab === "akubin" ? "bg-lime" : "bg-primary")} style={{ width: `${(step / (steps.length - 1)) * 100}%` }} />
        {steps.map((s, i) => (
          <li key={s.t} className="relative">
            <button onClick={() => setStep(i)} className="group flex w-full gap-4 text-left md:flex-col md:gap-0">
              <span
                className={cn(
                  "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 transition-all",
                  i <= step ? (tab === "akubin" ? "border-forest bg-forest text-lime" : "border-primary bg-primary text-primary-foreground") : "border-border bg-background text-muted-foreground group-hover:border-primary/50",
                )}
              >
                <s.icon className="size-6" />
              </span>
              <span className="md:mt-5">
                <span className="eyebrow text-muted-foreground">Step {i + 1}</span>
                <span className="mt-1 block font-display text-lg font-semibold">{s.t}</span>
                <span className={cn("mt-1 block text-sm leading-relaxed text-muted-foreground transition-opacity", i === step ? "opacity-100" : "md:opacity-60")}>{s.d}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
