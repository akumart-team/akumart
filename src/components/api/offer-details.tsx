import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { rows, record, text, field } from "@/lib/api/services/resources";
import { QueryState, useResource } from "./data-view";
export function OfferDetails({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const query = useResource("/offers/" + encodeURIComponent(id), "private", open);
  return (
    <details
      className="mt-4 rounded-xl border p-4"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm font-medium text-primary">
        Negotiation history and order
      </summary>
      {open && (
        <div className="mt-4">
          <QueryState query={query}>
            {(data) => {
              const offer = record(data);
              return (
                <>
                  <ol className="space-y-3">
                    {rows(offer.steps).map((step) => (
                      <li className="rounded-xl bg-muted/40 p-3 text-sm" key={text(step.id)}>
                        <p className="font-medium capitalize">
                          {text(step.action)} · {text(step.quantity)} units at ₦
                          {text(step.unitPrice)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{text(step.createdAt)}</p>
                        {Array.isArray(step.conditions) && step.conditions.length > 0 && (
                          <p>{text(step.conditions)}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                  {typeof field(offer, "order.id") === "string" && (
                    <Link
                      className="mt-4 inline-block text-sm font-semibold text-primary"
                      to="/app/orders/$id"
                      params={{ id: text(field(offer, "order.id")) }}
                    >
                      Open the accepted order →
                    </Link>
                  )}
                </>
              );
            }}
          </QueryState>
        </div>
      )}
    </details>
  );
}
