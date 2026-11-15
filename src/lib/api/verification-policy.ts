import type { Profile, VerificationLevel, VerificationRecord, VerificationType } from "./types";
export const isCurrentApproval = (row: VerificationRecord, now = Date.now()) =>
  row.status === "approved" && (!row.expiresAt || Date.parse(row.expiresAt) > now);
export function approvedBasic(rows: VerificationRecord[], now = Date.now()) {
  return rows.find((row) => row.level === "basic" && isCurrentApproval(row, now));
}
export function canTrade(
  profile: Pick<Profile, "termsAcceptedAt"> | null | undefined,
  rows: VerificationRecord[],
  level: VerificationLevel,
  now = Date.now(),
) {
  const basic = approvedBasic(rows, now);
  return Boolean(
    profile?.termsAcceptedAt &&
    basic &&
    (level === "basic" ||
      rows.some(
        (row) => row.level === "full" && row.type === basic.type && isCurrentApproval(row, now),
      )),
  );
}
export function levelState(
  rows: VerificationRecord[],
  level: VerificationLevel,
  type?: VerificationType,
  now = Date.now(),
) {
  const candidates = rows.filter((row) => row.level === level && (!type || row.type === type));
  const approved = candidates.find((row) => isCurrentApproval(row, now));
  if (approved) return { status: "approved", record: approved };
  const latest = candidates[0];
  return {
    status: latest?.status === "approved" ? "expired" : latest?.status || "not_started",
    record: latest,
  };
}
