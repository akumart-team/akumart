import { createFileRoute } from "@tanstack/react-router";
import { AdminContent } from "@/components/api/admin-pages";
export const Route = createFileRoute("/admin/content")({ component: AdminContent });
