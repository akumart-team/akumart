import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Share2 } from "lucide-react";
import { toast } from "sonner";
import { PublicShell } from "@/components/site-chrome";
import { useDB, useMe, updateMe } from "@/lib/store";
import { img } from "@/lib/images";
import { day } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/articles/$slug")({
  head: () => ({
    meta: [
      { title: "Article — AkuMart" },
      { name: "description", content: "An AkuMart guide on recycling and trading recyclable materials." },
      { property: "og:title", content: "AkuMart article" },
      { property: "og:description", content: "Read this guide on AkuMart." },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const a = useDB((d) => d.articles.find((x) => x.slug === slug));
  const me = useMe();
  if (!a || a.status !== "published")
    return (
      <PublicShell>
        <div className="container-page py-32 text-center">
          <h1 className="text-display text-4xl">Article not found</h1>
          <Link to="/articles" className="mt-4 inline-block text-primary">
            Back to articles
          </Link>
        </div>
      </PublicShell>
    );
  const saved = me?.savedArticles.includes(a.id);
  return (
    <PublicShell>
      <article className="container-page max-w-3xl py-16">
        <Link to="/articles" className="text-sm text-primary">
          ← Articles
        </Link>
        <p className="eyebrow mt-8 text-primary">{a.category}</p>
        <h1 className="text-display mt-3 text-4xl md:text-5xl">{a.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {a.author} · {day(a.publishedAt)} · {a.readMins} min read
        </p>
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!me) return toast("Sign in to save articles");
              updateMe((u) => {
                u.savedArticles = saved ? u.savedArticles.filter((x) => x !== a.id) : [...u.savedArticles, a.id];
              });
            }}
          >
            <Bookmark /> {saved ? "Saved" : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success("Link copied");
            }}
          >
            <Share2 /> Share
          </Button>
        </div>
        <img src={img(a.image)} alt="" className="mt-10 aspect-[16/9] w-full rounded-[2rem] object-cover" />
        <div className="mt-10 space-y-6 text-lg leading-relaxed text-ink/85">
          {a.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>
    </PublicShell>
  );
}
