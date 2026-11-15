import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard, Orders, Requests } from "@/components/api/account-pages";
import { Partner } from "@/components/api/other-pages";
const state = vi.hoisted(() => ({
  role: "buyer",
  mode: "buyer",
  akubin: false,
  paths: [] as string[],
}));
vi.mock("@/lib/api/hooks/use-api", () => ({
  useProfile: () => ({
    data: {
      id: "member",
      preferences: { marketRole: state.role, activeMode: state.mode, akubin: state.akubin },
    },
  }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  Navigate: ({ to }: { to: string }) => <p>Workspace destination: {to}</p>,
  useRouter: () => ({}),
}));
vi.mock("@/components/api/data-view", () => ({
  ResourcePage: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
  Summary: ({ fields }: { fields: { label: string }[] }) => (
    <div>
      {fields.map((f) => (
        <span key={f.label}>{f.label}</span>
      ))}
    </div>
  ),
  DataTable: ({ title, path }: { title: string; path: string }) => (
    <section>
      <h2>{title}</h2>
      <span>{path}</span>
    </section>
  ),
  ActionForm: ({ title, embedded }: { title: string; embedded?: boolean }) =>
    embedded ? <form aria-label={title} /> : <h2>{title}</h2>,
  ActionButton: () => null,
  QueryState: () => null,
  useResource: (path: string) => {
    state.paths.push(path);
    return {};
  },
  PrivateImage: () => null,
}));
afterEach(cleanup);
beforeEach(() => {
  state.paths = [];
  state.akubin = false;
  state.role = "buyer";
  state.mode = "buyer";
});
describe("Account workspaces", () => {
  it.each(["buyer", "seller", "both"])(
    "%s workspace shows and hides recycling without changing role",
    (role) => {
      state.role = role;
      const view = render(<Dashboard />);
      expect(
        screen.queryByRole("region", { name: "AkuBin in your workspace" }),
      ).not.toBeInTheDocument();
      state.akubin = true;
      view.rerender(<Dashboard />);
      expect(screen.getByRole("region", { name: "AkuBin in your workspace" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "View recycling" })).toBeInTheDocument();
      state.akubin = false;
      view.rerender(<Dashboard />);
      expect(
        screen.queryByRole("region", { name: "AkuBin in your workspace" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: role === "seller" ? "Seller dashboard" : "Buyer dashboard",
        }),
      ).toBeInTheDocument();
    },
  );
  it("logistics workspace has the same independent recycling visibility", () => {
    state.role = "logistics";
    state.akubin = true;
    const view = render(<Partner />);
    expect(screen.getByRole("region", { name: "AkuBin in your workspace" })).toBeInTheDocument();
    state.akubin = false;
    view.rerender(<Partner />);
    expect(
      screen.queryByRole("region", { name: "AkuBin in your workspace" }),
    ).not.toBeInTheDocument();
  });
  it("buyers see purchases, outgoing activity and buying actions", () => {
    render(<Dashboard />);
    expect(screen.getByRole("heading", { name: "Buyer dashboard" })).toBeInTheDocument();
    expect(screen.getByText("/orders?mode=buyer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse materials" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create listing" })).not.toBeInTheDocument();
    expect(screen.queryByText("Incoming offers")).not.toBeInTheDocument();
  });
  it("sellers see sales, incoming offers and stock actions even with an outdated buyer mode", () => {
    state.role = "seller";
    render(<Dashboard />);
    expect(screen.getByRole("heading", { name: "Seller dashboard" })).toBeInTheDocument();
    expect(screen.getByText("/orders?mode=seller")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create listing" })).toBeInTheDocument();
    expect(screen.getByText("Incoming offers")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Browse materials" })).not.toBeInTheDocument();
  });
  it("Both follows the selected workspace when requesting orders", () => {
    state.role = "both";
    state.mode = "seller";
    render(<Orders />);
    expect(
      state.paths.some(
        (path) =>
          path.startsWith("/orders?") &&
          new URL(path, "http://localhost").searchParams.get("mode") === "seller",
      ),
    ).toBe(true);
  });
  it("buyers post and manage demand without supplier response controls", () => {
    render(<Requests />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New request" }));
    expect(screen.getByRole("heading", { name: "Post a buyer request" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Open buyer requests" })).not.toBeInTheDocument();
  });
  it("sellers browse demand without posting buyer requests", () => {
    state.role = "seller";
    render(<Requests />);
    expect(screen.getByRole("heading", { name: "Open buyer requests" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Post a buyer request" })).not.toBeInTheDocument();
  });
  it.each([
    ["logistics", "/app/partner"],
    ["recycler", "/onboarding"],
    ["none", "/onboarding"],
  ])("routes %s accounts to the right workspace", (role, destination) => {
    state.role = role;
    render(<Dashboard />);
    expect(screen.getByText("Workspace destination: " + destination)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create listing" })).not.toBeInTheDocument();
  });
});
