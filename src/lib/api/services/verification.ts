import { json, request } from "../client";
import type { Decision, Envelope, Page, Submission, VerificationRecord } from "../types";
export const listVerification = () =>
  request<Envelope<VerificationRecord[]>>("/users/me/verification");
export const submitVerification = (body: Submission) =>
  request<Envelope<VerificationRecord>>("/users/me/verification/submissions", json("POST", body));
export const reviewQueue = (page: number) =>
  request<Page<VerificationRecord>>(`/admin/verifications?page=${page}&limit=20`);
export const decideVerification = (id: string, body: Decision) =>
  request<Envelope<VerificationRecord>>(
    `/admin/verifications/${encodeURIComponent(id)}/decision`,
    json("POST", body),
  );
