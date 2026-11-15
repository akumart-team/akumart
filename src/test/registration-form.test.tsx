import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationForm } from "@/components/registration-form";
import {
  accountHome,
  signInHome,
  hasLogisticsWorkspace,
  tradingMode,
} from "@/lib/api/account-roles";
const send = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/services/auth", () => ({ register: send }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
afterEach(cleanup);
beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ message: "Check your email" });
});
function fill() {
  for (const [label, value] of [
    ["First name", "  Ada  "],
    ["Last name", "Obi"],
    ["Display name", "  Ada Recycles  "],
    ["Email", "ADA@example.test"],
    ["Phone number", "+2348012345678"],
    ["City", "Lagos"],
    ["Password", "Test-only-pass123"],
    ["Confirm password", "Test-only-pass123"],
  ])
    fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
  fireEvent.click(screen.getByRole("checkbox", { name: /I accept/ }));
}
describe("Compulsory account setup", () => {
  it.each(["buyer", "seller", "both"] as const)(
    "%s has no logistics workspace without an approved business",
    (marketRole) => {
      const preferences = { marketRole, activeMode: "buyer" as const, akubin: true };
      expect(hasLogisticsWorkspace({ preferences, partner: null })).toBe(false);
      expect(
        hasLogisticsWorkspace({
          preferences,
          partner: { id: "partner", status: "pending_review" },
        }),
      ).toBe(false);
      expect(
        hasLogisticsWorkspace({ preferences, partner: { id: "partner", status: "approved" } }),
      ).toBe(true);
    },
  );
  it("the logistics role sees its application workspace before approval", () => {
    expect(
      hasLogisticsWorkspace({
        preferences: { marketRole: "logistics", activeMode: null, akubin: false },
        partner: null,
      }),
    ).toBe(true);
  });
  it.each([
    ["super", "/admin"],
    ["operations", "/admin"],
    ["support", "/admin/support"],
    ["finance", "/admin/finance"],
    ["content", "/admin/content"],
  ] as const)("sends active %s staff to their console", (role, destination) => {
    expect(
      signInHome({
        staff: { role, active: true },
        preferences: { marketRole: "buyer", activeMode: "buyer", akubin: false },
      }),
    ).toBe(destination);
  });
  it("inactive staff follow their customer role instead of entering administration", () => {
    expect(
      signInHome({
        staff: { role: "finance", active: false },
        preferences: { marketRole: "seller", activeMode: "seller", akubin: false },
      }),
    ).toBe("/app/dashboard");
  });
  it("offers four signup choices without Logistics Partner", () => {
    render(<RegistrationForm onRegistered={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getByRole("combobox")).toBeRequired();
    expect(screen.getAllByRole("option")).toHaveLength(5);
    expect(screen.queryByRole("option", { name: /Logistics/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Show AkuBin/ })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Recycle & Earn/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /^none$/i })).not.toBeInTheDocument();
    for (const label of [
      "First name",
      "Last name",
      "Display name",
      "Email",
      "Phone number",
      "City",
      "Password",
      "Confirm password",
    ])
      expect(screen.getByLabelText(label, { exact: true })).toBeRequired();
  });
  it("rejects a missing role even when native validation is bypassed", () => {
    render(<RegistrationForm onRegistered={vi.fn()} />);
    fill();
    fireEvent.submit(screen.getByRole("form", { name: "Create account" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose how");
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects mismatched passwords before requesting an email", () => {
    render(<RegistrationForm onRegistered={vi.fn()} />);
    fill();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "buyer" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "Another-password" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Create account" }));
    expect(screen.getByRole("alert")).toHaveTextContent("do not match");
    expect(send).not.toHaveBeenCalled();
  });
  it.each(["buyer", "seller", "both", "recycler"])(
    "sends a normalized %s signup without password confirmation",
    async (role) => {
      const onRegistered = vi.fn();
      render(<RegistrationForm onRegistered={onRegistered} />);
      fill();
      fireEvent.change(screen.getByRole("combobox"), { target: { value: role } });
      fireEvent.submit(screen.getByRole("form", { name: "Create account" }));
      await waitFor(() =>
        expect(send).toHaveBeenCalledWith({
          firstName: "Ada",
          lastName: "Obi",
          displayName: "Ada Recycles",
          email: "ada@example.test",
          phone: "+2348012345678",
          city: "Lagos",
          marketRole: role,
          akubin: true,
          password: "Test-only-pass123",
          acceptedTerms: true,
        }),
      );
      await waitFor(() =>
        expect(onRegistered).toHaveBeenCalledWith("ada@example.test", "Check your email"),
      );
    },
  );
  it.each(["buyer", "seller", "both"])(
    "includes AkuBin for %s without changing role",
    async (role) => {
      render(<RegistrationForm onRegistered={vi.fn()} />);
      fill();
      fireEvent.change(screen.getByRole("combobox"), { target: { value: role } });
      fireEvent.submit(screen.getByRole("form", { name: "Create account" }));
      await waitFor(() =>
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({ marketRole: role, akubin: true }),
        ),
      );
    },
  );
  it("uses service-specific destinations without treating a partner preference as approval", () => {
    expect(accountHome("logistics")).toBe("/app/partner");
    expect(accountHome("recycler")).toBe("/app/akubin");
    expect(accountHome("seller")).toBe("/app/dashboard");
    expect(accountHome("none")).toBe("/app/dashboard");
  });
  it("recycling-first accounts include AkuBin without a trading mode or duplicate checkbox", () => {
    render(<RegistrationForm onRegistered={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "recycler" } });
    expect(screen.queryByRole("checkbox", { name: /Show AkuBin/ })).not.toBeInTheDocument();
    expect(screen.getByText(/AkuBin is included/)).toBeInTheDocument();
    expect(tradingMode({ marketRole: "recycler", activeMode: null })).toBeNull();
    expect(
      signInHome({
        staff: null,
        preferences: { marketRole: "recycler", activeMode: null, akubin: true },
      }),
    ).toBe("/app/akubin");
  });
});
