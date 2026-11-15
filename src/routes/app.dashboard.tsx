import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });
