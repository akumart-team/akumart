import { request, json } from "../client";
import type { StaffRole } from "../types";
export type RecommendationResource = "listing" | "article" | "job";
export type RecommendationAction = "impression" | "view" | "save" | "dismiss" | "contact";
export const workflowPaths = {
  staff: (id: string) => `/admin/staff/${encodeURIComponent(id)}`,
  request: (id: string) => `/buyer-requests/${encodeURIComponent(id)}`,
  response: (requestId: string, id: string) =>
    `/buyer-requests/${encodeURIComponent(requestId)}/responses/${encodeURIComponent(id)}`,
  dispute: (id: string) => `/orders/${encodeURIComponent(id)}/disputes`,
  disputeDecision: (id: string) => `/admin/disputes/${encodeURIComponent(id)}/decision`,
  campaignStats: (id: string) => `/advertising/campaigns/${encodeURIComponent(id)}/stats`,
  bin: (id: string) => `/admin/akubin/bins/${encodeURIComponent(id)}`,
  redemptionDecision: (id: string) =>
    `/admin/akubin/redemptions/${encodeURIComponent(id)}/decision`,
  redemptionFulfillment: (id: string) =>
    `/admin/akubin/redemptions/${encodeURIComponent(id)}/fulfillment`,
};
export interface AssignStaff {
  role: StaffRole;
  active: boolean;
  reason: string;
}
export const recommendationEvent = (
  resourceType: RecommendationResource,
  resourceId: string,
  action: RecommendationAction,
) =>
  request<{ recorded: boolean }>(
    "/recommendations/events",
    json("POST", { resourceType, resourceId, action }),
  );
export const campaignEvent = (token: string, kind: "impression" | "click") =>
  request<{ recorded: boolean }>("/advertising/events", json("POST", { token, kind }), false);
export function csv(value: unknown) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function localDateTime(value: unknown) {
  const date = new Date(String(value || ""));
  return Number.isFinite(date.getTime())
    ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : "";
}
