import type { Profile } from "./types";
export const accountRoleOptions = [
  { value: "buyer", label: "Buyer — purchase materials" },
  { value: "seller", label: "Seller — list and sell materials" },
  { value: "both", label: "Buyer & Seller" },
  { value: "logistics", label: "Logistics Partner — deliver materials" },
  { value: "recycler", label: "Recycle & Earn — use AkuBin" },
] as const;
export type AccountRole = (typeof accountRoleOptions)[number]["value"];
export const isAccountRole = (value: unknown): value is AccountRole =>
  accountRoleOptions.some((option) => option.value === value);
export function afterConfirmation(profile: Profile) {
  return signInHome(profile);
}
export function hasLogisticsWorkspace(profile: Pick<Profile, "preferences" | "partner">) {
  return profile.preferences?.marketRole === "logistics" || profile.partner?.status === "approved";
}
export function accountHome(role: unknown) {
  if (role === "recycler") return "/app/akubin";
  if (role === "logistics") return "/app/partner";
  if (role === "buyer" || role === "seller" || role === "both") return "/app/dashboard";
  return "/app/dashboard";
}
const staffHomes = {
  super: "/admin",
  operations: "/admin",
  support: "/admin/support",
  finance: "/admin/finance",
  content: "/admin/content",
} as const;
export function signInHome(profile: Pick<Profile, "staff" | "preferences">) {
  return profile.staff?.active
    ? staffHomes[profile.staff.role]
    : accountHome(profile.preferences?.marketRole);
}
export function tradingMode(
  preferences: { marketRole: string; activeMode?: string | null } | null | undefined,
): "buyer" | "seller" | null {
  if (preferences?.marketRole === "buyer" || preferences?.marketRole === "seller")
    return preferences.marketRole;
  if (preferences?.marketRole === "both")
    return preferences.activeMode === "seller" ? "seller" : "buyer";
  return null;
}
