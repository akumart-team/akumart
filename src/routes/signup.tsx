import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth-layout";
import { Field, inputCls } from "@/components/field";
import { Button } from "@/components/ui/button";
import { resendCode, verifyEmail } from "@/lib/api/services/auth";
import { RegistrationForm } from "@/components/registration-form";
import { apiKeys, useClientReady } from "@/lib/api/hooks/use-api";
import { errorMessage } from "@/lib/api/client";
export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string; google?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: Signup,
});
function Signup() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const qc = useQueryClient();
  const ready = useClientReady();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const verify = useMutation({ mutationFn: verifyEmail, retry: false });
  const resend = useMutation({ mutationFn: resendCode, retry: false });
  const busy = !ready || verify.isPending || resend.isPending;
  return (
    <AuthLayout contained>
      <div className="shrink-0 pb-5">
        <h1 className="text-display text-3xl sm:text-4xl">
          {sent ? "Confirm your email" : "Create your account"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {sent
            ? `Enter the code sent to ${email}.`
            : "One account for Marketplace and AkuBin. Marketplace verification is completed separately."}
        </p>
      </div>
      <div
        role="region"
        aria-label={sent ? "Email confirmation form" : "Account creation form"}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 pr-2 focus-visible:outline-primary"
        style={{ scrollbarWidth: "thin", scrollbarGutter: "stable" }}
      >
        {sent ? (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              try {
                const session = await verify.mutateAsync({ email, code });
                qc.clear();
                qc.setQueryData(apiKeys.session, session);
                router.history.replace("/app");
              } catch (cause) {
                setError(errorMessage(cause));
              }
            }}
          >
            <Field label="Email verification code (6–8 digits)" htmlFor="email-code">
              <input
                id="email-code"
                className={inputCls}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,8}"
                minLength={6}
                maxLength={8}
                title="Enter the 6–8 digit code from your email."
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </Field>
            <Button type="submit" disabled={busy}>
              {verify.isPending ? "Verifying…" : "Verify email"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setError("");
                try {
                  const result = await resend.mutateAsync(email);
                  setNotice(result.message);
                } catch (cause) {
                  setError(errorMessage(cause));
                }
              }}
            >
              Resend code
            </Button>
          </form>
        ) : (
          <RegistrationForm
            disabled={!ready}
            onRegistered={(address, message) => {
              setEmail(address);
              setSent(true);
              setNotice(message);
            }}
          />
        )}
        {error && (
          <p role="alert" className="mt-4 text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-4 text-sm">
            {notice}
          </p>
        )}
      </div>
      <p className="mt-4 shrink-0 text-sm">
        Already have an account?{" "}
        <Link to="/login" search={{ redirect }} className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
