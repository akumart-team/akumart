import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataTable } from "@/components/api/data-view";
import { ApiError } from "@/lib/api/client";
import { field } from "@/lib/api/services/resources";
const fixture = vi.hoisted(() => ({ user: "first-user", read: vi.fn() }));
vi.mock("@/lib/api/hooks/use-api", () => ({
  apiKeys: { profile: ["api", "profile"] },
  useApiSession: () => ({ data: { user: { id: fixture.user } }, isSuccess: true }),
  useClientReady: () => true,
}));
vi.mock("@/components/gate", () => ({ useTradeGate: () => vi.fn() }));
vi.mock("@/lib/api/services/resources", async (original) => ({
  ...(await original<typeof import("@/lib/api/services/resources")>()),
  readResource: fixture.read,
}));
const columns = [{ key: "title", label: "Title" }];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <DataTable path="/listings" title="Listings" access="public" columns={columns} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  fixture.user = "first-user";
  fixture.read.mockReset();
});
afterEach(cleanup);
describe("Live page data states", () => {
  it("shows an empty backend result without inserting demo products", async () => {
    fixture.read.mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, total: 0 } });
    mount();
    expect(await screen.findByText("No records yet.")).toBeInTheDocument();
    expect(screen.queryByText("Clear PET bottle bales")).not.toBeInTheDocument();
  });
  it("shows provider errors instead of reporting an empty catalogue", async () => {
    fixture.read.mockRejectedValue(new ApiError(403, "Access denied by backend."));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("Access denied by backend.");
    expect(screen.queryByText("No records yet.")).not.toBeInTheDocument();
  });
  it("requests the next server page instead of paginating a local seed", async () => {
    fixture.read.mockImplementation((path: string) =>
      Promise.resolve({
        data: [
          { id: path, title: path.includes("page=2") ? "Second page item" : "First page item" },
        ],
        pagination: { page: path.includes("page=2") ? 2 : 1, limit: 20, total: 21 },
      }),
    );
    mount();
    await screen.findByText("First page item");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Second page item")).toBeInTheDocument();
    await waitFor(() =>
      expect(fixture.read).toHaveBeenCalledWith("/listings?page=2&limit=20", "public"),
    );
  });
  it("reads nested attachment IDs without dropping array entries", () => {
    expect(field({ images: [{ uploadId: "private-file" }] }, "images.0.uploadId")).toBe(
      "private-file",
    );
  });
});
describe("Retired browser demo database", () => {
  it("does not restore old listings or plaintext demo passwords", async () => {
    vi.resetModules();
    localStorage.setItem(
      "akumart-demo-db-v3",
      JSON.stringify({
        version: 4,
        users: [{ password: "old-demo-password" }],
        listings: [{ title: "Fake product" }],
      }),
    );
    const store = await import("@/lib/store");
    store.hydrateStore();
    expect(store.getDB().listings).toEqual([]);
    expect(store.getDB().users).toEqual([]);
    expect(localStorage.getItem("akumart-demo-db-v3")).toBeNull();
  });
});
