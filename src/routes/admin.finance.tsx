import { createFileRoute } from "@tanstack/react-router";
import { AdminFinance } from "@/components/api/admin-pages";
export const Route = createFileRoute("/admin/finance")({ component: AdminFinance });
