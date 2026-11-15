import { createFileRoute, Navigate } from "@tanstack/react-router";

// Keep old bookmarks working without a second setup screen.
export const Route = createFileRoute("/onboarding")({
  component: () => <Navigate to="/app" replace />,
});
