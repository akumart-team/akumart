import { beforeEach, describe, expect, it, vi } from "vitest";
const transport = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/client", async (original) => ({
  ...(await original<typeof import("@/lib/api/client")>()),
  request: transport,
}));
import { campaignEvent, recommendationEvent } from "@/lib/api/services/workflows";
beforeEach(() => {
  transport.mockReset();
  transport.mockResolvedValue({ recorded: true });
});
describe("Discovery tracking contracts", () => {
  it("forwards the server-issued campaign token without requiring account authentication", async () => {
    await campaignEvent("opaque-signed-server-token", "click");
    const [url, options, authenticated] = transport.mock.calls[0];
    expect(url).toBe("/advertising/events");
    expect(authenticated).toBe(false);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      token: "opaque-signed-server-token",
      kind: "click",
    });
  });
  it("records recommendation dismissal against the exact resource with authenticated transport", async () => {
    await recommendationEvent("listing", "resource-id", "dismiss");
    const [url, options, authenticated] = transport.mock.calls[0];
    expect(url).toBe("/recommendations/events");
    expect(authenticated).not.toBe(false);
    expect(JSON.parse(options.body)).toEqual({
      resourceType: "listing",
      resourceId: "resource-id",
      action: "dismiss",
    });
  });
  it("preserves backend failures for callers rather than claiming a recorded event", async () => {
    transport.mockRejectedValueOnce(new Error("Invalid tracking token"));
    await expect(campaignEvent("expired-token", "impression")).rejects.toThrow(
      "Invalid tracking token",
    );
    expect(transport).toHaveBeenCalledTimes(1);
  });
});
