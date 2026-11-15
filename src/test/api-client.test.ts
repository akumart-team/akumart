import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getSession, json, request, setSession } from "@/lib/api/client";
import type { Session } from "@/lib/api/types";
const valid = (token: string): Session => ({
  accessToken: token,
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "user", email: "test@example.com" },
});
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
afterEach(() => {
  vi.unstubAllGlobals();
  setSession(null);
});
describe("API authentication transport", () => {
  it("shares refresh for concurrent expired requests and sends credentials", async () => {
    setSession({ ...valid("old"), expiresAt: 0 });
    let finish!: (value: Response) => void;
    const fetcher = vi.fn((url: string, init: RequestInit) => {
      expect(init.credentials).toBe("include");
      if (url.endsWith("/auth/refresh"))
        return new Promise<Response>((resolve) => {
          finish = resolve;
        });
      expect(new Headers(init.headers).get("Authorization")).toBe("Bearer fresh");
      return Promise.resolve(reply({ data: [] }));
    });
    vi.stubGlobal("fetch", fetcher);
    const first = request("/users/me/verification");
    const second = request("/users/me");
    finish(reply(valid("fresh")));
    await Promise.all([first, second]);
    expect(fetcher.mock.calls.filter(([url]) => url.endsWith("/auth/refresh"))).toHaveLength(1);
  });
  it("retries one unauthorized request after refresh but never loops", async () => {
    setSession(valid("old"));
    const fetcher = vi.fn((url: string) =>
      Promise.resolve(
        url.endsWith("/auth/refresh") ? reply(valid("fresh")) : reply({ message: "Denied" }, 401),
      ),
    );
    vi.stubGlobal("fetch", fetcher);
    await expect(request("/users/me")).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("does not refresh or retry forbidden mutations or provider/network failures", async () => {
    setSession(valid("valid"));
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply({ message: ["Not permitted", "Verification required"] }, 403))
      .mockRejectedValueOnce(new TypeError("Network unavailable"));
    vi.stubGlobal("fetch", fetcher);
    await expect(request("/admin/verifications/id/decision", json("POST", {}))).rejects.toThrow(
      "Not permitted Verification required",
    );
    await expect(request("/users/me/verification/submissions", json("POST", {}))).rejects.toThrow(
      "Network unavailable",
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("leaves multipart boundaries to the browser and does not attach auth to public login", async () => {
    setSession(valid("private"));
    const fetcher = vi.fn().mockResolvedValue(reply({ data: {} }));
    vi.stubGlobal("fetch", fetcher);
    await request("/uploads", { method: "POST", body: new FormData() });
    expect(new Headers(fetcher.mock.calls[0][1].headers).has("Content-Type")).toBe(false);
    await request("/auth/login", json("POST", { email: "test@example.com" }), false);
    expect(new Headers(fetcher.mock.calls[1][1].headers).has("Authorization")).toBe(false);
  });
  it("clears the session when refresh is unauthorized", async () => {
    setSession({ ...valid("old"), expiresAt: 0 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply({}, 401)));
    await expect(request("/users/me")).rejects.toBeInstanceOf(ApiError);
    expect(getSession()).toBeNull();
  });
});
