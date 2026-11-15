import { Link } from "@tanstack/react-router";
import { text, field, type RecordValue } from "@/lib/api/services/resources";
import { PrivateImage } from "./data-view";
export function MaterialCard({ listing }: { listing: RecordValue }) {
  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      <Link to="/marketplace/$id" params={{ id: text(listing.id) }}>
        <PrivateImage
          id={
            typeof field(listing, "images.0.uploadId") === "string"
              ? String(field(listing, "images.0.uploadId"))
              : undefined
          }
          alt={text(listing.title)}
        />
      </Link>
      <div className="space-y-2 p-5">
        <p className="text-xs font-semibold capitalize text-primary">{text(listing.material)}</p>
        <Link
          to="/marketplace/$id"
          params={{ id: text(listing.id) }}
          className="block font-display text-xl font-semibold"
        >
          {text(listing.title)}
        </Link>
        <p className="text-sm text-muted-foreground">
          {text(listing.grade)} · {text(listing.condition)}
        </p>
        <p className="text-xl font-semibold">
          ₦{text(listing.unitPrice)} / {text(listing.unit)}
        </p>
        <p className="text-sm">
          {text(listing.availableQuantity)} {text(listing.unit)} available · minimum{" "}
          {text(listing.minOrder)}
        </p>
        <p className="text-sm text-muted-foreground">
          {text(listing.area)}, {text(listing.city)}
        </p>
        <p className="border-t pt-2 text-sm">
          {text(
            field(listing, "seller.displayName") ||
              [field(listing, "seller.firstName"), field(listing, "seller.lastName")]
                .filter(Boolean)
                .join(" "),
          )}
        </p>
      </div>
    </article>
  );
}
