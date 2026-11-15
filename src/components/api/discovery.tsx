import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";
import { Panel, PageTitle } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/api/hooks/use-api";
import { errorMessage } from "@/lib/api/client";
import { rows, record, text, type RecordValue } from "@/lib/api/services/resources";
import {
  recommendationEvent,
  campaignEvent,
  workflowPaths,
  type RecommendationResource,
} from "@/lib/api/services/workflows";
import { MaterialCard } from "./material-card";
import { PrivateImage, QueryState, Summary, useResource } from "./data-view";

function Exposure({ onVisible, children }: { onVisible: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const called = useRef(false);
  const callback = useRef(onVisible);
  callback.current = onVisible;
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!called.current && entries.some((entry) => entry.isIntersecting)) {
          called.current = true;
          callback.current();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref}>{children}</div>;
}
function RecommendedListing({ listing }: { listing: RecordValue }) {
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const id = text(listing.id);
  return (
    <Exposure
      onVisible={() => {
        void recommendationEvent("listing", id, "impression").catch(() => {});
      }}
    >
      <div
        className="relative"
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest("a"))
            void recommendationEvent("listing", id, "view").catch(() => {});
        }}
      >
        <MaterialCard listing={listing} />
        <Button
          size="icon"
          variant="outline"
          className="absolute right-3 top-3 h-8 w-8 rounded-full bg-card"
          disabled={busy}
          aria-label={"Hide recommendation " + text(listing.title)}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await recommendationEvent("listing", id, "dismiss");
              await qc.invalidateQueries({ queryKey: ["api", "resource"] });
            } catch (cause) {
              setError(errorMessage(cause));
            } finally {
              setBusy(false);
            }
          }}
        >
          <X className="h-4 w-4" />
        </Button>
        {Boolean(listing.reason) && (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            {text(listing.reason)}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </Exposure>
  );
}
export function RecommendedListings({ similarId }: { similarId?: string }) {
  const profile = useProfile();
  const query = useResource(
    similarId
      ? "/recommendations/listings/" + encodeURIComponent(similarId) + "/similar"
      : "/recommendations/listings",
    "optional",
  );
  return (
    <Panel title={similarId ? "Similar materials" : "Recommended for you"}>
      <QueryState query={query}>
        {(data) =>
          rows(data).length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {rows(data).map((listing) =>
                profile.data ? (
                  <RecommendedListing key={text(listing.id)} listing={listing} />
                ) : (
                  <MaterialCard key={text(listing.id)} listing={listing} />
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {similarId
                ? "No similar listings are currently available."
                : "Recommendations will appear as materials are published. Add your city and interests in Settings to help tailor your feed."}
            </p>
          )
        }
      </QueryState>
    </Panel>
  );
}
export function RecommendedArticles() {
  const profile = useProfile();
  const query = useResource("/recommendations/articles", "optional");
  return (
    <Panel title="Suggested reading">
      <QueryState query={query}>
        {(data) =>
          rows(data).length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {rows(data).map((article) => (
                <Exposure
                  key={text(article.id)}
                  onVisible={() => {
                    if (profile.data)
                      void recommendationEvent("article", text(article.id), "impression").catch(
                        () => {},
                      );
                  }}
                >
                  <article className="rounded-2xl border p-5">
                    <p className="text-xs font-semibold text-primary">{text(article.category)}</p>
                    <h3 className="mt-2 font-display text-lg font-semibold">
                      <Link
                        to="/articles/$slug"
                        params={{ slug: text(article.slug) }}
                        onClick={() => {
                          if (profile.data)
                            void recommendationEvent("article", text(article.id), "view").catch(
                              () => {},
                            );
                        }}
                      >
                        {text(article.title)}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{text(article.excerpt)}</p>
                  </article>
                </Exposure>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Published guides will appear here.</p>
          )
        }
      </QueryState>
    </Panel>
  );
}
export function RecommendedJobs() {
  const query = useResource("/recommendations/jobs");
  return (
    <Panel title="Suggested delivery jobs">
      <QueryState query={query}>
        {(data) =>
          rows(data).length ? (
            <ul className="space-y-3">
              {rows(data).map((job) => (
                <Exposure
                  key={text(job.id)}
                  onVisible={() => {
                    void recommendationEvent("job", text(job.id), "impression").catch(() => {});
                  }}
                >
                  <li className="rounded-xl border p-4">
                    <p className="font-medium">{text(job.title)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {text(job.quantity)} {text(job.unit)} · {text(job.pickupCity)} · proposed fare
                      ₦{text(job.proposedFare)}
                    </p>
                    <Link
                      to="/app/partner"
                      className="mt-2 inline-block text-sm text-primary"
                      onClick={() => {
                        void recommendationEvent("job", text(job.id), "view").catch(() => {});
                      }}
                    >
                      Review job and quote
                    </Link>
                  </li>
                </Exposure>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No eligible delivery jobs match your partner account right now.
            </p>
          )
        }
      </QueryState>
    </Panel>
  );
}
function CampaignCard({ campaign }: { campaign: RecordValue }) {
  const token = String(campaign.trackingToken || "");
  let url: string | undefined;
  try {
    const parsed = new URL(String(campaign.destinationUrl));
    if (parsed.protocol === "https:") url = parsed.href;
  } catch {
    /* invalid destinations are never rendered as links */
  }
  if (!url) return null;
  return (
    <Exposure
      onVisible={() => {
        if (token) void campaignEvent(token, "impression").catch(() => {});
      }}
    >
      <article className="overflow-hidden rounded-2xl border bg-card">
        <PrivateImage
          id={typeof campaign.imageId === "string" ? campaign.imageId : undefined}
          alt={text(campaign.title)}
        />
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sponsored
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold">{text(campaign.title)}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{text(campaign.body)}</p>
          <a
            className="mt-4 inline-block text-sm font-semibold text-primary"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (token) void campaignEvent(token, "click").catch(() => {});
            }}
          >
            Learn more →
          </a>
        </div>
      </article>
    </Exposure>
  );
}
export function CampaignPlacements({
  placement,
}: {
  placement: "home" | "marketplace" | "articles" | "dashboard";
}) {
  const profile = useProfile();
  const params = new URLSearchParams({ placement });
  if (profile.data?.city) params.set("city", profile.data.city);
  if (profile.data?.preferences?.marketRole)
    params.set("role", profile.data.preferences.marketRole);
  const query = useResource("/advertising/placements?" + params, "public");
  if (!query.data || !rows(query.data.data).length) return null;
  return (
    <section aria-label="Sponsored placements" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {rows(query.data.data).map((campaign) => (
        <CampaignCard key={text(campaign.id)} campaign={campaign} />
      ))}
    </section>
  );
}
export function CampaignStatistics({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="min-w-56 rounded-xl border p-3"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm font-medium text-primary">
        View campaign statistics
      </summary>
      {open && (
        <div className="mt-4">
          <Summary
            title="Campaign performance"
            path={workflowPaths.campaignStats(id)}
            fields={[
              { key: "impressions", label: "Impressions" },
              { key: "clicks", label: "Clicks" },
              { key: "clickThroughRate", label: "Click-through ratio" },
            ]}
          />
        </div>
      )}
    </details>
  );
}
export function MarketplaceFeed({ browse }: { browse: ReactNode }) {
  const [tab, setTab] = useState<"recommended" | "browse" | "articles">("recommended");
  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Marketplace"
        title="For you"
        intro="Discover materials and guides based on your account preferences."
      />
      <div role="tablist" aria-label="Marketplace feed" className="flex flex-wrap gap-2">
        {(
          [
            ["recommended", "For you"],
            ["browse", "All listings"],
            ["articles", "Articles"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            role="tab"
            aria-selected={tab === value}
            variant={tab === value ? "default" : "outline"}
            onClick={() => setTab(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === "recommended" ? (
        <>
          <RecommendedListings />
          <CampaignPlacements placement="dashboard" />
          <RecommendedArticles />
        </>
      ) : tab === "browse" ? (
        browse
      ) : (
        <RecommendedArticles />
      )}
    </div>
  );
}
