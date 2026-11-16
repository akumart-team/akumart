import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListingSaveButton } from "@/components/api/listing-save-button";
const state = vi.hoisted(() => ({
  user: "buyer" as string | undefined,
  role: "buyer",
  mode: "buyer",
  ids: [] as string[],
  read: vi.fn(),
  write: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@/lib/api/hooks/use-api", () => ({
  useProfile: () => ({
    data: state.user
      ? { id: state.user, preferences: { marketRole: state.role, activeMode: state.mode } }
      : undefined,
  }),
  useApiSession: () => ({
    data: state.user ? { user: { id: state.user } } : null,
    isPending: false,
  }),
}));
vi.mock("@/lib/api/services/resources", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/services/resources")>()),
  readResource: state.read,
  writeResource: state.write,
}));
vi.mock("sonner", () => ({ toast: { success: state.success, error: state.error } }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
const clients: QueryClient[] = [];
beforeEach(() => {
  state.user = "buyer";
  state.role = "buyer";
  state.mode = "buyer";
  state.ids = [];
  vi.clearAllMocks();
  state.read.mockImplementation(async (path: string) => {
    const page = Number(new URL(path, "http://test").searchParams.get("page"));
    return {
      data: state.ids.slice((page - 1) * 100, page * 100).map((id) => ({ id })),
      pagination: { total: state.ids.length },
    };
  });
  state.write.mockImplementation(async (path: string, method: string) => {
    const id = path.split("/").at(-1)!;
    state.ids = method === "PUT" ? [...state.ids, id] : state.ids.filter((value) => value !== id);
    return { data: { saved: method === "PUT" } };
  });
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});
function show(children: React.ReactNode = <ListingSaveButton id="listing" sellerId="supplier" />) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}
describe("listing bookmarks", () => {
  it("hides bookmarks for your own listings", () => {
    show(<ListingSaveButton id="listing" sellerId="buyer" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(state.read).not.toHaveBeenCalled();
  });
  it.each(["seller", "recycler", "logistics", "none"])(
    "hides bookmarks for %s accounts",
    (role) => {
      state.role = role;
      show();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(state.read).not.toHaveBeenCalled();
    },
  );
  it("requires buyer mode for a Buyer & Seller account", async () => {
    state.role = "both";
    state.mode = "seller";
    const view = show();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    view.unmount();
    state.mode = "buyer";
    show();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save listing" })).toBeEnabled());
  });
  it("lets guests sign in without loading private saved items", () => {
    state.user = undefined;
    show();
    expect(screen.getByRole("link", { name: "Sign in to save listing" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(state.read).not.toHaveBeenCalled();
  });
  it("loads saved state beyond the first page", async () => {
    state.ids = [...Array.from({ length: 100 }, (_, i) => String(i)), "listing"];
    show();
    expect(await screen.findByRole("button", { name: "Remove from saved" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(state.read).toHaveBeenCalledTimes(2);
  });
  it("shares saved queries across cards and updates both after save/remove", async () => {
    show(
      <>
        <ListingSaveButton id="listing" sellerId="supplier" />
        <ListingSaveButton id="listing" sellerId="supplier" />
      </>,
    );
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Save listing" })[0]).toBeEnabled(),
    );
    expect(state.read).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByRole("button", { name: "Save listing" })[0]);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Remove from saved" })[0]).toBeEnabled(),
    );
    expect(state.write).toHaveBeenLastCalledWith("/users/me/saved-listings/listing", "PUT");
    fireEvent.click(screen.getAllByRole("button", { name: "Remove from saved" })[0]);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Save listing" })[0]).toBeEnabled(),
    );
    expect(state.write).toHaveBeenLastCalledWith("/users/me/saved-listings/listing", "DELETE");
  });
  it("preserves state and reports a failed save", async () => {
    state.write.mockRejectedValueOnce(new Error("Unavailable"));
    show();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save listing" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save listing" }));
    await waitFor(() => expect(state.error).toHaveBeenCalledWith("Unavailable"));
    expect(screen.getByRole("button", { name: "Save listing" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(state.success).not.toHaveBeenCalled();
  });
  it("offers retry when saved state cannot be loaded", async () => {
    state.read.mockRejectedValueOnce(new Error("Unavailable"));
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Retry saved listings" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save listing" })).toBeEnabled());
    expect(state.write).not.toHaveBeenCalled();
  });
});
