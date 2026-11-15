import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VerificationPage } from "@/components/verification-page";
import { VerificationReview } from "@/components/verification-review";
const state = vi.hoisted(() => ({
  rows: [] as unknown[],
  profile: {
    id: "owner",
    email: "owner@example.com",
    termsAcceptedAt: "accepted",
    staff: { active: true, role: "operations" },
  },
  submit: vi.fn(),
  upload: vi.fn(),
  decision: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ history: { push: vi.fn() } }) }));
vi.mock("@/lib/store", () => ({ setIntent: vi.fn(), useDB: () => null }));
vi.mock("@/lib/api/hooks/use-api", () => ({
  useProfile: () => ({ data: state.profile, isPending: false, isError: false }),
  useVerification: () => ({ data: state.rows, isPending: false, isError: false }),
  useSubmitVerification: () => ({ mutateAsync: state.submit }),
  useDecision: () => ({ mutateAsync: state.decision, isPending: false }),
  useReviewQueue: () => ({
    data: { data: state.rows, pagination: { total: state.rows.length } },
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/lib/api/services/uploads", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/services/uploads")>()),
  uploadVerificationDocument: state.upload,
}));
beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  state.rows = [];
  vi.clearAllMocks();
  state.upload.mockResolvedValue("real-upload-id");
  state.submit.mockResolvedValue({ data: {} });
});
afterEach(cleanup);
describe("Verification screens consume backend workflow", () => {
  it("requires a real document even for basic and submits its upload ID", async () => {
    render(<VerificationPage />);
    fireEvent.click(screen.getByRole("button", { name: "Start basic verification" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("at least one");
    expect(state.submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Supporting documents"), {
      target: { files: [new File(["image"], "evidence.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Submit for staff review" }));
    await waitFor(() =>
      expect(state.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "basic",
          type: "individual",
          documents: [{ uploadId: "real-upload-id", kind: "identity" }],
        }),
      ),
    );
    expect(await screen.findByText(/Submitted for staff review/)).toBeInTheDocument();
    expect(screen.queryByText("Demo result to simulate")).not.toBeInTheDocument();
  });
  it("keeps full verification locked until basic is approved", () => {
    render(<VerificationPage />);
    expect(screen.getByRole("button", { name: "Complete basic first" })).toBeDisabled();
  });
  it("reuses the private upload when a failed submission is retried", async () => {
    state.submit.mockRejectedValueOnce(new Error("Submission temporarily unavailable"));
    render(<VerificationPage />);
    fireEvent.click(screen.getByRole("button", { name: "Start basic verification" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByLabelText("Supporting documents"), {
      target: { files: [new File(["image"], "evidence.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Submit for staff review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Submission temporarily unavailable",
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit for staff review" }));
    await screen.findByText(/Submitted for staff review/);
    expect(state.upload).toHaveBeenCalledTimes(1);
    expect(state.submit).toHaveBeenCalledTimes(2);
    expect(state.submit.mock.calls[1][0].documents).toEqual([
      { uploadId: "real-upload-id", kind: "identity" },
    ]);
  });
  it("uses the approved basic type for full verification and hides the form initially", () => {
    state.rows = [
      {
        id: "approved",
        profileId: "owner",
        level: "basic",
        type: "business",
        status: "approved",
        data: {},
        documents: [],
        events: [],
        createdAt: "2026-11-15",
      },
    ];
    render(<VerificationPage />);
    expect(
      screen.queryByRole("region", { name: "Verification application" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start full verification" }));
    expect(screen.getByRole("button", { name: /registered organisation/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /registered organisation/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
  it("shows backend pending status without a client approval action", () => {
    state.rows = [
      {
        id: "submission",
        profileId: "owner",
        level: "basic",
        type: "individual",
        status: "pending_review",
        data: {},
        documents: [],
        events: [],
        createdAt: "2026-11-15",
      },
    ];
    render(<VerificationPage />);
    expect(screen.getByText("Pending staff review")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit for staff review" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });
  it("does not expose staff decisions on the staff member’s own submission", () => {
    state.rows = [
      {
        id: "self",
        profileId: "owner",
        level: "basic",
        type: "individual",
        status: "pending_review",
        data: {},
        documents: [],
        events: [],
      },
    ];
    render(<VerificationReview />);
    expect(screen.getByText("You cannot review your own verification.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });
});
