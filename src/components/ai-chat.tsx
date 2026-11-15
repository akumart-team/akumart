import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, X } from "lucide-react";
import { Button } from "./ui/button";
export function AIChat() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <section
          className="mb-3 w-80 rounded-2xl border bg-card p-5 shadow-xl"
          aria-label="Assistant"
        >
          <h2 className="font-display text-xl font-semibold">AkuMart support</h2>
          <p className="my-3 text-sm text-muted-foreground">
            The AI assistant is currently unavailable. You can contact our support team for help.
          </p>
          <Button asChild>
            <Link to="/contact" search={{ interest: "support" }}>
              Contact support
            </Link>
          </Button>
        </section>
      )}
      <Button
        className="h-14 w-14 rounded-full"
        aria-label={open ? "Close support" : "Open support"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <MessageCircle />}
      </Button>
    </div>
  );
}
