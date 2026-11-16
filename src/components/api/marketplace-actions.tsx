import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useApiSession, useProfile } from "@/lib/api/hooks/use-api";
import { tradingMode } from "@/lib/api/account-roles";
export function MarketplaceActions() {
  const session = useApiSession();
  const profile = useProfile();
  if (session.isPending) return null;
  if (!session.data)
    return (
      <Button asChild>
        <Link to="/login">Sign in to trade</Link>
      </Button>
    );
  const mode = tradingMode(profile.data?.preferences);
  if (!mode) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {mode === "seller" ? (
        <>
          <Button asChild>
            <Link to="/app/listings/new">Sell your materials</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/requests">Find buyer requests</Link>
          </Button>
        </>
      ) : (
        <Button asChild variant="outline">
          <Link to="/app/requests">Post a buyer request</Link>
        </Button>
      )}
    </div>
  );
}
export function SellerAccessNotice() {
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6" role="alert">
      <h2 className="text-lg font-semibold">Seller access required</h2>
      <p className="text-sm text-muted-foreground">
        Listings are managed by sellers. If you use Buyer &amp; Seller, switch to seller mode to
        continue.
      </p>
      <Button asChild variant="outline">
        <Link to="/marketplace">Browse marketplace</Link>
      </Button>
    </div>
  );
}
