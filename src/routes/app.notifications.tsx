import { createFileRoute } from "@tanstack/react-router";
import { Notifications } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/notifications")({ component: Notifications });
