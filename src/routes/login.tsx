import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Field, inputCls } from "@/components/field";
import { Button } from "@/components/ui/button";
import { useClientReady, useLogin } from "@/lib/api/hooks/use-api";
import { errorMessage } from "@/lib/api/client";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in | AkuMart" },
      {
        name: "description",
        content: "Sign in to your AkuMart account for the Marketplace and AkuBin.",
      },
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
  const login = useLogin();
  const ready = useClientReady();

  const go = () => router.history.replace("/app");

  return (
    <AuthLayout>
      <h1 className="text-display text-4xl">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">Sign in to your AkuMart account.</p>
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (!/^\S+@\S+\.\S+$/.test(email) || !pw) return setErr("Enter your email and password.");
          setErr("");
          try {
            await login.mutateAsync({ email: email.trim(), password: pw });
            go();
          } catch (cause) {
            setErr(errorMessage(cause));
          }
        }}
        className="space-y-4"
      >
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="pw" error={err}>
          <div className="relative">
            <input
              id="pw"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className={inputCls + " pr-11"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={!ready || login.isPending}>
          {login.isPending ? "Signing in?" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to AkuMart?{" "}
        <Link to="/signup" search={{ redirect }} className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
