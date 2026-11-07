import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Field, Chips } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateMe, useMe, useHydratedFlag, getDB } from "@/lib/store";
import { MATERIALS } from "@/lib/seed";
import { safeTarget } from "@/lib/after-auth";
import type { MarketRole, Material } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Set up your account | AkuMart" },
      { name: "description", content: "Choose how you want to use the AkuMart Marketplace and AkuBin." },
      { property: "og:title", content: "Get set up on AkuMart" },
      { property: "og:description", content: "Pick Buyer, Seller, Both or Recycle & Earn." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const me = useMe();
  const hydrated = useHydratedFlag();
  const [role, setRole] = useState<MarketRole | "">("");
  const [interests, setInterests] = useState<Material[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (hydrated && !me) router.navigate({ to: "/login" });
  }, [hydrated, me, router]);

  const cont = () => {
    if (!role) return setErr("Choose how you want to use AkuMart. You can change this any time.");
    updateMe((u) => {
      u.prefs = { marketRole: role as MarketRole, akubin: true, onboarded: true, interests, activeMode: role === "both" ? "seller" : undefined };
    });
    const intent = getDB().intent;
    const target = safeTarget(redirect) ?? safeTarget(intent?.path);
    if (target) return router.history.push(target);
    router.history.push(role !== "none" ? "/app/marketplace" : "/app/akubin");
  };

  return (
    <AuthLayout>
      <p className="eyebrow text-primary">Welcome{me ? `, ${me.name.split(" ")[0]}` : ""}</p>
      <h1 className="text-display mt-2 text-4xl">How will you use AkuMart?</h1>
      <p className="mt-2 text-muted-foreground">Choose Buyer, Seller, Both or Recycle & Earn. AkuBin is always available from your account.</p>
      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border p-5">
          <div className="mb-4 flex items-center gap-3">
            <ShoppingBag className="size-5 text-primary" />
            <p className="font-display text-lg font-semibold">Your account type</p>
          </div>
          <Field label="I want to…">
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as MarketRole);
                setErr("");
              }}
            >
              <SelectTrigger className="h-11 rounded-xl" aria-label="Marketplace role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buy Waste</SelectItem>
                <SelectItem value="seller">Sell Waste</SelectItem>
                <SelectItem value="both">Buy & Sell Waste</SelectItem>
                <SelectItem value="none">Recycle & Earn</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {role && role !== "none" && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Materials you’re interested in (personalises your feed)</p>
              <Chips options={MATERIALS.map((m) => ({ id: m.id, label: m.label }))} value={interests} onChange={setInterests} />
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Verification is only requested when you first make an offer, list, or pay.</p>
        </div>
      </div>
      {err && (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {err}
        </p>
      )}
      <Button size="lg" className="mt-8 w-full" onClick={cont} disabled={!role}>
        Continue
      </Button>
    </AuthLayout>
  );
}
