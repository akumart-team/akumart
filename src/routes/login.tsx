import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout, GoogleIcon } from "@/components/auth-layout";
import { Field, inputCls } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { signIn, googleExisting, update } from "@/lib/store";
import { nextPath } from "@/lib/after-auth";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — AkuMart" },
      { name: "description", content: "Sign in to your AkuMart account for the Marketplace and AkuBin." },
      { property: "og:title", content: "Sign in to AkuMart" },
      { property: "og:description", content: "Access your shared Marketplace and AkuBin account." },
    ],
  }),
  component: Login,
});

function Login() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [google, setGoogle] = useState(false);
  const [gEmail, setGEmail] = useState("");
  const isBin = redirect?.includes("/akubin/bin/");

  const go = () => router.history.push(nextPath(redirect));

  return (
    <AuthLayout akubin={isBin}>
      <h1 className="text-display text-4xl">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">{isBin ? "Sign in to continue to your bin deposit." : "Sign in to your AkuMart account."}</p>
      <Button variant="outline" size="lg" className="mt-8 w-full" onClick={() => setGoogle(true)}>
        <GoogleIcon /> Continue with Google
      </Button>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^\S+@\S+\.\S+$/.test(email) || !pw) return setErr("Enter your email and password.");
          const r = signIn(email, pw);
          if (r.error) return setErr(r.error);
          go();
        }}
        className="space-y-4"
      >
        <Field label="Email" htmlFor="email">
          <input id="email" type="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="pw" error={err}>
          <div className="relative">
            <input id="pw" type={show ? "text" : "password"} autoComplete="current-password" className={inputCls + " pr-11"} value={pw} onChange={(e) => setPw(e.target.value)} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to AkuMart?{" "}
        <Link to="/signup" search={{ redirect }} className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
      <Dialog open={google} onOpenChange={setGoogle}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Google sign-in (simulated)</DialogTitle>
            <DialogDescription>Enter the Google email to use. No real Google connection is made.</DialogDescription>
          </DialogHeader>
          <input className={inputCls} placeholder="you@gmail.com" value={gEmail} onChange={(e) => setGEmail(e.target.value)} />
          <Button
            onClick={() => {
              const u = googleExisting(gEmail);
              if (u) {
                update((d) => {
                  d.sessionUserId = u.id;
                });
                setGoogle(false);
                go();
              } else router.navigate({ to: "/signup", search: { redirect, google: gEmail } });
            }}
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
