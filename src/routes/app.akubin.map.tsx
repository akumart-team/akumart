import { createFileRoute } from "@tanstack/react-router";
import { Bins } from "@/components/api/other-pages";
export const Route = createFileRoute("/app/akubin/map")({ component: () => <Bins embedded /> });
