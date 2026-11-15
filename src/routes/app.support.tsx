import { createFileRoute } from "@tanstack/react-router";
import { Support } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/support")({ component: Support });
