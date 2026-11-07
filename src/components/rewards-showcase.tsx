import { Smartphone, Wallet, Gift, Zap, HeartHandshake, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const REWARD_CATEGORIES = [
  { id: "airtime", icon: Smartphone, t: "Airtime & Data", d: "Redeem your points for airtime and mobile data." },
  { id: "cash", icon: Wallet, t: "Cash Rewards", d: "Convert eligible points into cash when you reach the required threshold." },
  { id: "physical", icon: Gift, t: "Gift Items", d: "Exchange your points for useful everyday items." },
  { id: "bills", icon: Zap, t: "Bills & Utilities", d: "Use eligible rewards toward supported utility payments." },
  { id: "charity", icon: HeartHandshake, t: "Donate to Charity", d: "Support meaningful causes with your recycling points." },
] as const;

export function RewardsShowcase() {
  return (
    <section className="bg-mist">
      <div className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-primary">Rewards</p>
          <h2 className="text-display mt-3 text-3xl md:text-5xl">Get Rewarded for Recycling</h2>
          <p className="mt-4 text-lg text-muted-foreground">Turn your recyclable waste into points and redeem them for rewards that matter to you.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REWARD_CATEGORIES.map((c) => (
            <Card key={c.id} icon={c.icon} t={c.t} d={c.d} />
          ))}
          <Card icon={TrendingUp} t="Recycling Impact" d="Track your recycling contributions and environmental impact." info />
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">Reward options, thresholds and availability are set by AkuMart and may change.</p>
      </div>
    </section>
  );
}

function Card({ icon: I, t, d, info }: { icon: typeof Gift; t: string; d: string; info?: boolean }) {
  return (
    <div className={cn("group flex h-full flex-col rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", info ? "bg-forest text-forest-foreground" : "bg-background")}>
      <div className={cn("flex h-24 items-center justify-center rounded-2xl transition-transform group-hover:scale-[1.02]", info ? "bg-forest-soft" : "bg-secondary")}>
        <I className={cn("size-12", info ? "text-lime" : "text-primary")} strokeWidth={1.5} />
      </div>
      <div className="mt-6 flex items-center gap-2">
        <p className="font-display text-xl font-semibold">{t}</p>
        {info && <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold uppercase text-lime-foreground">Insight</span>}
      </div>
      <p className={cn("mt-2 text-sm leading-relaxed", info ? "text-forest-foreground/75" : "text-muted-foreground")}>{d}</p>
    </div>
  );
}
