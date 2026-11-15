import { createFileRoute } from "@tanstack/react-router";
import { OwnListings } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/listings/")({ component: OwnListings });
