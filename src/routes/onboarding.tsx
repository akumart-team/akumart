import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/site-chrome";
import { Settings } from "@/components/api/account-pages";
import { useApiSession } from "@/lib/api/hooks/use-api";
export const Route = createFileRoute("/onboarding")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: Onboarding,
});
function Onboarding() {
  const session = useApiSession();
  return (
    <PublicShell>
      <div className="container-page py-12">
        {session.isPending ? (
          <p>Loading account?</p>
        ) : session.data ? (
          <Settings onboarding />
        ) : (
          <Link to="/login" search={{ redirect: "/onboarding" }}>
            Sign in to set up your account
          </Link>
        )}
      </div>
    </PublicShell>
  );
}
