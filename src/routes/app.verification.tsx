import { createFileRoute } from "@tanstack/react-router";
import { VerificationPage } from "@/components/verification-page";
export const Route = createFileRoute("/app/verification")({
  validateSearch: (s: Record<string, unknown>): { level?: "basic" | "full" } => ({
    level: s.level === "full" ? "full" : s.level === "basic" ? "basic" : undefined,
  }),
  component: Verification,
});
function Verification() {
  return <VerificationPage requestedLevel={Route.useSearch().level} />;
}
