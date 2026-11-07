import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { PageTitle } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { BinMap, BinRow, distanceKm } from "@/components/bin-map";
import { useDB } from "@/lib/store";
import { MATERIALS } from "@/lib/seed";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/types";

export const Route = createFileRoute("/app/akubin/map")({
  head: () => ({ meta: [{ title: "Find a bin | AkuMart" }, { name: "robots", content: "noindex" }] }),
  component: AppBinMap,
});

function AppBinMap() {
  const bins = useDB((d) => d.bins);
  const [q, setQ] = useState("");
  const [mat, setMat] = useState<Material | "all">("all");
  const [view, setView] = useState<"map" | "list">("map");
  const [sel, setSel] = useState<string>();
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [msg, setMsg] = useState("");
  const list = useMemo(() => {
    let r = bins.filter((b) => (b.name + b.city + b.area + b.landmark).toLowerCase().includes(q.toLowerCase()));
    if (mat !== "all") r = r.filter((b) => b.materials.includes(mat));
    const w = r.map((b) => ({ b, km: loc ? distanceKm(loc, b) : undefined }));
    if (loc) w.sort((a, b) => a.km! - b.km!);
    return w;
  }, [bins, q, mat, loc]);
  const locate = () => {
    if (!navigator.geolocation) return setMsg("Location isn’t available, search by city, area or landmark instead.");
    setMsg("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({ lat: p.coords.latitude, lng: p.coords.longitude });
        setMsg("Sorted by distance from you. Distances are approximate.");
      },
      () => setMsg("Location permission denied. You can still search."),
      { timeout: 8000 },
    );
  };
  return (
    <div>
      <PageTitle
        eyebrow="AkuBin"
        title="Find a bin"
        intro="Bin locations shown are proposed sites and not yet live."
        actions={
          <div className="inline-flex rounded-full border bg-background p-1">
            {(["map", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium capitalize", view === v ? "bg-forest text-forest-foreground" : "text-muted-foreground")}>
                {v}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input aria-label="Search bins" value={q} onChange={(e) => setQ(e.target.value)} placeholder="City, area or landmark" className="h-11 w-full rounded-full border bg-background pl-11 pr-4 outline-none focus:border-primary" />
        </div>
        <Button variant="forest" onClick={locate}>
          <LocateFixed /> Closest to me
        </Button>
      </div>
      {msg && <p className="mt-3 text-sm text-muted-foreground" role="status">{msg}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {[{ id: "all" as const, label: "All materials" }, ...MATERIALS.filter((m) => ["plastic", "metal", "glass", "paper"].includes(m.id))].map((m) => (
          <button key={m.id} onClick={() => setMat(m.id)} className={cn("rounded-full border px-3 py-1.5 text-sm", mat === m.id ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>
            {m.label}
          </button>
        ))}
      </div>
      <div className={cn("mt-6 grid gap-6", view === "map" && "xl:grid-cols-[1.3fr_1fr]")}>
        {view === "map" && <BinMap bins={list.map((x) => x.b)} selected={sel} onSelect={setSel} me={loc} />}
        <div className={cn("space-y-3", view === "map" && "max-h-[560px] overflow-y-auto pr-1")}>
          {list.length === 0 && <p className="rounded-2xl border border-dashed bg-background p-8 text-center text-muted-foreground">No bins match.</p>}
          {list.map(({ b, km }) => (
            <BinRow key={b.id} b={b} km={km} active={sel === b.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
