import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { MapPin, Clock, Recycle, AlertTriangle, WifiOff, Wrench, CheckCircle2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BinRow, distanceKm } from "@/components/bin-map";
import { useDB, useMe } from "@/lib/store";
import { DemoTag } from "@/components/brand";

export const Route = createFileRoute("/akubin/bin/$binId")({
  head: ({ params }) => ({
    meta: [
      { title: `AkuBin ${params.binId}, Recycle & Earn` },
      { name: "description", content: `Recycle at AkuBin ${params.binId}: accepted materials, status and how to deposit.` },
      { property: "og:title", content: `AkuBin ${params.binId}` },
      { property: "og:description", content: "Scan, deposit verified recyclables and earn AkuBin points." },
    ],
  }),
  component: BinLanding,
});

const STATUS = {
  online: { icon: CheckCircle2, title: "Online and accepting deposits", tone: "bg-primary/12 text-primary" },
  full: { icon: AlertTriangle, title: "Bin is full, awaiting collection", tone: "bg-warning/20 text-warning-foreground" },
  maintenance: { icon: Wrench, title: "Under maintenance", tone: "bg-warning/20 text-warning-foreground" },
  offline: { icon: WifiOff, title: "Offline, can’t verify deposits right now", tone: "bg-destructive/10 text-destructive" },
};

function BinLanding() {
  const { binId } = Route.useParams();
  const bin = useDB((d) => d.bins.find((b) => b.id === binId.toUpperCase()));
  const all = useDB((d) => d.bins);
  const settings = useDB((d) => d.settings);
  const me = useMe();
  const router = useRouter();

  if (!bin)
    return (
      <Shell>
        <div className="rounded-3xl border p-8 text-center">
          <AlertTriangle className="mx-auto size-10 text-destructive" />
          <h1 className="text-display mt-4 text-3xl">We couldn’t find bin “{binId}”</h1>
          <p className="mt-2 text-muted-foreground">The QR code may be damaged or this bin was removed. Try a nearby bin instead.</p>
          <Button asChild className="mt-6">
            <Link to="/akubin">Find another bin</Link>
          </Button>
        </div>
      </Shell>
    );

  const st = STATUS[bin.status];
  const ok = bin.status === "online";
  const alternatives = all
    .filter((b) => b.id !== bin.id && b.status === "online")
    .map((b) => ({ b, km: distanceKm(bin, b) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);
  const depositPath = `/akubin/bin/${bin.id}/deposit`;

  return (
    <Shell>
      <div className="overflow-hidden rounded-[2rem] bg-forest-gradient p-6 text-forest-foreground md:p-8">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-lime px-3 py-1 font-mono text-xs font-bold text-lime-foreground">{bin.id}</span>
          <DemoTag>Demo bin</DemoTag>
        </div>
        <h1 className="text-display mt-5 text-4xl">{bin.name}</h1>
        <p className="mt-2 flex items-start gap-2 text-forest-foreground/75">
          <MapPin className="mt-0.5 size-4 shrink-0" /> {bin.landmark}, {bin.area}, {bin.city}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-forest-foreground/60">
          <Clock className="size-4" /> {bin.hours}
        </p>
      </div>

      <div className={`mt-4 flex items-center gap-3 rounded-2xl p-4 ${st.tone}`} role="status">
        <st.icon className="size-5 shrink-0" />
        <p className="font-semibold">{st.title}</p>
      </div>

      <div className="mt-4 rounded-2xl border p-5">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Capacity used</span>
          <span>{bin.capacity}%</span>
        </div>
        <Progress value={bin.capacity} className="mt-2 h-2" />
      </div>

      <div className="mt-4 rounded-2xl border p-5">
        <p className="font-display text-lg font-semibold">Accepted here</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {bin.materials.map((m) => (
            <div key={m} className="rounded-xl bg-muted px-3 py-2.5">
              <p className="font-medium capitalize">{m}</p>
              <p className="text-xs text-muted-foreground">{settings.pointsPerKg[m]} pts / kg</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Count-based items earn {settings.pointsPerItem} pts each. Points are credited only after the bin verifies your deposit.</p>
      </div>

      <div className="mt-4 rounded-2xl border p-5">
        <p className="font-display text-lg font-semibold">How to deposit</p>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          {["Tap Recycle & Earn below and sign in if asked.", "Identify yourself with the on-screen session code or phone + PIN.", "Choose your material and insert items one at a time.", "Wait for verification, points appear instantly."].map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-forest">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="sticky bottom-4 z-20 mt-6">
        <Button
          size="lg"
          className="h-14 w-full text-base shadow-lift"
          disabled={!ok}
          onClick={() => {
            if (!me) router.navigate({ to: "/signup", search: { redirect: depositPath } });
            else router.navigate({ to: "/akubin/bin/$binId/deposit", params: { binId: bin.id } });
          }}
        >
          <Recycle /> {ok ? "Recycle & Earn here" : "Deposits unavailable at this bin"}
        </Button>
        {ok && !me && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Have an account?{" "}
            <Link to="/login" search={{ redirect: depositPath }} className="font-semibold text-primary">
              Sign in
            </Link>{" "}
           , no Marketplace verification needed.
          </p>
        )}
      </div>

      {!ok && alternatives.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 font-display text-lg font-semibold">Nearby bins accepting deposits</p>
          <div className="space-y-2">
            {alternatives.map(({ b, km }) => (
              <BinRow key={b.id} b={b} km={km} />
            ))}
          </div>
        </div>
      )}

      <Link to="/akubin" className="mt-8 flex items-center justify-center gap-1 text-sm font-medium text-primary">
        All AkuBin locations <ArrowRight className="size-4" />
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-5">
          <Logo />
          <span className="eyebrow text-primary">AkuBin</span>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-5 py-6 pb-24">{children}</main>
    </div>
  );
}
