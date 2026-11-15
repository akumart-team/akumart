import { createFileRoute } from "@tanstack/react-router";
import { VerificationReview } from "@/components/verification-review";
export const Route = createFileRoute("/admin/verification")({ component: VerificationReview });
