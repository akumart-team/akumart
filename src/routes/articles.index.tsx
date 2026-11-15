import { createFileRoute } from "@tanstack/react-router";
import { Articles } from "@/components/api/public-pages";
export const Route = createFileRoute("/articles/")({ component: Articles });
