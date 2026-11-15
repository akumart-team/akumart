import { createFileRoute } from "@tanstack/react-router";
import { Requests } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/requests")({ component: Requests });
