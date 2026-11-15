import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/settings")({ component: Settings });
