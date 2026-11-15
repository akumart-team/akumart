import { getSession, json, request } from "../client";
export type Access = "public" | "optional" | "private";
export interface ResourceResult {
  data: unknown;
  pagination?: { page: number; limit: number; total: number };
  unreadCount?: number;
}
export type RecordValue = Record<string, unknown>;
export const record = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : {};
export const rows = (value: unknown): RecordValue[] =>
  Array.isArray(value) ? value.map(record) : [];
export function field(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (current, key) => (Array.isArray(current) ? current[Number(key)] : record(current)[key]),
      value,
    );
}
export function text(value: unknown): string {
  return value == null
    ? "—"
    : Array.isArray(value)
      ? value.map(text).join(", ")
      : typeof value === "object"
        ? Object.values(record(value))
            .filter((v) => typeof v === "string")
            .join(" · ") || "—"
        : String(value);
}
export const readResource = (path: string, access: Access) =>
  request<ResourceResult>(
    path,
    {},
    access === "private" || (access === "optional" && Boolean(getSession())),
  );
export const writeResource = (
  path: string,
  method: string,
  body?: unknown,
  access: Access = "private",
) =>
  request<ResourceResult>(
    path,
    json(method, body),
    access === "private" || (access === "optional" && Boolean(getSession())),
  );
