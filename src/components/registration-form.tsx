import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { accountRoleOptions, isAccountRole } from "@/lib/api/account-roles";
import { register } from "@/lib/api/services/auth";
import { errorMessage } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, inputCls } from "./field";

const signupRoleOptions = accountRoleOptions.filter((option) => option.value !== "logistics");

const schema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name.").max(50),
    lastName: z.string().trim().min(1, "Enter your last name.").max(50),
    displayName: z.string().trim().min(1, "Enter your display name.").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    phone: z
      .string()
      .trim()
      .regex(
        /^\+?\d{10,15}$/,
        "Enter a phone number with 10–15 digits, optionally starting with +.",
      ),
    city: z.string().trim().min(2, "Enter your city (at least two characters).").max(100),
    marketRole: z
      .string()
      .refine(
        (value) => signupRoleOptions.some((option) => option.value === value),
        "Choose how you will use AkuMart.",
      ),
    akubin: z.boolean(),
    password: z
      .string()
      .min(8, "Use at least 8 characters for your password.")
      .max(72)
      .regex(/\S/, "Password cannot contain only spaces."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "Accept the terms to create an account." }),
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Your passwords do not match.",
    path: ["confirmPassword"],
  });
export function RegistrationForm({
  disabled = false,
  onRegistered,
}: {
  disabled?: boolean;
  onRegistered: (email: string, message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  return (
    <form
      aria-label="Create account"
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        const form = new FormData(event.currentTarget);
        const parsed = schema.safeParse({
          ...Object.fromEntries(form),
          acceptedTerms: form.get("acceptedTerms") === "on",
          akubin: true,
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        const { confirmPassword: _confirmation, ...body } = parsed.data;
        if (!isAccountRole(body.marketRole)) return;
        setBusy(true);
        try {
          const result = await register({ ...body, marketRole: body.marketRole });
          onRegistered(body.email, result.message);
        } catch (cause) {
          setError(errorMessage(cause));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-xs text-muted-foreground">All fields are required.</p>
      <fieldset disabled={disabled || busy} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName">
            <input
              id="firstName"
              name="firstName"
              className={inputCls}
              autoComplete="given-name"
              required
              maxLength={50}
            />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <input
              id="lastName"
              name="lastName"
              className={inputCls}
              autoComplete="family-name"
              required
              maxLength={50}
            />
          </Field>
        </div>
        <Field label="Display name" htmlFor="signup-display-name">
          <input
            id="signup-display-name"
            name="displayName"
            className={inputCls}
            autoComplete="nickname"
            required
            minLength={1}
            maxLength={100}
            pattern=".*\S.*"
          />
          <p className="mt-1 text-xs text-muted-foreground">The name people will see on AkuMart.</p>
        </Field>
        <Field label="Email" htmlFor="signup-email">
          <input
            id="signup-email"
            name="email"
            className={inputCls}
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </Field>
        <Field label="Phone number" htmlFor="signup-phone">
          <input
            id="signup-phone"
            name="phone"
            className={inputCls}
            type="tel"
            autoComplete="tel"
            pattern="\+?[0-9]{10,15}"
            title="10–15 digits, optionally starting with +"
            required
            maxLength={16}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Enter a number we can reach you on, for example +2348012345678.
          </p>
        </Field>
        <Field label="City" htmlFor="signup-city">
          <input
            id="signup-city"
            name="city"
            className={inputCls}
            autoComplete="address-level2"
            required
            minLength={2}
            maxLength={100}
          />
        </Field>
        <Field label="How will you use AkuMart?" htmlFor="signup-role">
          <select
            id="signup-role"
            name="marketRole"
            className={inputCls}
            value={role}
            onChange={(event) => setRole(event.target.value)}
            required
          >
            <option value="" disabled>
              Choose your role
            </option>
            {signupRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            You can change this preference later. Marketplace trading requires separate
            verification. To deliver materials, apply for logistics partnership after signing in.
          </p>
        </Field>
        <p className="rounded-xl border bg-primary/5 p-4 text-sm">
          AkuBin is included with every account. Set your PIN, recycle materials and earn points
          without Marketplace verification.
        </p>
        <Field label="Password" htmlFor="signup-password">
          <input
            id="signup-password"
            name="password"
            className={inputCls}
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">Use 8–72 characters.</p>
        </Field>
        <Field label="Confirm password" htmlFor="signup-confirm-password">
          <input
            id="signup-confirm-password"
            name="confirmPassword"
            className={inputCls}
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
        </Field>
        <label className="flex gap-3 text-sm">
          <input name="acceptedTerms" type="checkbox" required />
          <span>
            I accept the{" "}
            <Link to="/legal/$doc" params={{ doc: "terms" }} className="underline">
              Terms & Conditions
            </Link>{" "}
            and acknowledge the{" "}
            <Link to="/legal/$doc" params={{ doc: "privacy" }} className="underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        <Button type="submit" disabled={disabled || busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
