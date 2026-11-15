import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, getSession, refreshSession } from "../client";
import { getProfile, login, logout } from "../services/auth";
import {
  decideVerification,
  listVerification,
  reviewQueue,
  submitVerification,
} from "../services/verification";
import type { Decision } from "../types";
export const apiKeys = {
  session: ["api", "session"] as const,
  profile: ["api", "profile"] as const,
  verification: ["api", "verification"] as const,
  queue: ["api", "verification-queue"] as const,
};
const retry = (count: number, error: Error) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1;
export function useClientReady() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
export function useApiSession() {
  const mounted = useClientReady();
  return useQuery({
    queryKey: apiKeys.session,
    queryFn: async () => getSession() || (await refreshSession()),
    enabled: mounted,
    retry,
    staleTime: Infinity,
  });
}
export function useProfile() {
  const session = useApiSession();
  return useQuery({
    queryKey: [...apiKeys.profile, session.data?.user.id],
    queryFn: async () => (await getProfile()).data,
    enabled: Boolean(session.data),
    retry,
    staleTime: 30_000,
  });
}
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      qc.clear();
      qc.setQueryData(apiKeys.session, session);
    },
    retry: false,
  });
}
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.clear();
      qc.setQueryData(apiKeys.session, null);
    },
    retry: false,
  });
}
export function useVerification() {
  const session = useApiSession();
  return useQuery({
    queryKey: [...apiKeys.verification, session.data?.user.id],
    queryFn: async () => (await listVerification()).data,
    enabled: Boolean(session.data),
    retry,
    refetchInterval: 15_000,
  });
}
export function useSubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitVerification,
    retry: false,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: apiKeys.verification });
      await qc.invalidateQueries({ queryKey: apiKeys.profile });
    },
  });
}
export function useReviewQueue(page: number, enabled: boolean) {
  const profile = useProfile();
  return useQuery({
    queryKey: [...apiKeys.queue, profile.data?.id, page],
    queryFn: () => reviewQueue(page),
    enabled,
    retry,
    refetchInterval: 15_000,
  });
}
export function useDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Decision & { id: string }) => decideVerification(id, body),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: apiKeys.queue }),
        qc.invalidateQueries({ queryKey: apiKeys.verification }),
        qc.invalidateQueries({ queryKey: apiKeys.profile }),
      ]);
    },
  });
}
