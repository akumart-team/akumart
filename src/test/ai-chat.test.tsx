import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIChat, CHAT_IDLE_MS } from "@/components/ai-chat";
const state = vi.hoisted(() => ({ owner: undefined as string | undefined, send: vi.fn() }));
vi.mock("@/lib/api/hooks/use-api", () => ({
  useApiSession: () => ({
    data: state.owner ? { user: { id: state.owner } } : null,
    isPending: false,
  }),
}));
vi.mock("@/lib/api/services/assistant", () => ({ sendChatMessage: state.send }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
beforeEach(() => {
  vi.useFakeTimers();
  state.owner = undefined;
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn().mockReturnValue("f4c2b73d-5a1b-453a-a8f7-c925c706a7dc"),
  });
  state.send.mockReset().mockResolvedValue({
    reply: "You can recycle with AkuBin.",
    escalateToHuman: false,
    quickSuggestions: [],
    relatedRoutes: [],
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function open() {
  fireEvent.click(screen.getByRole("button", { name: "Open support" }));
}
async function send(message: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
    target: { value: message },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  });
}
describe("temporary AI chat", () => {
  it("sends only through our service with recent context and keeps history when closed", async () => {
    render(<AIChat />);
    open();
    await send("Hello");
    expect(state.send.mock.calls[0][2]).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Close support" }));
    open();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    await send("Where?");
    expect(state.send.mock.calls[1][2]).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "You can recycle with AkuBin." },
    ]);
    expect(state.send.mock.calls[0][3]).toBe(false);
  });
  it("clears after inactivity but extends the timer when the user types", async () => {
    render(<AIChat />);
    open();
    await send("Hello");
    act(() => vi.advanceTimersByTime(CHAT_IDLE_MS - 1000));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Still here" } });
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("Hello")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(CHAT_IDLE_MS));
    expect(screen.queryByText("Hello")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
    await send("Fresh");
    expect(state.send.mock.calls.at(-1)![2]).toEqual([]);
  });
  it("does not duplicate a failed message on retry", async () => {
    state.send.mockRejectedValueOnce(new Error("Unavailable"));
    render(<AIChat />);
    open();
    await send("Hello");
    expect(screen.getByRole("alert")).toHaveTextContent("Unavailable");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Retry message" })));
    expect(screen.getAllByText("Hello")).toHaveLength(1);
    expect(state.send.mock.calls[1][2]).toEqual([]);
  });
  it("aborts pending replies on expiry and does not restore the old conversation", async () => {
    let finish!: (value: unknown) => void;
    state.send.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<AIChat />);
    open();
    await send("Hello");
    act(() => vi.advanceTimersByTime(CHAT_IDLE_MS));
    expect(state.send.mock.calls[0][4].aborted).toBe(true);
    await act(async () => finish({ reply: "Old answer", quickSuggestions: [], relatedRoutes: [] }));
    expect(screen.queryByText("Old answer")).not.toBeInTheDocument();
  });
  it("clears on account changes, logout, fresh mount, and new chat", async () => {
    state.owner = "buyer";
    const view = render(<AIChat />);
    open();
    await send("Private");
    expect(state.send.mock.calls[0][3]).toBe(true);
    state.owner = "seller";
    view.rerender(<AIChat />);
    expect(screen.queryByText("Private")).not.toBeInTheDocument();
    await send("Seller message");
    state.owner = undefined;
    view.rerender(<AIChat />);
    expect(screen.queryByText("Seller message")).not.toBeInTheDocument();
    await send("Guest message");
    fireEvent.click(screen.getByRole("button", { name: "Start new chat" }));
    expect(screen.queryByText("Guest message")).not.toBeInTheDocument();
    await send("Before refresh");
    view.unmount();
    render(<AIChat />);
    open();
    expect(screen.queryByText("Before refresh")).not.toBeInTheDocument();
  });
  it("shows escalation and suggestions but filters external or unsupported routes", async () => {
    state.send.mockResolvedValue({
      reply: "Contact our team",
      escalateToHuman: true,
      quickSuggestions: ["Fees"],
      relatedRoutes: ["https://evil.test", "/admin", "/app/akubin"],
    });
    render(<AIChat />);
    open();
    await send("Dispute");
    expect(screen.getByText(/no ticket has been created automatically/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My AkuBin" })).toHaveAttribute("href", "/app/akubin");
    expect(screen.queryByRole("link", { name: "/admin" })).not.toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Fees" })));
    expect(state.send.mock.calls[1][1]).toBe("Fees");
  });
});
