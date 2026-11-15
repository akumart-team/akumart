import { createFileRoute } from "@tanstack/react-router";
import { AdminAds } from "@/components/api/admin-pages";
export const Route = createFileRoute("/admin/ads")({ component: AdminAds });
