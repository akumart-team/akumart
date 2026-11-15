import { createFileRoute } from "@tanstack/react-router";
import { Contact } from "@/components/api/public-pages";
export const Route = createFileRoute("/contact")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { interest?: "general" | "support" | "business" | "logistics" } => ({
    interest: ["general", "support", "business", "logistics"].includes(String(s.interest))
      ? (s.interest as "general" | "support" | "business" | "logistics")
      : undefined,
  }),
  component: Page,
});
function Page() {
  return <Contact initialTopic={Route.useSearch().interest} />;
}
