import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "@/components/sign-out-button";

const state = vi.hoisted(() => ({ logout: vi.fn(), navigate: vi.fn(), pending: false }));
vi.mock("@/lib/api/hooks/use-api", () => ({
  useLogout: () => ({ mutateAsync: state.logout, isPending: state.pending }),
}));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ navigate: state.navigate }) }));
beforeEach(() => {
  state.logout.mockReset().mockResolvedValue(undefined);
  state.navigate.mockReset().mockResolvedValue(undefined);
  state.pending = false;
});
afterEach(cleanup);
function open() {
  render(<SignOutButton />);
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  return screen.getByRole("alertdialog", { name: "Sign out of AkuMart?" });
}
describe("Sign-out confirmation", () => {
  it("opening and cancelling does not log out or navigate", () => {
    const dialog = open();
    expect(state.logout).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Stay signed in" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(state.logout).not.toHaveBeenCalled();
    expect(state.navigate).not.toHaveBeenCalled();
  });
  it("only confirmation calls logout and returns to login", async () => {
    const dialog = open();
    fireEvent.click(within(dialog).getByRole("button", { name: "Yes, sign out" }));
    await waitFor(() =>
      expect(state.navigate).toHaveBeenCalledWith({ to: "/login", replace: true }),
    );
    expect(state.logout).toHaveBeenCalledTimes(1);
  });
  it("keeps the dialog open and shows a backend error without navigating", async () => {
    state.logout.mockRejectedValue(new Error("Could not sign out. Try again."));
    const dialog = open();
    fireEvent.click(within(dialog).getByRole("button", { name: "Yes, sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not sign out. Try again.");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(state.navigate).not.toHaveBeenCalled();
  });
  it("disables confirmation and cancellation while logout is pending", () => {
    const view = render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    state.pending = true;
    view.rerender(<SignOutButton />);
    expect(screen.getByRole("button", { name: "Signing out…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Stay signed in" })).toBeDisabled();
    expect(state.logout).not.toHaveBeenCalled();
  });
});
