import { createFileRoute } from "@tanstack/react-router";
import { Article } from "@/components/api/public-pages";
export const Route = createFileRoute("/articles/$slug")({ component: Detail });
function Detail() {
  return <Article slug={Route.useParams().slug} />;
}
