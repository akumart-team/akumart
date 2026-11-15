import { createFileRoute } from "@tanstack/react-router";
import { AdminListings } from "@/components/api/admin-pages";
export const Route = createFileRoute("/admin/listings")({ component: AdminListings });
