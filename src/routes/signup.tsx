import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Recycle } from "lucide-react";
import { AuthLayout, GoogleIcon } from "@/components/auth-layout";
import { Field, inputCls } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { signUp, updateMe, useDB } from "@/lib/store";
import { nextPath } from "@/lib/after-auth";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string; google?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    google: typeof s.google === "string" ? s.google : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create your account — AkuMart" },
      { name: "description", content: "Join AkuMart with basic details. One account for the Marketplace and AkuBin." },
      { property: "og:title", content: "Join AkuMart" },
      { property: "og:description", content: "Create a free shared account for trading and recycling." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const { redirect, google } = Route.useSearch();
  const router = useRouter();
  const binId = redirect?.match(/\/akubin\/bin\/([^/]+)/)?.[1];
  const bin = useDB((d) => d.bins.find((b) => b.id === binId));
  const [f, setF] = useState({ name: "", email: google ?? "", phone: "", pw: "" });
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [gOpen, setGOpen] = useState(false);
  const [gName, setGName] = useState("");
  const [gEmail, setGEmail] = useState(google ?? "");

  const finish = () => {
    if (binId) {
      updateMe((u) => {
        u.prefs.akubin = true;
        u.prefs.onboarded = true;
      });
    }
    router.history.push(binId ? redirect! : nextPath(redirect, true));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid email";
    if (f.phone && !/^\+?[\d\s]{10,15}$/.test(f.phone)) er.phone = "Enter a valid phone number";
    if (f.pw.length < 8) er.pw = "Use at least 8 characters";
    if (!agree) er.agree = "You must accept the Terms & Conditions and acknowledge the Privacy Policy to continue.";
    setErr(er);
    if (Object.keys(er).length) return;
    const r = signUp({ name: f.name, email: f.email, password: f.pw, phone: f.phone || undefined, provider: "email" });
    if (r.error) return setErr({ email: r.error });
    finish();
  };

  return (
    <AuthLayout akubin={!!binId}>
      {bin && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-forest p-4 text-forest-foreground">
          <Recycle className="size-6 text-lime" />
          <div className="text-sm">
            <p className="font-semibold">Recycling at {bin.name}</p>
            <p className="text-forest-foreground/70">{bin.id} · We’ll take you straight back to this bin.</p>
          </div>
        </div>
      )}
      <h1 className="text-display text-4xl">Create your account</h1>
      <p className="mt-2 text-muted-foreground">Just the basics. No ID or business documents needed to join.</p>
      <Button
        variant="outline"
        size="lg"
        className="mt-8 w-full"
        onClick={() => {
          if (!agree) return setErr({ agree: "Please accept the Terms & Conditions and Privacy Policy before continuing with Google." });
          setGOpen(true);
        }}
      >
        <GoogleIcon /> Sign up with Google
      </Button>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
      </div>
      <form noValidate onSubmit={submit} className="space-y-4">
        <Field label="Full name or display name" error={err.name}>
          <input className={inputCls} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Email" error={err.email}>
          <input className={inputCls} type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <Field label="Phone (optional)" error={err.phone} hint="Useful for airtime rewards and bin sign-in by PIN.">
          <input className={inputCls} type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+234 803 000 0000" />
        </Field>
        <Field label="Password" error={err.pw}>
          <div className="relative">
            <input className={inputCls + " pr-11"} type={show ? "text" : "password"} autoComplete="new-password" value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="space-y-1.5">
          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" aria-describedby="agree-err" />
            <span>
              I agree to AkuMart’s{" "}
              <Link to="/legal/$doc" params={{ doc: "terms" }} target="_blank" className="font-semibold text-primary underline-offset-2 hover:underline">
                Terms & Conditions
              </Link>{" "}
              and acknowledge the{" "}
              <Link to="/legal/$doc" params={{ doc: "privacy" }} target="_blank" className="font-semibold text-primary underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {err.agree && (
            <p id="agree-err" role="alert" className="text-xs font-medium text-destructive">
              {err.agree}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" search={{ redirect }} className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
      <Dialog open={gOpen} onOpenChange={setGOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Google sign-up (simulated)</DialogTitle>
            <DialogDescription>Your consent to the Terms and Privacy Policy is recorded with this signup.</DialogDescription>
          </DialogHeader>
          <input className={inputCls} placeholder="Name" value={gName} onChange={(e) => setGName(e.target.value)} />
          <input className={inputCls} placeholder="you@gmail.com" value={gEmail} onChange={(e) => setGEmail(e.target.value)} />
          <Button
            onClick={() => {
              if (!gName || !/^\S+@\S+\.\S+$/.test(gEmail)) return;
              const r = signUp({ name: gName, email: gEmail, password: crypto.randomUUID(), provider: "google" });
              if (r.error) return setErr({ email: r.error });
              setGOpen(false);
              finish();
            }}
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
