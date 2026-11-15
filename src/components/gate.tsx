import { useSyncExternalStore } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { ShieldCheck, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { setIntent } from "@/lib/store";
import { canTrade, approvedBasic, levelState } from "@/lib/api/verification-policy";
import { getProfile } from "@/lib/api/services/auth";
import { listVerification } from "@/lib/api/services/verification";
import { useProfile, useVerification } from "@/lib/api/hooks/use-api";
import { ApiError, errorMessage } from "@/lib/api/client";
import { toast } from "sonner";
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
  return async (intent: Intent, run: () => void | Promise<void>) => {
    try {
      const [profile, verification] = await Promise.all([getProfile(), listVerification()]);
      if (!canTrade(profile.data, verification.data, intent.level)) {
        setIntent(intent);
        set(intent);
        return;
      }
      await run();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setIntent(intent);
        router.navigate({ to: "/login", search: { redirect: intent.path } });
      } else toast.error(errorMessage(error));
    }
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
  const profile = useProfile();
  const verification = useVerification();
  const rows = verification.data || [];
  const basic = approvedBasic(rows);
  const status = intent
    ? levelState(
        rows,
        intent.level === "full" && !basic ? "basic" : intent.level,
        intent.level === "full" && basic ? basic.type : undefined,
      ).status
    : "not_started";
  return (
    <Dialog open={!!intent} onOpenChange={(o) => !o && set(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
            {intent?.level === "full" ? <Lock /> : <ShieldCheck />}
          </div>
          <DialogTitle className="font-display text-2xl">
            Complete Marketplace verification
          </DialogTitle>
          <DialogDescription className="text-base">
            To <strong className="text-foreground">{intent?.label.toLowerCase()}</strong> you need{" "}
            {intent?.level === "full"
              ? "full verification matching your approved basic account type"
              : "basic Marketplace verification"}
            . Browsing, saving listings and AkuBin recycling stay open without it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
          <span>Current status</span>
          <StatusChip status={status} />
        </div>
        {!profile.data?.termsAcceptedAt && (
          <p className="text-sm text-destructive">Accepted terms are required before trading.</p>
        )}
        <p className="text-xs text-muted-foreground">
          We’ll bring you straight back to this action once you’re approved.
        </p>
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
