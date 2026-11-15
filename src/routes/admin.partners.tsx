import { createFileRoute } from "@tanstack/react-router";
import { AdminPartners } from "@/components/api/admin-pages";
export const Route = createFileRoute("/admin/partners")({ component: AdminPartners });
