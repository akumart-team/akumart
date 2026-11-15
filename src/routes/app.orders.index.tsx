import { createFileRoute } from "@tanstack/react-router";
import { Orders } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/orders/")({ component: Orders });
