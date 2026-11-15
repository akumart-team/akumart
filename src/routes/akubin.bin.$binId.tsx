import { createFileRoute } from "@tanstack/react-router";
import { BinDetails } from "@/components/api/other-pages";
export const Route = createFileRoute("/akubin/bin/$binId")({ component: Detail });
function Detail() {
  return <BinDetails code={Route.useParams().binId} deposit={false} />;
}
