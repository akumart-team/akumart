import { createFileRoute } from "@tanstack/react-router";
import { Advertise } from "@/components/api/public-pages";
export const Route = createFileRoute("/advertise")({ component: Advertise });
