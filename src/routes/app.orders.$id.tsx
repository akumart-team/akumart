import { createFileRoute } from "@tanstack/react-router";
import { OrderDetails } from "@/components/api/other-pages";
export const Route = createFileRoute("/app/orders/$id")({ component: Detail });
function Detail() {
  return <OrderDetails id={Route.useParams().id} />;
}
