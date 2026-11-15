import { createFileRoute } from "@tanstack/react-router";
import { Rewards } from "@/components/api/other-pages";
export const Route = createFileRoute("/app/akubin/rewards")({ component: Rewards });
