import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PointsSummary } from "@/components/api/points-summary";
const state = vi.hoisted(() => ({ data: {} as Record<string, unknown>, paths: [] as string[] }));
vi.mock("@/components/api/data-view", () => ({
  useResource: (path: string) => {
    state.paths.push(path);
    return { data: state.data };
  },
  QueryState: ({ children }: { children: (data: unknown) => React.ReactNode }) =>
    children(state.data),
}));
beforeEach(() => {
  state.data = {
    balancePoints: "70",
    balanceValueNaira: "1400.00",
    lifetimeEarnedPoints: "100",
    lifetimeEarnedValueNaira: "2000.00",
    pointValueNaira: "20",
    weightKg: "4",
    verifiedDepositCount: 2,
  };
  state.paths = [];
});
afterEach(cleanup);
describe("points equivalents", () => {
  it("shows available and lifetime equivalents with a current-rate label", () => {
    render(<PointsSummary showVerified />);
    expect(screen.getByText(/1,400.00/)).toBeInTheDocument();
    expect(screen.getByText(/2,000.00/)).toBeInTheDocument();
    expect(screen.getByText(/1 point =.*20.00/)).toBeInTheDocument();
    expect(screen.getByText("Available points")).toBeInTheDocument();
    expect(screen.getByText("Lifetime points")).toBeInTheDocument();
  });
  it("shows zero equivalent without treating it as missing", () => {
    state.data.balancePoints = "0";
    state.data.balanceValueNaira = "0.00";
    render(<PointsSummary walletOnly />);
    expect(screen.getByText(/\u20a60\.00/)).toBeInTheDocument();
    expect(state.paths).toEqual(["/akubin/me/wallet"]);
    expect(screen.queryByText("Lifetime points")).not.toBeInTheDocument();
  });
  it("preserves points when conversion is unavailable without assuming a rate", () => {
    state.data.balanceValueNaira = null;
    state.data.lifetimeEarnedValueNaira = null;
    state.data.pointValueNaira = null;
    render(<PointsSummary />);
    expect(screen.getByText("70")).toBeInTheDocument();
    expect(screen.getAllByText("Equivalent value unavailable")).toHaveLength(2);
    expect(screen.queryByText(/1 point =/)).not.toBeInTheDocument();
  });
});
