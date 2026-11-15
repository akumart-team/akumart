import { createFileRoute } from "@tanstack/react-router";
import { Offers } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/offers")({ component: Offers });
