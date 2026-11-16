import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarketplaceActions } from "@/components/api/marketplace-actions";
import { ListingEditor, OwnListings } from "@/components/api/account-pages";
const state = vi.hoisted(() => ({ user: true, role: "buyer", mode: "buyer", pending: false }));
vi.mock("@/lib/api/hooks/use-api", () => ({
  useApiSession: () => ({
    data: state.user ? { user: { id: "user" } } : null,
    isPending: state.pending,
  }),
  useProfile: () => ({
    data: state.user
      ? { id: "user", preferences: { marketRole: state.role, activeMode: state.mode } }
      : undefined,
    isError: false,
  }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  useRouter: () => ({ navigate: vi.fn() }),
  Navigate: () => null,
}));
vi.mock("@/components/gate", () => ({ useTradeGate: () => vi.fn() }));
vi.mock("@/components/api/data-view", () => ({
  useResource: () => ({}),
  ResourcePage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ActionForm: () => null,
  ActionButton: () => null,
  DataTable: () => null,
  QueryState: () => null,
  Summary: () => null,
  PrivateImage: () => null,
}));
beforeEach(() => {
  state.user = true;
  state.role = "buyer";
  state.mode = "buyer";
  state.pending = false;
});
afterEach(cleanup);
describe("marketplace role actions", () => {
  it("shows buyers only the buyer request action", () => {
    render(<MarketplaceActions />);
    expect(screen.getByRole("link", { name: "Post a buyer request" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sell your materials" })).not.toBeInTheDocument();
  });
  it("shows sellers selling and request discovery", () => {
    state.role = "seller";
    state.mode = "seller";
    render(<MarketplaceActions />);
    expect(screen.getByRole("link", { name: "Sell your materials" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find buyer requests" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Post a buyer request" })).not.toBeInTheDocument();
  });
  it.each(["buyer", "seller"])("follows %s mode for dual accounts", (mode) => {
    state.role = "both";
    state.mode = mode;
    render(<MarketplaceActions />);
    expect(
      screen.getByRole("link", {
        name: mode === "buyer" ? "Post a buyer request" : "Sell your materials",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: mode === "buyer" ? "Sell your materials" : "Post a buyer request",
      }),
    ).not.toBeInTheDocument();
  });
  it.each(["recycler", "logistics", "none"])("hides trading actions for %s", (role) => {
    state.role = role;
    render(<MarketplaceActions />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("prompts guests to sign in", () => {
    state.user = false;
    render(<MarketplaceActions />);
    expect(screen.getByRole("link", { name: "Sign in to trade" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
  it("blocks buyer direct access to the listing editor", () => {
    render(<ListingEditor />);
    expect(screen.getByRole("alert")).toHaveTextContent("Seller access required");
    expect(
      screen.queryByRole("button", { name: "Continue to listing form" }),
    ).not.toBeInTheDocument();
  });
  it("blocks buyer direct access to own listings", () => {
    render(<OwnListings />);
    expect(screen.getByRole("alert")).toHaveTextContent("Seller access required");
    expect(screen.queryByRole("link", { name: "Create listing" })).not.toBeInTheDocument();
  });
  it("keeps verification gating for sellers", () => {
    state.role = "seller";
    state.mode = "seller";
    render(<ListingEditor />);
    expect(screen.getByRole("button", { name: "Continue to listing form" })).toBeInTheDocument();
  });
});
