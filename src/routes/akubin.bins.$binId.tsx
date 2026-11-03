import { createFileRoute, redirect } from "@tanstack/react-router";

// Alias: /akubin/bins/BIN-001 → /akubin/bin/BIN-001
export const Route = createFileRoute("/akubin/bins/$binId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/akubin/bin/$binId", params: { binId: params.binId } });
  },
});
