export type VerificationLevel = "basic" | "full";
export type VerificationType = "individual" | "business";
export type VerificationStatus =
  | "collecting"
  | "checking"
  | "pending_review"
  | "approved"
  | "rejected"
  | "needs_resubmission"
  | "superseded";
export type StaffRole = "super" | "operations" | "support" | "finance" | "content";
export interface Envelope<T> {
  data: T;
}
export interface Page<T> extends Envelope<T[]> {
  pagination: { total: number; page: number; limit: number };
}
export interface Session {
  accessToken: string;
  expiresAt: number;
  user: { id: string; email: string };
}
export interface VerificationRecord {
  id: string;
  profileId: string;
  level: VerificationLevel;
  type: VerificationType;
  status: VerificationStatus;
  expiresAt: string | null;
  reason: string | null;
  createdAt: string;
  data: Record<string, string>;
  documents: { uploadId: string; kind: string }[];
  events: {
    id: string;
    action: string;
    status: string;
    reason: string | null;
    createdAt: string;
  }[];
  profile?: { id: string; email: string; firstName: string; lastName: string };
}
export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  phone: string | null;
  city?: string | null;
  partner?: { id: string; status: string } | null;
  termsAcceptedAt: string | null;
  profileCompleted?: boolean;
  onboardedAt?: string | null;
  staff: { role: StaffRole; active: boolean } | null;
  preferences: {
    marketRole: "buyer" | "seller" | "both" | "logistics" | "recycler" | "none";
    activeMode: "buyer" | "seller" | null;
    akubin: boolean;
  } | null;
}
export interface Submission {
  level: VerificationLevel;
  type: VerificationType;
  data: Record<string, string>;
  documents: { uploadId: string; kind: string }[];
}
export interface Decision {
  decision: "approved" | "rejected" | "needs_resubmission";
  reason: string;
  expiresAt?: string;
}
