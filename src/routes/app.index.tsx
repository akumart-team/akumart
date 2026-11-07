import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMe } from "@/lib/store";
import { homePath } from "@/lib/after-auth";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function AppHome() {
  const me = useMe();
  if (!me) return null;
  if (!me.prefs.onboarded) return <Navigate to="/onboarding" />;
  return <Navigate to={homePath(me) as "/app"} />;
}
