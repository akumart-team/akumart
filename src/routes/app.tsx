import { createFileRoute } from "@tanstack/react-router";
import { AccountShell } from "@/components/account-shell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "My AkuMart" },
      { name: "description", content: "Your AkuMart Marketplace and AkuBin dashboard." },
      { property: "og:title", content: "My AkuMart" },
      { property: "og:description", content: "Manage trading and recycling in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountShell,
});
