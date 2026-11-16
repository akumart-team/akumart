import { ListingSaveButton } from "./listing-save-button";
import { MaterialCard } from "./material-card";
import { RecommendedListings, CampaignPlacements } from "./discovery";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/site-chrome";
import { AccountShell } from "@/components/account-shell";
import { PageTitle, Panel } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/field";
import { useApiSession, useProfile } from "@/lib/api/hooks/use-api";
import { record, rows, text, field, type RecordValue } from "@/lib/api/services/resources";
import { useTradeGate } from "@/components/gate";
import {
  ActionForm,
  DataTable,
  PrivateImage,
  QueryState,
  ResourcePage,
  useResource,
} from "./data-view";

function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const session = useApiSession();
  return session.data ? (
    <AccountShell>{children}</AccountShell>
  ) : (
    <PublicShell>{children}</PublicShell>
  );
}

export function Marketplace({
  embedded = false,
  initialSearch = "",
  initialMaterial = "",
}: {
  embedded?: boolean;
  initialSearch?: string;
  initialMaterial?: string;
}) {
  const session = useApiSession();
  const inWorkspace = embedded || Boolean(session.data);
  const [search, setSearch] = useState(initialSearch);
  const [material, setMaterial] = useState(initialMaterial);
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), limit: "12", sort });
  if (search) params.set("search", search);
  if (material) params.set("material", material);
  if (city) params.set("city", city);
  if (maxPrice) params.set("maxPrice", maxPrice);
  const query = useResource("/listings?" + params, "public");
  const content = (
    <div className={inWorkspace ? "space-y-6" : "container-page space-y-6 py-12"}>
      <PageTitle
        eyebrow="Waste Marketplace"
        title="Find the materials you need."
        intro="Published listings from the Marketplace. Browse freely; verification is required to trade."
      />
      <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-5">
        <input
          className={inputCls}
          aria-label="Search listings"
          placeholder="Search materials"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className={inputCls}
          aria-label="Material"
          value={material}
          onChange={(e) => {
            setMaterial(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All materials</option>
          {["plastic", "metal", "glass", "cardboard", "paper", "wood", "textiles", "rubber"].map(
            (m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ),
          )}
        </select>
        <input
          className={inputCls}
          aria-label="City"
          placeholder="City"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(1);
          }}
        />
        <input
          className={inputCls}
          type="number"
          min="0"
          step="0.01"
          aria-label="Maximum price"
          placeholder="Maximum price (₦)"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value);
            setPage(1);
          }}
        />
        <select
          className={inputCls}
          aria-label="Sort"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/app/listings/new">Sell your materials</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app/requests">Post a buyer request</Link>
        </Button>
      </div>
      <CampaignPlacements placement="marketplace" />
      <QueryState query={query}>
        {(data) =>
          rows(data).length ? (
            <>
              <p className="text-sm text-muted-foreground">
                {query.data?.pagination?.total} published listings
              </p>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {rows(data).map((row) => (
                  <MaterialCard key={text(row.id)} listing={row} />
                ))}
              </div>
            </>
          ) : (
            <Panel title="No published listings">
              <p>
                No listings match your search. Published listings will appear here when sellers make
                them available.
              </p>
            </Panel>
          )
        }
      </QueryState>
      {query.data?.pagination && (
        <div className="flex items-center gap-3">
          <Button disabled={page === 1} variant="outline" onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span>Page {page}</span>
          <Button
            disabled={page * 12 >= query.data.pagination.total}
            variant="outline"
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
  return embedded ? content : <MarketplaceShell>{content}</MarketplaceShell>;
}
export function ListingDetails({ id }: { id: string }) {
  const query = useResource("/listings/" + encodeURIComponent(id), "optional");
  const profile = useProfile();
  const [showOffer, setShowOffer] = useState(false);
  const ownOffers = useResource(
    "/users/me/offers?mode=buyer&listingId=" + encodeURIComponent(id),
    "private",
    Boolean(profile.data),
  );
  const activeOffer = rows(ownOffers.data?.data).find(
    (offer) =>
      ["awaiting_buyer", "awaiting_seller"].includes(text(offer.status)) &&
      Date.parse(text(offer.expiresAt)) > Date.now(),
  );
  const gate = useTradeGate();
  return (
    <MarketplaceShell>
      <div className={profile.data ? "space-y-6" : "container-page space-y-6 py-12"}>
        <Link to="/marketplace" className="text-primary">
          ← Marketplace
        </Link>
        <QueryState query={query}>
          {(data) => {
            const row = record(data);
            const own = profile.data?.id === row.sellerId;
            return (
              <>
                <PageTitle title={text(row.title)} intro={text(row.description)} />
                <div className="grid gap-6 md:grid-cols-2">
                  <PrivateImage
                    id={String(field(row, "images.0.uploadId") || "") || undefined}
                    alt={text(row.title)}
                  />
                  <Panel title="Listing details">
                    <dl className="space-y-3">
                      {[
                        "material",
                        "grade",
                        "condition",
                        "quantity",
                        "availableQuantity",
                        "unit",
                        "unitPrice",
                        "minOrder",
                        "city",
                        "area",
                        "status",
                      ].map((k) => (
                        <div className="flex justify-between gap-3" key={k}>
                          <dt className="text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</dt>
                          <dd>{text(row[k])}</dd>
                        </div>
                      ))}
                    </dl>
                  </Panel>
                </div>
                {own ? (
                  <Button asChild>
                    <Link to="/app/listings/new" search={{ edit: id }}>
                      Edit your listing
                    </Link>
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {activeOffer ? (
                      <Button asChild>
                        <Link to="/app/offers">Continue your existing negotiation</Link>
                      </Button>
                    ) : (
                      <>
                        <Button
                          disabled={
                            row.status !== "published" ||
                            (Boolean(profile.data) && !ownOffers.isSuccess)
                          }
                          onClick={() =>
                            void gate(
                              {
                                path: "/marketplace/" + id,
                                label: "Make an offer",
                                level: "basic",
                              },
                              () => setShowOffer(true),
                            )
                          }
                        >
                          Make an offer
                        </Button>
                        {showOffer && (
                          <ActionForm
                            title="Offer terms"
                            path={"/listings/" + id + "/offers"}
                            fields={[
                              {
                                name: "unitPrice",
                                label: "Unit price (₦)",
                                required: true,
                                value: text(row.unitPrice),
                              },
                              {
                                name: "quantity",
                                label: "Quantity",
                                required: true,
                                value: text(row.minOrder),
                              },
                              {
                                name: "conditions",
                                label: "Conditions (one per line)",
                                type: "textarea",
                              },
                            ]}
                            body={(v) => ({
                              ...v,
                              conditions: String(v.conditions || "")
                                .split("\n")
                                .filter(Boolean),
                            })}
                            onSuccess={() => setShowOffer(false)}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
                {profile.data && (
                  <div className="space-y-4">
                    <ListingSaveButton id={id} sellerId={text(row.sellerId)} />
                    {!own && (
                      <ActionForm
                        title="Report listing"
                        path={"/listings/" + id + "/reports"}
                        fields={[{ name: "reason", label: "Reason", required: true, max: 1000 }]}
                      />
                    )}
                  </div>
                )}
                {row.status === "published" && <RecommendedListings similarId={id} />}
                <DataTable
                  title="Seller reviews"
                  path={"/sellers/" + row.sellerId + "/reviews"}
                  access="public"
                  columns={[
                    { key: "stars", label: "Rating" },
                    { key: "text", label: "Review" },
                    { key: "createdAt", label: "Date" },
                  ]}
                />
              </>
            );
          }}
        </QueryState>
      </div>
    </MarketplaceShell>
  );
}
