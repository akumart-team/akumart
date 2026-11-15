import { getSession, request } from "../client";
import type { Envelope } from "../types";
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const supported = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export function validateDocument(file: File) {
  if (!supported.includes(file.type)) throw new Error("Use a JPEG, PNG, WebP or PDF file.");
  if (!file.size || file.size > MAX_UPLOAD_BYTES)
    throw new Error("Files must be non-empty and at most 3 MiB.");
}
export async function uploadVerificationDocument(file: File) {
  validateDocument(file);
  const body = new FormData();
  body.append("purpose", "verification_document");
  body.append("file", file);
  const result = await request<Envelope<{ id: string; status: string }>>("/uploads", {
    method: "POST",
    body,
  });
  if (result.data.status !== "ready") throw new Error("The uploaded file is not ready.");
  return result.data.id;
}
export const getUploadAccess = (id: string) =>
  request<Envelope<{ url: string }>>(
    `/uploads/${encodeURIComponent(id)}/access`,
    {},
    Boolean(getSession()),
  );
