import { createFileRoute, redirect } from "@tanstack/react-router";

// Short QR URL alias: /bin/BIN-001 → /akubin/bin/BIN-001
export const Route = createFileRoute("/bin/$binId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/akubin/bin/$binId", params: { binId: params.binId } });
  },
});
