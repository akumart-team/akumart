import { createFileRoute } from "@tanstack/react-router";
import { Leaderboard } from "@/components/api/other-pages";
export const Route = createFileRoute("/app/akubin/leaderboard")({ component: Leaderboard });
