import { json, request, setSession } from "../client";
import type { Envelope, Profile, Session } from "../types";
import type { AccountRole } from "../account-roles";
export async function login(body: { email: string; password: string }) {
  const session = await request<Session>("/auth/login", json("POST", body), false);
  setSession(session);
  return session;
}
export async function logout() {
  await request("/auth/logout", json("POST"));
  setSession(null);
}
export const getProfile = () => request<Envelope<Profile>>("/users/me");
export const register = (body: {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  city: string;
  marketRole: AccountRole;
  akubin: boolean;
  password: string;
  acceptedTerms: true;
}) => request<{ message: string }>("/auth/register", json("POST", body), false);
export const resendCode = (email: string) =>
  request<{ message: string }>("/auth/resend-code", json("POST", { email }), false);
export async function verifyEmail(body: { email: string; code: string }) {
  const session = await request<Session>("/auth/verify-email", json("POST", body), false);
  setSession(session);
  return session;
}
export const updatePreferences = (body: { marketRole?: string; activeMode?: string }) =>
  request("/users/me/preferences", json("PATCH", body));
