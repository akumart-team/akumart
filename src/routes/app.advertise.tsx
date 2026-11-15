import { createFileRoute } from "@tanstack/react-router";
import { Advertising } from "@/components/api/other-pages";
export const Route = createFileRoute("/app/advertise")({ component: Advertising });
