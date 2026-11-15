import { createFileRoute } from "@tanstack/react-router";
import { Partner } from "@/components/api/other-pages";
export const Route = createFileRoute("/app/partner")({ component: Partner });
