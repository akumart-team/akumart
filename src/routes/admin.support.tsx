import { createFileRoute } from "@tanstack/react-router";
import { AdminSupport } from "@/components/api/admin-pages";
export const Route = createFileRoute("/admin/support")({ component: AdminSupport });
