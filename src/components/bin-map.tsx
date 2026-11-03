import { Link } from "@tanstack/react-router";
import type { Bin } from "@/lib/types";
import { cn } from "@/lib/utils";

export const binTone: Record<Bin["status"], string> = {
  online: "bg-primary",
  full: "bg-warning",
  maintenance: "bg-warning",
  offline: "bg-destructive",
};

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Simulated, schematic map of Nigeria — not a live GIS map. */
export function BinMap({ bins, selected, onSelect, me }: { bins: Bin[]; selected?: string; onSelect?: (id: string) => void; me?: { lat: number; lng: number } | null }) {
  const pos = (lat: number, lng: number) => ({ left: `${((lng - 2.6) / 12.2) * 100}%`, top: `${(1 - (lat - 4.2) / 9.8) * 100}%` });
  return (
    <div className="relative aspect-[4/3.4] w-full overflow-hidden rounded-3xl bg-forest">
      <div className="grain absolute inset-0" aria-hidden />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M6 70 L4 50 L10 30 L22 18 L40 10 L62 8 L80 12 L95 26 L97 46 L88 60 L78 66 L70 80 L58 92 L44 96 L30 88 L18 82 Z" className="fill-forest-soft stroke-lime/30" strokeWidth="0.4" />
      </svg>
      {me && (
        <span className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={pos(me.lat, me.lng)}>
          <span className="block h-4 w-4 animate-pulse rounded-full border-2 border-forest-foreground bg-info" />
        </span>
      )}
      {bins.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect?.(b.id)}
          aria-label={`${b.name}, ${b.status}`}
          className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={pos(b.lat, b.lng)}
        >
          <span className={cn("block h-3.5 w-3.5 rounded-full ring-4 ring-forest transition-transform group-hover:scale-150", binTone[b.status], selected === b.id && "scale-150 ring-lime")} />
        </button>
      ))}
      <div className="absolute bottom-3 left-3 rounded-full bg-forest-foreground/10 px-3 py-1 text-[11px] font-medium text-forest-foreground/80 backdrop-blur">Simulated map · demo bin locations</div>
      <div className="absolute right-3 top-3 flex gap-3 rounded-full bg-forest-foreground/10 px-3 py-1 text-[11px] text-forest-foreground/80 backdrop-blur">
        <span className="flex items-center gap-1">
          <i className="h-2 w-2 rounded-full bg-primary" /> Online
        </span>
        <span className="flex items-center gap-1">
          <i className="h-2 w-2 rounded-full bg-warning" /> Full/maint.
        </span>
        <span className="flex items-center gap-1">
          <i className="h-2 w-2 rounded-full bg-destructive" /> Offline
        </span>
      </div>
    </div>
  );
}

export function BinRow({ b, km, active }: { b: Bin; km?: number; active?: boolean }) {
  return (
    <Link
      to="/akubin/bin/$binId"
      params={{ binId: b.id }}
      className={cn("flex items-center gap-4 rounded-2xl border p-4 transition-colors hover:border-primary", active && "border-primary bg-secondary")}
    >
      <span className={cn("h-3 w-3 shrink-0 rounded-full", binTone[b.status])} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{b.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {b.landmark} · {b.area}, {b.city}
        </p>
        <p className="mt-1 text-xs capitalize text-muted-foreground">{b.materials.join(" · ")}</p>
      </div>
      <div className="text-right text-xs text-muted-foreground">
        <p className="font-medium capitalize text-foreground">{b.status}</p>
        {km !== undefined && <p>{km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}</p>}
      </div>
    </Link>
  );
}
