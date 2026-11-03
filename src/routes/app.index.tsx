import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMe } from "@/lib/store";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function AppHome() {
  const me = useMe();
  if (!me) return null;
  if (!me.prefs.onboarded) return <Navigate to="/onboarding" />;
  return <Navigate to={me.prefs.marketRole === "none" && me.prefs.akubin ? "/app/akubin" : "/app/marketplace"} />;
}
