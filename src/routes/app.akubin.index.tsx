import { createFileRoute } from "@tanstack/react-router";
import { AkuBinDashboard } from "@/components/api/other-pages";
export const Route = createFileRoute("/app/akubin/")({ component: AkuBinDashboard });
