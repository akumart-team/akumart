import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QrCode, Loader2, CheckCircle2, XCircle, ArrowLeft, Coins, RefreshCw, Store } from "lucide-react";
import { Logo, DemoTag } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { inputCls, Field } from "@/components/field";
import { useDB, useMe, useHydratedFlag } from "@/lib/store";
import { createBinSession, startBinSession, endBinSession, recordDeposit } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/types";

export const Route = createFileRoute("/akubin/bin/$binId_/deposit")({
  head: ({ params }) => ({
    meta: [
      { title: `Deposit at ${params.binId}, AkuBin` },
      { name: "description", content: "Identify yourself at the bin, deposit verified recyclables and earn points." },
      { property: "og:title", content: `Deposit at ${params.binId}` },
      { property: "og:description", content: "AkuBin deposit flow." },
    ],
  }),
  component: Deposit,
});

type Outcome = "verified" | "contaminated" | "not_accepted" | "offline" | "full";
const OUTCOMES: { id: Outcome; label: string }[] = [
  { id: "verified", label: "Verified ✓" },
  { id: "contaminated", label: "Rejected: contaminated / liquid inside" },
  { id: "not_accepted", label: "Rejected: material not recognised" },
  { id: "offline", label: "Bin lost connection" },
  { id: "full", label: "Bin became full" },
];
const REASONS: Record<Exclude<Outcome, "verified">, string> = {
  contaminated: "The item contained liquid or food residue. Please empty and rinse it, then try again.",
  not_accepted: "The bin could not recognise this item as the selected material.",
  offline: "The bin lost connection before it could verify your deposit. Nothing was recorded.",
  full: "The bin reached capacity during your deposit. Please use a nearby bin.",
};

