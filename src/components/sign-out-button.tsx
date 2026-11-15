import { useState, type ComponentProps } from "react";
import { useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useLogout } from "@/lib/api/hooks/use-api";
import { errorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export function SignOutButton({
  className,
  variant = "ghost",
  size = "sm",
}: Pick<ComponentProps<typeof Button>, "className" | "variant" | "size">) {
  const logout = useLogout();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!logout.isPending) {
          setOpen(next);
          setError("");
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <LogOut className="mr-1.5 size-4" /> Sign out
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of AkuMart?</AlertDialogTitle>
          <AlertDialogDescription>
            You’ll need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={logout.isPending}>Stay signed in</AlertDialogCancel>
          <AlertDialogAction
            disabled={logout.isPending}
            onClick={async (event) => {
              event.preventDefault();
              setError("");
              try {
                await logout.mutateAsync();
                setOpen(false);
                await router.navigate({ to: "/login", replace: true });
              } catch (cause) {
                setError(errorMessage(cause));
              }
            }}
          >
            {logout.isPending ? "Signing out…" : "Yes, sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
