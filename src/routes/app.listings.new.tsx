import { createFileRoute } from "@tanstack/react-router";
import { ListingEditor } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/listings/new")({
  validateSearch: (s: Record<string, unknown>): { edit?: string; publish?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
    publish: typeof s.publish === "string" ? s.publish : undefined,
  }),
  component: Editor,
});
function Editor() {
  return <ListingEditor id={Route.useSearch().edit} />;
}
