import { useSyncExternalStore } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { ShieldCheck, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { getDB, setIntent } from "@/lib/store";
import { canTrade, currentUser } from "@/lib/rules";
import type { Intent } from "@/lib/types";
import { StatusChip } from "./status-chip";

let pending: Intent | null = null;
const ls = new Set<() => void>();
const set = (i: Intent | null) => {
  pending = i;
  ls.forEach((l) => l());
};

/**
 * Wraps restricted Marketplace actions. Guests → sign in (intent kept).
 * Signed-in but unverified → contextual verification gate. Verified → run.
 */
export function useTradeGate() {
  const router = useRouter();
  return (intent: Intent, run: () => void) => {
    const db = getDB();
    const u = currentUser(db);
    if (!u) {
      setIntent(intent);
      router.navigate({ to: "/login", search: { redirect: intent.path } });
      return;
    }
    if (!canTrade(u, intent.level)) {
      set(intent);
      return;
    }
    run();
  };
}

export function VerificationGateDialog() {
  const intent = useSyncExternalStore(
    (l) => {
      ls.add(l);
      return () => ls.delete(l);
    },
    () => pending,
    () => null,
  );
  const navigate = useNavigate();
  const u = intent ? currentUser(getDB()) : null;
  const v = u?.verification;
  const status = intent && v ? (intent.level === "basic" ? v.basic : v.basic !== "approved" ? v.basic : v.full) : "not_started";
  return (
    <Dialog open={!!intent} onOpenChange={(o) => !o && set(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
            {intent?.level === "full" ? <Lock /> : <ShieldCheck />}
          </div>
          <DialogTitle className="font-display text-2xl">Complete Marketplace verification</DialogTitle>
          <DialogDescription className="text-base">
            To <strong className="text-foreground">{intent?.label.toLowerCase()}</strong> you need{" "}
            {intent?.level === "full" ? "full verification (identity documents and pickup address)" : "basic Marketplace verification"}. Browsing, saving listings and AkuBin
            recycling stay open without it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
          <span>Current status</span>
          <StatusChip status={status} />
        </div>
        <p className="text-xs text-muted-foreground">We’ll bring you straight back to this action once you’re approved.</p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => set(null)}>
            Not now
          </Button>
          <Button
            onClick={() => {
              if (intent) setIntent(intent);
              set(null);
              navigate({ to: "/app/verification", search: { level: intent?.level ?? "basic" } });
            }}
          >
            Continue verification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
