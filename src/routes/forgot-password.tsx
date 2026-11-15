import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { ActionForm } from "@/components/api/data-view";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/forgot-password")({ component: Recovery });
function Recovery() {
  const [code, setCode] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <AuthLayout>
      <h1 className="text-display mb-5 text-4xl">
        {done ? "Password reset" : code ? "Reset password" : "Forgot password?"}
      </h1>
      {done ? (
        <p>Your password reset request succeeded. Sign in with your new password.</p>
      ) : code ? (
        <ActionForm
          title="Use your recovery code"
          button="Reset password"
          access="public"
          path="/auth/reset-password"
          fields={[
            { name: "email", label: "Email", type: "email", required: true },
            {
              name: "code",
              label: "Recovery code (6–8 digits)",
              required: true,
              min: 6,
              max: 8,
              inputMode: "numeric",
              pattern: "[0-9]{6,8}",
              placeholder: "Enter the code from your email",
            },
            {
              name: "newPassword",
              label: "New password",
              type: "password",
              required: true,
              min: 8,
              max: 72,
            },
          ]}
          onSuccess={() => setDone(true)}
        />
      ) : (
        <>
          <p className="mb-5 text-muted-foreground">
            Request a recovery code. Delivery depends on the email provider being available.
          </p>
          <ActionForm
            title="Request recovery code"
            button="Send recovery code"
            access="public"
            path="/auth/forgot-password"
            fields={[{ name: "email", label: "Email", type: "email", required: true }]}
            onSuccess={() => setCode(true)}
          />
          <Button className="mt-4" variant="outline" onClick={() => setCode(true)}>
            I already have a recovery code
          </Button>
        </>
      )}
      <Link to="/login" className="mt-6 block text-primary">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
