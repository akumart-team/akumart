import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useProfile } from "@/lib/api/hooks/use-api";
import { signInHome } from "@/lib/api/account-roles";
export const Route = createFileRoute("/app/")({
  component: AccountEntry,
});
function AccountEntry() {
  const profile = useProfile();
  return profile.data ? (
    <Navigate to={signInHome(profile.data)} />
  ) : (
    <p role="status">Opening your workspace…</p>
  );
}
