import { createFileRoute } from "@tanstack/react-router";
import { AdminBins } from "@/components/api/admin-pages";
export const Route = createFileRoute("/admin/bins")({ component: AdminBins });
