/** Format decimal strings for display without rounding monetary values through Number. */
export function decimalLabel(value: unknown, money = false) {
  const raw = typeof value === "string" || typeof value === "number" ? String(value) : "";
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return "—";
  const [whole, fraction] = raw.split(".");
  return (
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    (fraction ? "." + (money ? fraction.padEnd(2, "0") : fraction) : money ? ".00" : "")
  );
}
export const nairaLabel = (value: unknown) => "₦" + decimalLabel(value, true);
export function dateLabel(value: unknown) {
  const date = new Date(String(value || ""));
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}
