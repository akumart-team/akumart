import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Settings } from "@/components/api/account-pages";
import { afterConfirmation } from "@/lib/api/account-roles";
import type { Profile } from "@/lib/api/types";

const state = vi.hoisted(() => ({
  profile: {} as Record<string, unknown>,
  read: vi.fn(),
  write: vi.fn(),
}));
vi.mock("@/lib/api/hooks/use-api", () => ({
  apiKeys: { profile: ["api", "profile"] },
  useClientReady: () => true,
  useApiSession: () => ({ isSuccess: true, data: { user: { id: "member" } } }),
  useProfile: () => ({ data: state.profile }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  Navigate: () => null,
  useRouter: () => ({ history: { push: vi.fn() } }),
}));
vi.mock("@/components/gate", () => ({
  useTradeGate: () => async (_intent: unknown, run: () => Promise<void>) => run(),
}));
vi.mock("@/lib/api/services/resources", async (original) => ({
  ...(await original<typeof import("@/lib/api/services/resources")>()),
  readResource: state.read,
  writeResource: state.write,
}));
const complete = {
  id: "member",
  email: "member@example.test",
  firstName: "Ada",
  lastName: "Obi",
  displayName: "Ada Recycles",
  phone: "+2348012345678",
  city: "Lagos",
  termsAcceptedAt: "2026-11-15T12:00:00Z",
  profileCompleted: true,
  staff: null,
  preferences: { marketRole: "recycler", activeMode: null, akubin: false },
} satisfies Profile;
function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <Settings />
    </QueryClientProvider>,
  );
}
afterEach(cleanup);
beforeEach(() => {
  state.profile = { ...complete };
  state.read.mockReset();
  state.write.mockReset();
  state.read.mockImplementation(async () => ({ data: state.profile }));
  state.write.mockImplementation(async (_path, _method, data) => {
    state.profile = { ...state.profile, ...data, updatedAt: "2026-11-15T12:01:00Z" };
    return { data: state.profile };
  });
});
describe("Verified account setup", () => {
  it.each([
    ["buyer", "/app/dashboard"],
    ["seller", "/app/dashboard"],
    ["both", "/app/dashboard"],
    ["recycler", "/app/akubin"],
    ["logistics", "/app/partner"],
  ] as const)("sends complete %s signup to its workspace", (role, destination) => {
    expect(
      afterConfirmation({
        ...complete,
        preferences: { ...complete.preferences, marketRole: role },
      }),
    ).toBe(destination);
  });
  it.each(["firstName", "lastName", "displayName", "phone", "city", "termsAcceptedAt"] as const)(
    "opens the dashboard even when a legacy account is missing %s",
    (field) => expect(afterConfirmation({ ...complete, [field]: "" })).toBe("/app/akubin"),
  );
  it("keeps the staff landing even when customer details are incomplete", () => {
    expect(
      afterConfirmation({ ...complete, displayName: null, staff: { role: "super", active: true } }),
    ).toBe("/admin");
  });
  it("loads the saved signup details into Settings without an AkuBin toggle", async () => {
    mount();
    for (const [label, value] of [
      ["First Name", "Ada"],
      ["Last Name", "Obi"],
      ["Display Name", "Ada Recycles"],
      ["Phone", "+2348012345678"],
      ["City", "Lagos"],
    ])
      expect(await screen.findByLabelText(label, { exact: true })).toHaveValue(value);
    expect(screen.queryByRole("checkbox", { name: /AkuBin/ })).not.toBeInTheDocument();
  });
  it("retains a saved display-name edit after Settings is reopened", async () => {
    const first = mount();
    fireEvent.change(await screen.findByLabelText("Display Name", { exact: true }), {
      target: { value: "Ada New Name" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Profile" }));
    await waitFor(() =>
      expect(state.write).toHaveBeenCalledWith(
        "/users/me",
        "PATCH",
        expect.objectContaining({ displayName: "Ada New Name" }),
        "private",
      ),
    );
    await waitFor(() => expect(state.profile.displayName).toBe("Ada New Name"));
    first.unmount();
    mount();
    expect(await screen.findByLabelText("Display Name", { exact: true })).toHaveValue(
      "Ada New Name",
    );
  });
});
