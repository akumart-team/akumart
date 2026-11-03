import type { AdminRole } from "./types";
import { useDB } from "./store";

export const ADMIN_TABS: { to: string; label: string; roles: AdminRole[] }[] = [
  { to: "/admin", label: "Overview", roles: ["super", "operations", "support", "finance", "content"] },
  { to: "/admin/verification", label: "Verification", roles: ["super", "support", "operations"] },
  { to: "/admin/partners", label: "Partners", roles: ["super", "operations"] },
  { to: "/admin/listings", label: "Listings", roles: ["super", "operations"] },
  { to: "/admin/bins", label: "Bins", roles: ["super", "operations"] },
  { to: "/admin/support", label: "Tickets & disputes", roles: ["super", "support"] },
  { to: "/admin/finance", label: "Finance", roles: ["super", "finance"] },
  { to: "/admin/content", label: "Content", roles: ["super", "content"] },
  { to: "/admin/ads", label: "Ads", roles: ["super", "content"] },
  { to: "/admin/settings", label: "Settings & audit", roles: ["super"] },
];

export const ROLE_LABEL: Record<AdminRole, string> = { super: "Super Admin", operations: "Operations", support: "Support", finance: "Finance", content: "Content Editor" };


export function useActor() {
  const r = useDB((d) => d.devRole);
  return r ? `${ROLE_LABEL[r]} (demo staff)` : "admin";
}
