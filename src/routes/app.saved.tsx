import { createFileRoute } from "@tanstack/react-router";
import { Saved } from "@/components/api/account-pages";
export const Route = createFileRoute("/app/saved")({ component: Saved });
