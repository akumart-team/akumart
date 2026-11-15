import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useProfile } from "@/lib/api/hooks/use-api";
import { afterConfirmation } from "@/lib/api/account-roles";
import { errorMessage } from "@/lib/api/client";
export const Route = createFileRoute("/app/")({
  component: AccountEntry,
});
function AccountEntry() {
  const profile = useProfile();
  if (profile.isError)
    return (
      <div role="alert">
        <p>{errorMessage(profile.error)}</p>
        <button onClick={() => void profile.refetch()}>Try again</button>
      </div>
    );
  return profile.data ? (
    <Navigate to={afterConfirmation(profile.data)} />
  ) : (
    <p role="status">Opening your workspace…</p>
  );
}
