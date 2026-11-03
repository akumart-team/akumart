import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageCircle, X, Send, Bot, LifeBuoy } from "lucide-react";
import { Button } from "./ui/button";
import { getDB } from "@/lib/store";
import { currentUser } from "@/lib/rules";
import { createTicket } from "@/lib/actions";
import { DemoTag } from "./brand";
import { cn } from "@/lib/utils";

type Msg = { from: "bot" | "me"; text: string; link?: { to: string; label: string } };

const SUGGEST = ["How do I find a bin?", "Do I need verification to recycle?", "How do fees work?", "Check my order status", "My points balance", "Talk to a human"];

function answer(q: string): Msg {
  const t = q.toLowerCase();
  const u = currentUser(getDB());
  const db = getDB();
  const needAuth = (what: string): Msg => ({ from: "bot", text: `Sign in to see your ${what}. I can only share account information with the account holder.`, link: { to: "/login", label: "Sign in" } });
  if (/(human|agent|person|ticket|escalat)/.test(t)) return { from: "bot", text: "__ESCALATE__" };
  if (/(order|delivery|tracking|shipment)/.test(t)) {
    if (!u) return needAuth("orders");
    const mine = db.orders.filter((o) => o.buyerId === u.id || o.sellerId === u.id);
    if (!mine.length) return { from: "bot", text: "You don’t have any orders yet. Orders are created when an offer is accepted.", link: { to: "/app/orders", label: "Open orders" } };
    return { from: "bot", text: mine.slice(0, 3).map((o) => `${o.id} · ${o.title}: ${o.status.replace(/_/g, " ")}`).join("\n"), link: { to: "/app/orders", label: "View all orders" } };
  }
  if (/(point|reward|balance|airtime|redeem)/.test(t)) {
    if (!u) return { from: "bot", text: "AkuBin points are earned only for verified deposits and can be redeemed for airtime, cash (above a minimum) or items. Sign in to see your balance.", link: { to: "/akubin", label: "Explore AkuBin" } };
    return { from: "bot", text: `You have ${u.points.toLocaleString()} points from ${u.deposits.filter((d) => d.status === "verified").length} verified deposit(s).`, link: { to: "/app/akubin/rewards", label: "Open rewards" } };
  }
  if (/(verif|kyc|cac|id\b|identity)/.test(t)) {
    if (/(recycl|bin|akubin)/.test(t)) return { from: "bot", text: "No — AkuBin recycling never needs Marketplace verification. You only need a basic account to earn points." };
    if (u) return { from: "bot", text: `Your Marketplace verification: basic — ${u.verification.basic.replace(/_/g, " ")}, full — ${u.verification.full.replace(/_/g, " ")}.`, link: { to: "/app/verification", label: "Verification centre" } };
    return { from: "bot", text: "Marketplace verification is only requested when you first make an offer, publish a listing or check out. Recycling with AkuBin never requires it." };
  }
  if (/(bin|recycl|deposit|qr)/.test(t)) return { from: "bot", text: "Use the AkuBin locator to search by city, area or landmark, or allow location to find the closest demo bin. Scanning a bin’s QR opens its own page.", link: { to: "/akubin", label: "Find a bin" } };
  if (/(fee|commission|charge|cost)/.test(t)) return { from: "bot", text: `Buyers pay the agreed waste price plus the chosen delivery quote — no extra buyer surcharge. Provisional fees: ${db.settings.sellerFee}% from seller proceeds and ${db.settings.partnerFee}% from the logistics fee.` };
  if (/(escrow|payment|pay|refund)/.test(t)) return { from: "bot", text: "Payments are handled by a licensed third-party provider under conditional settlement. AkuMart never holds your funds. In this prototype payments are simulated." };
  if (/(sell|list)/.test(t)) return { from: "bot", text: "To sell, create a listing with photos, grade, quantity, price and pickup area. Basic verification is required before publishing.", link: { to: "/app/listings/new", label: "Create a listing" } };
  if (/(buy|listing|material|plastic|metal|price)/.test(t)) return { from: "bot", text: "Browse and filter verified listings by material, city and price. Saving is free; offers need basic verification.", link: { to: "/marketplace", label: "Browse Marketplace" } };
  if (/(logistic|partner|truck|haul)/.test(t)) return { from: "bot", text: "Logistics partners receive job notices matching their service area, materials and capacity, then submit quotes.", link: { to: "/contact", label: "Apply as a partner" } };
  if (/(hi|hello|hey)/.test(t)) return { from: "bot", text: "Hello! Ask me about the Marketplace, AkuBin, fees, verification or your account." };
  return { from: "bot", text: "I’m not sure about that one. Try one of the suggestions, or I can create a support ticket for a human to follow up." };
}

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "Hi, I’m the AkuMart assistant (scripted demo). How can I help?" }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [escalate, setEscalate] = useState(false);
  const navigate = useNavigate();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, escalate]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { from: "me", text: q }]);
    setText("");
    setBusy(true);
    setTimeout(() => {
      const a = answer(q);
      setBusy(false);
      if (a.text === "__ESCALATE__") {
        setEscalate(true);
        setMsgs((m) => [...m, { from: "bot", text: "I can pass this to our support team. Confirm below to create a ticket." }]);
      } else setMsgs((m) => [...m, a]);
    }, 650);
  };

  const makeTicket = () => {
    const u = currentUser(getDB());
    const last = [...msgs].reverse().find((m) => m.from === "me")?.text ?? "Chat escalation";
    const id = createTicket({ userId: u?.id, name: u?.name ?? "Guest", email: u?.email ?? "guest", subject: "Chat escalation", message: last, channel: "ai_chat", priority: "normal" });
    setEscalate(false);
    setMsgs((m) => [...m, { from: "bot", text: `Ticket ${id} created. A support agent will follow up (simulated — no live agent in this prototype).` }]);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close AkuMart assistant" : "Open AkuMart assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-forest text-lime shadow-lift transition-transform hover:scale-105"
      >
        {open ? <X /> : <MessageCircle />}
      </button>
      {open && (
        <div role="dialog" aria-label="AkuMart assistant" className="fixed bottom-24 right-4 z-50 flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border bg-card shadow-lift">
          <div className="flex items-center gap-3 bg-forest px-4 py-3 text-forest-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-forest">
              <Bot className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold">AkuMart Assistant</p>
              <p className="text-xs text-forest-foreground/60">Scripted responses · not a live AI</p>
            </div>
            <DemoTag />
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={cn("max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5", m.from === "me" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                {m.text}
                {m.link && (
                  <button onClick={() => navigate({ to: m.link!.to as "/" })} className="mt-2 block font-semibold text-primary underline-offset-2 hover:underline">
                    {m.link.label} →
                  </button>
                )}
              </div>
            ))}
            {busy && <div className="w-16 animate-pulse rounded-2xl bg-muted px-3 py-2.5">…</div>}
            {escalate && (
              <div className="rounded-2xl border bg-background p-3">
                <p className="mb-2 flex items-center gap-2 font-medium">
                  <LifeBuoy className="size-4 text-primary" /> Create a support ticket?
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={makeTicket}>
                    Create ticket
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEscalate(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <div ref={end} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto px-3 pb-2">
            {SUGGEST.map((s) => (
              <button key={s} onClick={() => ask(s)} className="shrink-0 rounded-full border px-3 py-1 text-xs hover:bg-secondary">
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
            className="flex gap-2 border-t p-3"
          >
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a question…" aria-label="Message" className="flex-1 rounded-full border bg-background px-4 text-sm outline-none focus:border-primary" />
            <Button type="submit" size="icon" aria-label="Send">
              <Send />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
