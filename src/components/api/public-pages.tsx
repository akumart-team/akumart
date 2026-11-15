import { CampaignPlacements } from "./discovery";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell } from "@/components/site-chrome";
import { Panel } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { record, rows, text } from "@/lib/api/services/resources";
import { useProfile } from "@/lib/api/hooks/use-api";
import {
  ActionButton,
  ActionForm,
  DataTable,
  PrivateImage,
  QueryState,
  ResourcePage,
  useResource,
} from "./data-view";
const c = (key: string, label: string) => ({ key, label });
export function Articles() {
  return (
    <PublicShell>
      <div className="container-page py-12">
        <ResourcePage
          title="Articles & insights"
          intro="Published guides and editor-approved news."
        >
          <CampaignPlacements placement="articles" />
          <DataTable
            title="Articles"
            path="/articles"
            access="public"
            columns={[
              { key: "title", label: "Article", link: (r) => "/articles/" + r.slug },
              c("excerpt", "Overview"),
              c("category", "Category"),
              c("readMinutes", "Minutes"),
            ]}
          />
          <DataTable
            title="News"
            path="/news"
            access="public"
            columns={[c("title", "Headline"), c("source", "Source"), c("summary", "Summary")]}
          />
        </ResourcePage>
      </div>
    </PublicShell>
  );
}
export function Article({ slug }: { slug: string }) {
  const query = useResource("/articles/" + encodeURIComponent(slug), "public");
  const profile = useProfile();
  return (
    <PublicShell>
      <div className="container-page max-w-4xl space-y-6 py-12">
        <Link to="/articles" className="text-primary">
          ← Articles
        </Link>
        <QueryState query={query}>
          {(data) => {
            const row = record(data);
            return (
              <>
                <h1 className="text-display text-4xl">{text(row.title)}</h1>
                <p className="text-muted-foreground">
                  {text(row.category)} · {text(row.readMinutes)} minute read
                </p>
                {typeof row.imageId === "string" && (
                  <PrivateImage id={row.imageId} alt={text(row.title)} />
                )}
                <p className="text-lg">{text(row.excerpt)}</p>
                <div className="whitespace-pre-wrap leading-relaxed">{text(row.body)}</div>
                {profile.data && (
                  <ActionButton method="PUT" path={"/users/me/saved-articles/" + row.id}>
                    Save article
                  </ActionButton>
                )}
              </>
            );
          }}
        </QueryState>
      </div>
    </PublicShell>
  );
}
export function ArticlePreview() {
  const query = useResource("/articles?limit=3", "public");
  return (
    <QueryState query={query}>
      {(data) =>
        rows(data).length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {rows(data).map((row) => (
              <Panel key={text(row.id)} title={text(row.title)}>
                <p className="text-sm text-muted-foreground">{text(row.excerpt)}</p>
                <Link
                  className="mt-4 inline-block text-primary"
                  to="/articles/$slug"
                  params={{ slug: text(row.slug) }}
                >
                  Read article →
                </Link>
              </Panel>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Published articles will appear here.</p>
        )
      }
    </QueryState>
  );
}
export function Contact({ initialTopic = "general" }: { initialTopic?: string }) {
  const [topic, setTopic] = useState(
    ["general", "support", "business", "logistics"].includes(initialTopic)
      ? initialTopic
      : "general",
  );
  return (
    <PublicShell>
      <div className="container-page max-w-4xl py-12">
        <ResourcePage title="How can we help?" intro="Send an enquiry or contact the support team.">
          <div className="flex flex-wrap gap-3">
            {["general", "support", "business", "logistics"].map((value) => (
              <Button
                key={value}
                variant={topic === value ? "default" : "outline"}
                onClick={() => setTopic(value)}
              >
                {value === "general"
                  ? "General enquiry"
                  : value === "support"
                    ? "Support"
                    : value === "business"
                      ? "Business partnership"
                      : "Logistics"}
              </Button>
            ))}
          </div>
          {topic === "logistics" && (
            <Panel title="Logistics partner applications">
              <p>
                For document review, vehicle details and delivery jobs, apply through your account.
              </p>
              <Button asChild className="mt-3">
                <Link to="/app/partner">Open partner application</Link>
              </Button>
            </Panel>
          )}
          <ActionForm
            key={topic}
            title={topic === "support" ? "Contact support" : "Send enquiry"}
            button="Send message"
            access="optional"
            path={topic === "support" ? "/support/tickets" : "/enquiries"}
            fields={[
              { name: "name", label: "Your name", required: true, max: 100 },
              { name: "email", label: "Email", type: "email", required: true },
              { name: "subject", label: "Subject", required: true, max: 200 },
              { name: "message", label: "Message", type: "textarea", required: true, max: 5000 },
            ]}
            body={(v) =>
              topic === "support"
                ? { ...v, channel: "contact" }
                : {
                    name: v.name,
                    email: v.email,
                    kind: topic,
                    data: { subject: v.subject, message: v.message },
                  }
            }
          />
        </ResourcePage>
      </div>
    </PublicShell>
  );
}
export function Advertise() {
  return (
    <PublicShell>
      <div className="container-page py-12">
        <ResourcePage
          title="Advertise with AkuMart"
          intro="Reach the recycling and materials community with an approved campaign."
        >
          <DataTable
            title="Advertising packages"
            path="/advertising/packages"
            access="public"
            columns={[c("name", "Package"), c("durationDays", "Days"), c("price", "Price (₦)")]}
          />
          <p>Payment activation is currently unavailable.</p>
          <Button asChild>
            <Link to="/app/advertise">Manage campaigns</Link>
          </Button>
        </ResourcePage>
      </div>
    </PublicShell>
  );
}
