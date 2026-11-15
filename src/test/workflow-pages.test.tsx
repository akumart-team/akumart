import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Requests } from "@/components/api/requests-page";
import { RequestResponses } from "@/components/api/request-responses";
import { decimalLabel, nairaLabel } from "@/lib/api/display";
const fixture = vi.hoisted(() => ({ role: "buyer", read: vi.fn(), write: vi.fn() }));
vi.mock("@/lib/api/hooks/use-api", () => ({
  apiKeys: { profile: ["api", "profile"] },
  useClientReady: () => true,
  useApiSession: () => ({ data: { user: { id: "member" } }, isSuccess: true }),
  useProfile: () => ({
    data: {
      id: "member",
      city: "Lagos",
      preferences: { marketRole: fixture.role, activeMode: fixture.role },
    },
  }),
}));
vi.mock("@/components/gate", () => ({
  useTradeGate: () => async (_intent: unknown, run: () => Promise<void>) => run(),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  Navigate: () => null,
}));
vi.mock("@/lib/api/services/resources", async (original) => ({
  ...(await original<typeof import("@/lib/api/services/resources")>()),
  readResource: fixture.read,
  writeResource: fixture.write,
}));
const request = {
  id: "request-id",
  buyerId: "member",
  title: "Clean PET bottles",
  material: "plastic",
  city: "Lagos",
  quantity: "500",
  unit: "kg",
  maxUnitPrice: "1000",
  needBy: "2027-01-15T00:00:00Z",
  status: "open",
  responses: [],
};
const response = {
  id: "response-id",
  sellerId: "member",
  quantity: "100",
  unitPrice: "900",
  note: "Sorted material ready for collection",
  status: "shortlisted",
  createdAt: "2026-11-15T12:00:00Z",
  updatedAt: "2026-11-15T12:00:00Z",
};
function mount(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}
beforeEach(() => {
  fixture.role = "buyer";
  fixture.read.mockReset();
  fixture.write.mockReset();
  fixture.read.mockResolvedValue({ data: [request], pagination: { page: 1, limit: 12, total: 1 } });
  fixture.write.mockResolvedValue({ data: { id: "new-request" } });
});
afterEach(cleanup);
describe("Responsive trading workflow behaviour", () => {
  it("renders a real request as a card with precise price and a focused response action", async () => {
    mount(<Requests />);
    const card = await screen.findByRole("article", { name: "Clean PET bottles" });
    expect(within(card).getByText("₦1,000.00")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "View responses" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("creates through the endpoint with decimal strings and closes the form after success", async () => {
    mount(<Requests />);
    fireEvent.click(screen.getByRole("button", { name: "New request" }));
    const dialog = screen.getByRole("dialog");
    for (const [label, value] of [
      ["Request title", "Metal for collection"],
      ["Quantity needed", "1.250"],
      ["Maximum price per unit (₦)", "20.50"],
      ["Needed by", "2027-01-15"],
    ])
      fireEvent.change(within(dialog).getByLabelText(label, { exact: true }), {
        target: { value },
      });
    fireEvent.change(within(dialog).getByLabelText("Material", { exact: true }), {
      target: { value: "metal" },
    });
    fireEvent.submit(within(dialog).getByRole("form", { name: "Post a buyer request" }));
    await waitFor(() =>
      expect(fixture.write).toHaveBeenCalledWith(
        "/buyer-requests",
        "POST",
        {
          title: "Metal for collection",
          material: "metal",
          quantity: "1.250",
          unit: "kg",
          maxUnitPrice: "20.50",
          city: "Lagos",
          needBy: "2027-01-15",
        },
        "private",
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByRole("status")).toHaveTextContent("Your request is live");
  });
  it("seller sees an existing response instead of a duplicate submission form", async () => {
    fixture.role = "seller";
    fixture.read.mockImplementation((path: string) =>
      Promise.resolve(
        path.startsWith("/buyer-requests/request-id")
          ? { data: { ...request, buyerId: "another-member", responses: [response] } }
          : {
              data: [{ ...request, buyerId: "another-member" }],
              pagination: { total: 1, page: 1, limit: 12 },
            },
      ),
    );
    mount(<Requests />);
    fireEvent.click(await screen.findByRole("button", { name: "View & respond" }));
    expect(await screen.findByRole("heading", { name: "Your response" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send response" })).not.toBeInTheDocument();
  });
  it("only the owner receives shortlist and decline controls in the response dialog", async () => {
    fixture.read.mockResolvedValue({
      data: { ...request, buyerId: "different-buyer", responses: [response] },
    });
    mount(<RequestResponses id="request-id" />);
    fireEvent.click(screen.getByRole("button", { name: "View responses" }));
    await screen.findByText("Sorted material ready for collection");
    expect(screen.queryByRole("button", { name: "Shortlist response" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decline response" })).not.toBeInTheDocument();
  });
  it.each(["sent", "declined"])(
    "seller can revise a %s response using the current version",
    async (status) => {
      fixture.role = "seller";
      fixture.read.mockImplementation((path: string) =>
        Promise.resolve(
          path.startsWith("/buyer-requests/request-id")
            ? { data: { ...request, buyerId: "buyer", responses: [{ ...response, status }] } }
            : {
                data: [{ ...request, buyerId: "buyer" }],
                pagination: { total: 1, page: 1, limit: 12 },
              },
        ),
      );
      mount(<Requests />);
      fireEvent.click(await screen.findByRole("button", { name: "View & respond" }));
      fireEvent.click(
        await screen.findByRole("button", {
          name: status === "sent" ? "Edit response" : "Send revised response",
        }),
      );
      const form = screen.getByRole("form", {
        name: status === "sent" ? "Edit supplier response" : "Send supplier response",
      });
      fireEvent.change(within(form).getByLabelText("Quantity you can supply"), {
        target: { value: "125.250" },
      });
      fireEvent.submit(form);
      await waitFor(() =>
        expect(fixture.write).toHaveBeenCalledWith(
          "/buyer-requests/request-id/responses" + (status === "sent" ? "/response-id/terms" : ""),
          status === "sent" ? "PATCH" : "POST",
          {
            unitPrice: "900",
            quantity: "125.250",
            note: response.note,
            expectedUpdatedAt: response.updatedAt,
          },
          "private",
        ),
      );
    },
  );
  it("search sends server search and resets to the first page", async () => {
    mount(<Requests />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search requests" }), {
      target: { value: "Lagos" },
    });
    fireEvent.submit(screen.getByRole("search", { name: "Search requests" }));
    await waitFor(() =>
      expect(fixture.read).toHaveBeenCalledWith(
        "/users/me/buyer-requests?page=1&limit=12&search=Lagos",
        "private",
      ),
    );
  });
  it("formats large decimal values without rounding them through floating point", () => {
    expect(nairaLabel("999999999999.99")).toBe("₦999,999,999,999.99");
    expect(decimalLabel("1000.125")).toBe("1,000.125");
  });
});
