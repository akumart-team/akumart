import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LocateFixed, Search, ArrowRight, QrCode, Scale, Coins, Gift, Smartphone } from "lucide-react";
import { PublicShell } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { BinMap, BinRow, distanceKm } from "@/components/bin-map";
import { HowItWorks } from "@/components/how-it-works";
import { useDB } from "@/lib/store";
import { MATERIALS } from "@/lib/seed";
import { kiosk } from "@/lib/images";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/types";

export const Route = createFileRoute("/akubin/")({
  head: () => ({
    meta: [
      { title: "AkuBin — Recycle at smart bins and earn rewards | AkuMart" },
      { name: "description", content: "Find an AkuBin near you, deposit verified recyclables and earn points for airtime, cash or reward items. No business verification required." },
      { property: "og:title", content: "AkuBin by AkuMart" },
      { property: "og:description", content: "Smart bins that reward everyday recycling." },
    ],
  }),
  component: AkuBin,
});

function AkuBin() {
  const bins = useDB((d) => d.bins);
  const rewards = useDB((d) => d.rewards);
  const settings = useDB((d) => d.settings);
  const [q, setQ] = useState("");
  const [mat, setMat] = useState<Material | "all">("all");
  const [view, setView] = useState<"map" | "list">("map");
  const [sel, setSel] = useState<string>();
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState("");

  const list = useMemo(() => {
    let r = bins.filter((b) => (b.name + b.city + b.area + b.landmark).toLowerCase().includes(q.toLowerCase()));
    if (mat !== "all") r = r.filter((b) => b.materials.includes(mat));
    const withKm = r.map((b) => ({ b, km: loc ? distanceKm(loc, b) : undefined }));
    if (loc) withKm.sort((a, b) => a.km! - b.km!);
    return withKm;
  }, [bins, q, mat, loc]);

  const findClosest = () => {
    setGeoMsg("Requesting your location…");
    if (!navigator.geolocation) return setGeoMsg("Location isn’t available in this browser — search by city, area or landmark instead.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoMsg("Sorted by distance from you. Distances to demo bins are approximate.");
      },
      () => setGeoMsg("Location permission denied. You can still search by city, area or landmark."),
      { timeout: 8000 },
    );
  };

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-forest-gradient text-forest-foreground">
        <div className="container-page grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow text-lime">AkuBin · Recycle & Earn</p>
            <h1 className="text-display mt-4 text-5xl md:text-7xl">
              Drop it in.
              <br />
              <span className="text-lime">Get rewarded.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-forest-foreground/75">Smart bins that check your recyclables and credit points you can redeem. Just a basic account — no ID or business paperwork.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="lime">
                <a href="#locator">
                  Find a bin <ArrowRight />
                </a>
              </Button>
              <Button asChild size="lg" variant="glass">
                <Link to="/akubin/bin/$binId" params={{ binId: "BIN-001" }}>
                  <QrCode /> Try a QR bin page
                </Link>
              </Button>
            </div>
          </div>
          <img src={kiosk} alt="Person recycling at an AkuBin smart bin" className="mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] object-cover shadow-lift" />
        </div>
      </section>

      <section className="container-page py-16">
        <p className="eyebrow text-primary">How it works</p>
        <h2 className="text-display mb-8 mt-3 text-3xl md:text-4xl">Find → identify → deposit → earn → redeem</h2>
        <HowItWorks initial="akubin" />
      </section>

      <section id="locator" className="scroll-mt-24 bg-mist py-16">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-display text-3xl md:text-4xl">Bin locator</h2>
              <p className="mt-1 text-muted-foreground">All bins shown are demonstration locations, not live deployments.</p>
            </div>
            <div className="inline-flex rounded-full border bg-background p-1">
              {(["map", "list"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium capitalize", view === v ? "bg-forest text-forest-foreground" : "text-muted-foreground")}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input aria-label="Search bins" value={q} onChange={(e) => setQ(e.target.value)} placeholder="City, area or landmark — e.g. Yaba, Wuse, stadium" className="h-12 w-full rounded-full border bg-background pl-11 pr-4 outline-none focus:border-primary" />
            </div>
            <Button size="lg" variant="forest" onClick={findClosest}>
              <LocateFixed /> Find the closest bin to me
            </Button>
          </div>
          {geoMsg && <p className="mt-3 text-sm text-muted-foreground" role="status">{geoMsg}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {[{ id: "all" as const, label: "All materials" }, ...MATERIALS.filter((m) => ["plastic", "metal", "glass", "paper"].includes(m.id))].map((m) => (
              <button key={m.id} onClick={() => setMat(m.id)} className={cn("rounded-full border px-3 py-1.5 text-sm", mat === m.id ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>
                {m.label}
              </button>
            ))}
          </div>
          <div className={cn("mt-6 grid gap-6", view === "map" && "lg:grid-cols-[1.3fr_1fr]")}>
            {view === "map" && <BinMap bins={list.map((x) => x.b)} selected={sel} onSelect={setSel} me={loc} />}
            <div className={cn("space-y-3", view === "map" && "max-h-[560px] overflow-y-auto pr-1")}>
              {list.length === 0 && <p className="rounded-2xl border border-dashed bg-background p-8 text-center text-muted-foreground">No bins match. Try another area.</p>}
              {list.map(({ b, km }) => (
                <BinRow key={b.id} b={b} km={km} active={sel === b.id} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-10 py-20 lg:grid-cols-2">
        <div>
          <p className="eyebrow text-primary">Rewards</p>
          <h2 className="text-display mt-3 text-3xl md:text-4xl">Save points, or spend them.</h2>
          <p className="mt-4 text-muted-foreground">Points never expire under current rules. Airtime is sent automatically; cash and items are reviewed first.</p>
          <ul className="mt-8 space-y-4">
            {[
              { i: Scale, t: "Verified deposits only", d: "The bin checks material and weight or count. No verification, no points." },
              { i: Coins, t: "Points by material", d: `e.g. plastic ${settings.pointsPerKg.plastic} pts/kg, metal ${settings.pointsPerKg.metal} pts/kg, glass ${settings.pointsPerKg.glass} pts/kg (demo rates).` },
              { i: Smartphone, t: "QR or phone + PIN", d: "Identify yourself at the bin by scanning or entering your phone and PIN." },
            ].map((x) => (
              <li key={x.t} className="flex gap-4">
                <x.i className="mt-1 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{x.t}</p>
                  <p className="text-sm text-muted-foreground">{x.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {rewards.map((r) => (
            <div key={r.id} className="rounded-2xl border p-5">
              <Gift className="size-5 text-primary" />
              <p className="mt-3 font-semibold">{r.name}</p>
              <p className="text-sm text-muted-foreground">
                {r.cost.toLocaleString()} pts · {r.automated ? "Instant" : "Reviewed"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
