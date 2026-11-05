import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell, PageHero } from "@/components/site-chrome";
import { useDB } from "@/lib/store";
import { img } from "@/lib/images";
import { day } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DemoTag } from "@/components/brand";

export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title: "Articles & insights | AkuMart" },
      { name: "description", content: "Guides on grading recyclables, AkuBin rewards, logistics and trust & safety." },
      { property: "og:title", content: "AkuMart articles" },
      { property: "og:description", content: "Practical recycling and trading guides from AkuMart." },
    ],
  }),
  component: Articles,
});

function Articles() {
  const articles = useDB((d) => d.articles.filter((a) => a.status === "published"));
  const news = useDB((d) => d.news.filter((n) => n.status === "approved"));
  const cats = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];
  const [cat, setCat] = useState("All");
  const list = articles.filter((a) => cat === "All" || a.category === cat);
  const [lead, ...rest] = list;
  return (
    <PublicShell>
      <PageHero eyebrow="Knowledge" title="Articles & insights" intro="Editor-reviewed guides and news. External news is only published after editorial approval." />
      <section className="container-page py-14">
        <div className="mb-10 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("rounded-full border px-4 py-1.5 text-sm", cat === c ? "border-forest bg-forest text-forest-foreground" : "hover:bg-secondary")}>
              {c}
            </button>
          ))}
        </div>
        {!lead && <p className="text-muted-foreground">No articles in this category yet.</p>}
        {lead && (
          <Link to="/articles/$slug" params={{ slug: lead.slug }} className="group grid items-center gap-8 lg:grid-cols-2">
            <img src={img(lead.image)} alt="" className="aspect-[16/10] w-full rounded-[2rem] object-cover" />
            <div>
              <p className="eyebrow text-primary">{lead.category}</p>
              <h2 className="text-display mt-3 text-3xl group-hover:text-primary md:text-4xl">{lead.title}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{lead.excerpt}</p>
              <p className="mt-4 text-sm text-muted-foreground">
                {day(lead.publishedAt)} · {lead.readMins} min read
              </p>
            </div>
          </Link>
        )}
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {rest.map((a) => (
            <Link key={a.id} to="/articles/$slug" params={{ slug: a.slug }} className="group">
              <img src={img(a.image)} alt="" loading="lazy" className="aspect-[16/10] w-full rounded-2xl object-cover" />
              <p className="eyebrow mt-4 text-primary">{a.category}</p>
              <h3 className="mt-2 font-display text-xl font-semibold group-hover:text-primary">{a.title}</h3>
            </Link>
          ))}
        </div>
        {news.length > 0 && (
          <div className="mt-20">
            <h2 className="text-display mb-6 text-2xl">Editor-approved news</h2>
            <ul className="divide-y rounded-2xl border">
              {news.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.source}</p>
                  </div>
                  <DemoTag>Demo news</DemoTag>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </PublicShell>
  );
}
