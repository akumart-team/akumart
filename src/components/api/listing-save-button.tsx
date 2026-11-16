import { Link } from "@tanstack/react-router";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tradingMode } from "@/lib/api/account-roles";
import { useApiSession, useProfile } from "@/lib/api/hooks/use-api";
import { errorMessage } from "@/lib/api/client";
import { readResource, record, rows, writeResource } from "@/lib/api/services/resources";

// One shared query across cards, including saves beyond the first page.
async function savedListingIds() {
  const ids: string[] = [];
  let page = 1;
  for (;;) {
    const result = await readResource(`/users/me/saved-listings?page=${page}&limit=100`, "private");
    const listings = rows(result.data);
    ids.push(...listings.map((row) => String(row.id)));
    if (!listings.length || !result.pagination || page * 100 >= result.pagination.total) return ids;
    page++;
  }
}
export function ListingSaveButton({ id, sellerId }: { id: string; sellerId: string }) {
  const session = useApiSession();
  const user = session.data?.user.id;
  const profile = useProfile();
  const canSave = Boolean(
    user &&
    profile.data?.id === user &&
    tradingMode(profile.data.preferences) === "buyer" &&
    sellerId !== user,
  );
  const qc = useQueryClient();
  const queryKey = ["api", "resource", user || "guest", "saved-listing-ids"];
  const mutationKey = ["saved-listing", user, id];
  const busy = useIsMutating({ mutationKey }) > 0;
  const saved = useQuery({
    queryKey,
    queryFn: savedListingIds,
    enabled: canSave,
    staleTime: 15000,
    retry: false,
  });
  const isSaved = saved.data?.includes(id) ?? false;
  const mutation = useMutation({
    mutationKey,
    mutationFn: async () => {
      const result = await writeResource(
        `/users/me/saved-listings/${encodeURIComponent(id)}`,
        isSaved ? "DELETE" : "PUT",
      );
      const value = record(result.data).saved;
      if (typeof value !== "boolean")
        throw new Error("Could not confirm the saved listing. Please try again.");
      return value;
    },
    onSuccess: async (value) => {
      qc.setQueryData<string[]>(queryKey, (previous) =>
        value
          ? [...new Set([...(previous || []), id])]
          : (previous || []).filter((item) => item !== id),
      );
      toast.success(value ? "Listing saved" : "Listing removed from saved");
      await qc.invalidateQueries({ queryKey: ["api", "resource"] });
    },
    onError: (cause) => {
      toast.error(errorMessage(cause));
    },
  });
  if (user && !canSave) return null;
  if (!user && !session.isPending)
    return (
      <Button
        asChild
        variant="outline"
        size="icon"
        className="shrink-0"
        title="Sign in to save listings"
      >
        <Link to="/login" aria-label="Sign in to save listing">
          <Bookmark className="size-4" />
        </Link>
      </Button>
    );
  const label = saved.isError
    ? "Retry saved listings"
    : isSaved
      ? "Remove from saved"
      : "Save listing";
  return (
    <Button
      variant="outline"
      size="icon"
      className={`shrink-0 ${isSaved ? "border-primary/30 bg-primary/10 text-primary" : ""}`}
      aria-label={label}
      title={label}
      aria-pressed={isSaved}
      disabled={session.isPending || saved.isPending || busy}
      onClick={() => (saved.isError ? void saved.refetch() : mutation.mutate())}
    >
      {busy || (Boolean(user) && saved.isPending) ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="size-4" />
      ) : (
        <Bookmark className="size-4" />
      )}
    </Button>
  );
}
