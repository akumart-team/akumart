import { createFileRoute } from "@tanstack/react-router";
import { AccountMarketplace } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/marketplace")({ component: AccountMarketplace });