function Deposit() {
  const { binId } = Route.useParams();
  const bin = useDB((d) => d.bins.find((b) => b.id === binId));
  const settings = useDB((d) => d.settings);
  const me = useMe();
  const hydrated = useHydratedFlag();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"qr" | "pin">("qr");
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(120);
  const [idErr, setIdErr] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPinV] = useState("");
  const [material, setMaterial] = useState<Material | null>(null);
  const [measure, setMeasure] = useState<"weight" | "count">("weight");
  const [amount, setAmount] = useState("1.5");
  const [outcome, setOutcome] = useState<Outcome>("verified");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; points: number; kg: number; reason?: string } | null>(null);

  useEffect(() => {
    if (hydrated && !me) router.navigate({ to: "/signup", search: { redirect: `/akubin/bin/${binId}/deposit` } });
  }, [hydrated, me, router, binId]);
  useEffect(() => {
    if (me?.phone) setPhone(me.phone);
  }, [me?.phone]);
  useEffect(() => {
    if (!code || step !== 0) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [code, step]);

  if (!hydrated || !me) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!bin)
    return (
      <Wrap binId={binId}>
        <p>Unknown bin.</p>
        <Button asChild className="mt-4">
          <Link to="/akubin">Find a bin</Link>
        </Button>
      </Wrap>
    );
  if (bin.status !== "online" && !result)
    return (
      <Wrap binId={bin.id}>
        <div className="rounded-3xl border p-6 text-center">
          <XCircle className="mx-auto size-10 text-destructive" />
          <h1 className="text-display mt-3 text-2xl">This bin is {bin.status}</h1>
          <p className="mt-2 text-muted-foreground">Deposits can’t be verified right now, so no points can be earned here.</p>
          <Button asChild className="mt-5">
            <Link to="/akubin/bin/$binId" params={{ binId: bin.id }}>
              See nearby bins
            </Link>
          </Button>
        </div>
      </Wrap>
    );

  const newSession = () => {
    setCode(createBinSession(bin.id));
    setLeft(120);
    setIdErr("");
  };

  const confirmId = () => {
    if (!code) return setIdErr("Generate a code first.");
    const s = left <= 0 ? "expired" : startBinSession(code, bin.id);
    if (s !== "ok") return setIdErr(s === "used" ? "This code was already used. Generate a new one." : s === "expired" ? "Code expired. Generate a new code." : s === "busy" ? "Another person has an active session on this bin. Please wait." : "Invalid code.");
    setIdErr("");
    setStep(1);
  };

  const deposit = () => {
    if (!material) return;
    const n = +amount;
    if (!(n > 0)) return;
    setBusy(true);
    setTimeout(() => {
      const ok = outcome === "verified";
      const r = recordDeposit(bin.id, code, material, measure, n, ok, ok ? undefined : REASONS[outcome as Exclude<Outcome, "verified">]);
      setResult({ ok, points: r.points, kg: r.kg, reason: ok ? undefined : REASONS[outcome as Exclude<Outcome, "verified">] });
      setBusy(false);
      setStep(3);
    }, 1800);
  };

  const another = () => {
    setStep(1);
    setResult(null);
    setMaterial(null);
  };
  const restart = () => {
    if (code) endBinSession(code);
    setStep(0);
    setCode("");
    setResult(null);
    setMaterial(null);
  };

  return (
    <Wrap binId={bin.id} name={bin.name}>
      <ol className="mb-6 flex gap-2" aria-label="Progress">
        {["Identify", "Material", "Deposit", "Result"].map((s, i) => (
          <li key={s} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} aria-current={i === step} title={s} />
        ))}
      </ol>

      {step === 0 && (
        <section>
          <h1 className="text-display text-3xl">Identify at the bin</h1>
          <p className="mt-1 text-muted-foreground">Link this deposit to your account. Recycling needs no Marketplace verification.</p>
          <div className="mt-5 rounded-3xl border bg-background p-6 text-center">
            {code ? (
              <>
                <p className="text-sm text-muted-foreground">Type this code on the bin keypad</p>
                <p className="mt-2 font-mono text-4xl font-bold tracking-widest text-forest">{code}</p>
                <p className={cn("mt-2 text-sm", left < 20 ? "text-destructive" : "text-muted-foreground")}>{left > 0 ? `Single use, expires in ${left}s` : "Expired"}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="ghost" size="sm" onClick={newSession}><RefreshCw /> New code</Button>
                  <Button variant="ghost" size="sm" onClick={() => setLeft(0)}>Simulate expiry</Button>
                </div>
              </>
            ) : (
              <Button onClick={newSession}><QrCode /> Generate my numeric code</Button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Works at any connected AkuBin. The bin QR only shows bin information and never identifies you.</p>
          {idErr && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{idErr}</p>}
          <Button size="lg" className="mt-6 w-full" onClick={confirmId}>
            Simulate entering code on bin
          </Button>
        </section>
      )}

      {step === 1 && (
        <section>
          <h1 className="text-display text-3xl">What are you recycling?</h1>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {bin.materials.map((m) => (
              <button key={m} onClick={() => setMaterial(m)} className={cn("rounded-2xl border bg-background p-5 text-left", material === m && "border-primary ring-2 ring-primary/20")}>
                <p className="font-display text-lg font-semibold capitalize">{m}</p>
                <p className="text-xs text-muted-foreground">{settings.pointsPerKg[m]} pts/kg</p>
              </button>
            ))}
          </div>
          <p className="mb-2 mt-6 text-sm font-medium">The bin will measure by</p>
          <div className="grid grid-cols-2 gap-2">
            {(["weight", "count"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMeasure(m);
                  setAmount(m === "weight" ? "1.5" : "10");
                }}
                className={cn("rounded-xl border p-3 text-sm font-medium capitalize", measure === m && "border-primary bg-secondary")}
              >
                {m === "weight" ? "Weight (kg)" : "Item count"}
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft /> Back
            </Button>
            <Button className="flex-1" size="lg" disabled={!material} onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </section>
      )}

      {step === 2 && material && (
        <section>
          <h1 className="text-display text-3xl">Insert your {material}</h1>
          <p className="mt-1 text-muted-foreground">The bin’s sensors are simulated in this prototype.</p>
          <div className="mt-5 space-y-4 rounded-3xl border border-dashed border-warning bg-warning/10 p-5">
            <DemoTag>Hardware simulation</DemoTag>
            <Field label={measure === "weight" ? "Measured weight (kg)" : "Items counted"}>
              <input className={inputCls} type="number" step="0.1" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Bin verification result">
              <select className={inputCls} value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome)}>
                {OUTCOMES.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {busy ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl bg-forest p-8 text-forest-foreground">
              <Loader2 className="size-10 animate-spin text-lime" />
              <p className="font-semibold">Verifying and sorting…</p>
              <p className="text-sm text-forest-foreground/60">Please don’t remove items.</p>
            </div>
          ) : (
            <div className="mt-6 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft /> Back
              </Button>
              <Button className="flex-1" size="lg" onClick={deposit}>
                I’ve inserted my items
              </Button>
            </div>
          )}
        </section>
      )}

      {step === 3 && result && (
        <section className="text-center">
          {result.ok ? (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-lime text-lime-foreground">
                <Coins className="size-10" />
              </div>
              <p className="eyebrow mt-6 text-primary">Points earned</p>
              <p className="text-display mt-1 text-6xl text-forest">+{result.points}</p>
              <p className="mt-2 text-muted-foreground">{result.kg} kg verified · balance {me.points.toLocaleString()} pts</p>
            </>
          ) : (
            <>
              <XCircle className="mx-auto size-16 text-destructive" />
              <h1 className="text-display mt-4 text-3xl">Deposit not verified</h1>
              <p className="mt-2 text-muted-foreground">{result.reason}</p>
              <p className="mt-2 text-sm font-semibold">0 points credited.</p>
            </>
          )}
          <div className="mt-8 grid gap-2">
            <Button size="lg" onClick={another}>
              Deposit another item (same session)
            </Button>
            <Button size="lg" variant="outline" onClick={() => { restart(); router.navigate({ to: "/app/akubin" }); }}>
              <CheckCircle2 /> End session and view dashboard
            </Button>
            {!result.ok && (
              <Button asChild variant="ghost">
                <Link to="/akubin">Find another bin</Link>
              </Button>
            )}
          </div>
          <Link to="/marketplace" className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
            <Store className="size-3.5" /> Explore Marketplace later
          </Link>
        </section>
      )}
    </Wrap>
  );
}

function Wrap({ children, binId, name }: { children: React.ReactNode; binId: string; name?: string }) {
  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-5">
          <Logo />
          <Link to="/akubin/bin/$binId" params={{ binId }} className="text-right text-xs">
            <span className="block font-mono font-bold text-forest">{binId}</span>
            {name && <span className="text-muted-foreground">{name}</span>}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-5 py-8 pb-28">{children}</main>
    </div>
  );
}
