import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Send, X, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { useApiSession } from "@/lib/api/hooks/use-api";
import { errorMessage } from "@/lib/api/client";
import { sendChatMessage, type ChatMessage, type ChatReply } from "@/lib/api/services/assistant";

export const CHAT_IDLE_MS = 30 * 60 * 1000;
const relatedPages = {
  "/marketplace": "Browse marketplace",
  "/contact": "Contact support",
  "/app/akubin": "My AkuBin",
  "/app/dashboard": "Dashboard",
  "/app/settings": "Account settings",
} as const;
export function AIChat() {
  const account = useApiSession();
  const owner = account.data?.user.id;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState<ChatReply>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const sessionId = useRef<string | undefined>(undefined);
  const lastActivity = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flight = useRef<AbortController | undefined>(undefined);
  const transcript = useRef<HTMLDivElement>(null);

  const reset = useCallback((expired = false) => {
    flight.current?.abort();
    flight.current = undefined;
    clearTimeout(timer.current);
    sessionId.current = undefined;
    lastActivity.current = 0;
    setMessages([]);
    setDraft("");
    setReply(undefined);
    setError("");
    setPending(false);
    setNotice(expired ? "Your inactive chat was cleared. Start a new conversation." : "");
  }, []);
  function touch() {
    if (lastActivity.current && Date.now() - lastActivity.current >= CHAT_IDLE_MS) reset(true);
    lastActivity.current = Date.now();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => reset(true), CHAT_IDLE_MS);
  }
  useEffect(() => {
    reset();
    return () => {
      flight.current?.abort();
      flight.current = undefined;
      clearTimeout(timer.current);
    };
  }, [owner, reset]);
  useEffect(() => {
    transcript.current?.scrollTo?.({ top: transcript.current.scrollHeight });
  }, [messages, pending]);
  useEffect(() => {
    const check = () => {
      if (lastActivity.current && Date.now() - lastActivity.current >= CHAT_IDLE_MS) reset(true);
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [reset]);

  async function send(text = draft, retry = false) {
    text = text.trim();
    if (!text || text.length > 3000 || flight.current || account.isPending) return;
    const expired = Boolean(
      lastActivity.current && Date.now() - lastActivity.current >= CHAT_IDLE_MS,
    );
    touch();
    const history = expired ? [] : retry ? messages.slice(0, -1) : messages;
    sessionId.current ||= crypto.randomUUID();
    const controller = new AbortController();
    flight.current = controller;
    setMessages([...history, { role: "user", content: text }]);
    setDraft("");
    setError("");
    setReply(undefined);
    setPending(true);
    try {
      const result = await sendChatMessage(
        sessionId.current,
        text,
        history,
        Boolean(owner),
        controller.signal,
      );
      if (flight.current !== controller) return;
      setMessages((current) => [...current, { role: "assistant", content: result.reply }]);
      setReply(result);
    } catch (cause) {
      if (flight.current === controller) setError(errorMessage(cause));
    } finally {
      if (flight.current === controller) {
        flight.current = undefined;
        setPending(false);
      }
    }
  }
  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-5 sm:right-5">
      {open && (
        <section
          className="mb-3 flex h-[min(36rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-xl"
          aria-label="AkuMart assistant"
        >
          <header className="flex items-center justify-between gap-2 border-b p-4">
            <div>
              <h2 className="font-display text-lg font-semibold">AkuMart assistant</h2>
              <p className="text-xs text-muted-foreground">AI help for marketplace and recycling</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Start new chat" onClick={() => reset()}>
              <RotateCcw className="size-4" />
            </Button>
          </header>
          <div
            ref={transcript}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {!messages.length && (
              <p className="text-sm text-muted-foreground">
                Hello! How can I help you with AkuMart or AkuBin?
              </p>
            )}
            {notice && (
              <p role="status" className="text-xs text-muted-foreground">
                {notice}
              </p>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                <span className="sr-only">{message.role === "user" ? "You" : "Assistant"}: </span>
                {message.content}
              </div>
            ))}
            {pending && (
              <div
                role="status"
                className="flex w-fit items-center gap-1.5 rounded-2xl bg-muted px-4 py-3"
              >
                <span className="sr-only">Assistant is responding</span>
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    aria-hidden="true"
                    className="size-2 rounded-full bg-muted-foreground motion-safe:animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}
            {error && (
              <div role="alert" className="space-y-2 text-sm">
                <p className="text-destructive">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void send(messages.at(-1)?.content, true)}
                >
                  Retry message
                </Button>
              </div>
            )}
            {reply?.quickSuggestions.map((text) => (
              <Button
                key={text}
                variant="outline"
                size="sm"
                className="mr-2 h-auto whitespace-normal text-left"
                disabled={pending}
                onClick={() => void send(text)}
              >
                {text}
              </Button>
            ))}
            {reply?.relatedRoutes
              .filter((route): route is keyof typeof relatedPages =>
                Object.hasOwn(relatedPages, route),
              )
              .map((route) => (
                <Link key={route} to={route} className="block text-sm text-primary underline">
                  {relatedPages[route]}
                </Link>
              ))}
            {reply?.escalateToHuman && (
              <p className="text-sm">
                This needs help from our support team. Use Contact support below; no ticket has been
                created automatically.
              </p>
            )}
          </div>
          <footer className="space-y-2 border-t p-3">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <input
                aria-label="Message"
                placeholder="Ask about AkuMart?"
                maxLength={3000}
                value={draft}
                onChange={(event) => {
                  touch();
                  setDraft(event.target.value);
                }}
                className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 text-sm"
                disabled={pending || account.isPending}
              />
              <Button
                size="icon"
                type="submit"
                aria-label="Send message"
                disabled={pending || account.isPending || !draft.trim() || Boolean(error)}
              >
                <Send className="size-4" />
              </Button>
            </form>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Clears after 30 min idle or refresh.</span>
              <Link
                to="/contact"
                search={{ interest: "support" }}
                className="shrink-0 text-primary underline"
              >
                Contact support
              </Link>
            </div>
          </footer>
        </section>
      )}
      <Button
        className="ml-auto flex h-14 w-14 rounded-full"
        aria-expanded={open}
        aria-label={open ? "Close support" : "Open support"}
        onClick={() => {
          if (!open) touch();
          setOpen(!open);
        }}
      >
        {open ? <X /> : <MessageCircle />}
      </Button>
    </div>
  );
}
