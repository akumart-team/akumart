import { createFileRoute, Link } from "@tanstack/react-router";
import { PageTitle, Empty } from "@/components/app-ui";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { useDB, useMe } from "@/lib/store";

export const Route = createFileRoute("/app/saved")({
  component: Saved,
});

function Saved() {
  const me = useMe()!;
  const listings = useDB((d) => d.listings.filter((l) => me.saved.includes(l.id)));
  const articles = useDB((d) => d.articles.filter((a) => me.savedArticles.includes(a.id)));
  return (
    <div>
      <PageTitle eyebrow="Marketplace" title="Saved" intro="Saving is always free, no verification needed." />
      {listings.length === 0 && articles.length === 0 ? (
        <Empty title="Nothing saved yet" body="Tap the bookmark on any listing or article.">
          <Button asChild>
            <Link to="/marketplace">Browse listings</Link>
          </Button>
        </Empty>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </div>
          {articles.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 font-display text-xl font-semibold">Articles</h2>
              <ul className="space-y-2">
                {articles.map((a) => (
                  <li key={a.id}>
                    <Link to="/articles/$slug" params={{ slug: a.slug }} className="text-primary hover:underline">
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
