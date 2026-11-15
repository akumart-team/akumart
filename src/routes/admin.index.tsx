import { createFileRoute } from "@tanstack/react-router";
import { AdminOverview } from "@/components/api/admin-pages";
export const Route = createFileRoute("/admin/")({ component: AdminOverview });
