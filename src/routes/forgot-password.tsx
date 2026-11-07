import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Field, inputCls } from "@/components/field";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password | AkuMart" },
      { name: "description", content: "Request a password reset link for your AkuMart account." },
      { property: "og:title", content: "Reset password | AkuMart" },
      { property: "og:description", content: "Recover access to your AkuMart account." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  return (
    <AuthLayout>
      {sent ? (
        <div>
          <MailCheck className="size-10 text-primary" />
          <h1 className="text-display mt-4 text-3xl">Check your inbox</h1>
          <p className="mt-2 text-muted-foreground">If an account exists for {email}, a reset link will be sent.</p>
          <Button asChild className="mt-6">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email");
            setSent(true);
          }}
          className="space-y-5"
        >
          <h1 className="text-display text-4xl">Forgot password?</h1>
          <p className="text-muted-foreground">Enter your email and we’ll send a reset link.</p>
          <Field label="Email" error={err}>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="w-full">
            Send reset link
          </Button>
          <Link to="/login" className="block text-center text-sm text-primary">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
