import { json, request } from "../client";
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatReply = {
  reply: string;
  escalateToHuman: boolean;
  quickSuggestions: string[];
  relatedRoutes: string[];
};
export async function sendChatMessage(
  sessionId: string,
  message: string,
  history: ChatMessage[],
  authenticated: boolean,
  signal: AbortSignal,
) {
  return (
    await request<{ data: ChatReply }>(
      "/assistant/messages",
      {
        ...json("POST", { sessionId, message, history: history.slice(-12) }),
        signal,
      },
      authenticated,
    )
  ).data;
}
