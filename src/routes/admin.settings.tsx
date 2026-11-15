import { createFileRoute } from "@tanstack/react-router";
import { AdminSettings } from "@/components/api/admin-pages";
export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });
