import { describe, expect, it } from "vitest";
import { canTrade, levelState } from "@/lib/api/verification-policy";
import { MAX_UPLOAD_BYTES, validateDocument } from "@/lib/api/services/uploads";
import type { VerificationRecord } from "@/lib/api/types";
const now = Date.parse("2026-11-15T12:00:00Z");
const row = (overrides: Partial<VerificationRecord> = {}): VerificationRecord => ({
  id: "basic",
  profileId: "owner",
  level: "basic",
  type: "individual",
  status: "approved",
  expiresAt: null,
  reason: null,
  createdAt: new Date(now).toISOString(),
  data: {},
  documents: [],
  events: [],
  ...overrides,
});
describe("Backend verification eligibility", () => {
  it("requires terms and unexpired basic approval", () => {
    expect(canTrade(null, [row()], "basic", now)).toBe(false);
    expect(canTrade({ termsAcceptedAt: null }, [row()], "basic", now)).toBe(false);
    expect(
      canTrade(
        { termsAcceptedAt: "accepted" },
        [row({ expiresAt: new Date(now).toISOString() })],
        "basic",
        now,
      ),
    ).toBe(false);
    expect(canTrade({ termsAcceptedAt: "accepted" }, [row()], "basic", now)).toBe(true);
  });
  it("requires full approval matching the current basic type", () => {
    const profile = { termsAcceptedAt: "accepted" };
    expect(canTrade(profile, [row(), row({ level: "full", type: "business" })], "full", now)).toBe(
      false,
    );
    expect(canTrade(profile, [row(), row({ level: "full" })], "full", now)).toBe(true);
    expect(
      canTrade(profile, [row({ status: "superseded" }), row({ level: "full" })], "full", now),
    ).toBe(false);
  });
  it("keeps an existing approval usable during resubmission and distinguishes expiry", () => {
    expect(
      levelState([row({ status: "pending_review" }), row()], "basic", undefined, now).status,
    ).toBe("approved");
    expect(
      levelState([row({ expiresAt: new Date(now - 1).toISOString() })], "basic", undefined, now)
        .status,
    ).toBe("expired");
  });
});
describe("Private verification upload constraints", () => {
  it("allows the 3 MiB boundary and rejects larger or unsupported files", () => {
    expect(() =>
      validateDocument(
        new File([new Uint8Array(MAX_UPLOAD_BYTES)], "doc.pdf", { type: "application/pdf" }),
      ),
    ).not.toThrow();
    expect(() =>
      validateDocument(
        new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "doc.pdf", { type: "application/pdf" }),
      ),
    ).toThrow("3 MiB");
    expect(() => validateDocument(new File(["text"], "doc.txt", { type: "text/plain" }))).toThrow(
      "JPEG",
    );
    expect(() => validateDocument(new File([], "empty.png", { type: "image/png" }))).toThrow(
      "non-empty",
    );
  });
});
