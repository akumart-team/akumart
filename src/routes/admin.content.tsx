import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Panel, Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, inputCls } from "@/components/field";
import { useDB, update } from "@/lib/store";
import { useActor } from "@/lib/admin";
import { dt, nowIso, uid } from "@/lib/format";

export const Route = createFileRoute("/admin/content")({
  component: Content,
});

function Content() {
  const articles = useDB((d) => d.articles);
  const news = useDB((d) => d.news);
  const actor = useActor();
  const [f, setF] = useState({ title: "", category: "Guides", excerpt: "", body: "", image: "materials" });
  const log = (action: string, detail: string) => update((d) => d.audit.unshift({ at: nowIso(), actor, action, detail }));
  return (
    <div className="space-y-8">
      <h1 className="text-display text-3xl">Content & editorial</h1>
      <Panel title="News candidates (AI-proposed, simulated), editor approval required">
        <Table head={["Headline", "Source", "Proposed", "Status", ""]}>
          {news.map((n) => (
            <tr key={n.id}>
              <td className={td}>
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.summary}</p>
              </td>
              <td className={td}>{n.source}</td>
              <td className={td}>{dt(n.at)}</td>
              <td className={td}>
                <StatusChip status={n.status} />
              </td>
              <td className={td}>
                <div className="flex gap-1">
                  {n.status !== "approved" && (
                    <Button size="sm" onClick={() => { update((d) => (d.news.find((x) => x.id === n.id)!.status = "approved")); log("News approved", n.title); }}>
                      Approve & publish
                    </Button>
                  )}
                  {n.status !== "rejected" && (
                    <Button size="sm" variant="ghost" onClick={() => { update((d) => (d.news.find((x) => x.id === n.id)!.status = "rejected")); log("News rejected", n.title); }}>
                      {n.status === "approved" ? "Unpublish" : "Reject"}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Articles">
        <Table head={["Title", "Category", "Status", ""]}>
          {articles.map((a) => (
            <tr key={a.id}>
              <td className={td}>{a.title}</td>
              <td className={td}>{a.category}</td>
              <td className={td}>
                <StatusChip status={a.status} />
              </td>
              <td className={td}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    update((d) => {
                      const x = d.articles.find((y) => y.id === a.id)!;
                      x.status = x.status === "published" ? "unpublished" : "published";
                      if (x.status === "published") x.publishedAt = nowIso();
                    });
                    log(a.status === "published" ? "Article unpublished" : "Article published", a.title);
                  }}
                >
                  {a.status === "published" ? "Unpublish" : "Publish"}
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Write an article">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" className="md:col-span-2">
            <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </Field>
          <Field label="Category">
            <input className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          </Field>
          <Field label="Image">
            <select className={inputCls} value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })}>
              {["materials", "plastic", "metal", "cardboard", "kiosk", "truck", "yard"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
          <Field label="Excerpt" className="md:col-span-2">
            <input className={inputCls} value={f.excerpt} onChange={(e) => setF({ ...f, excerpt: e.target.value })} />
          </Field>
          <Field label="Body (blank line between paragraphs)" className="md:col-span-2">
            <Textarea rows={6} className="rounded-xl" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          {(["draft", "published"] as const).map((st) => (
            <Button
              key={st}
              variant={st === "draft" ? "outline" : "default"}
              onClick={() => {
                if (f.title.length < 5 || f.body.length < 20) return toast.error("Add a title and body");
                const slug = f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + uid("").slice(1).toLowerCase();
                update((d) => d.articles.unshift({ id: uid("a"), slug, title: f.title, excerpt: f.excerpt, body: f.body.split(/\n\s*\n/), category: f.category, author: actor, readMins: Math.max(1, Math.round(f.body.split(" ").length / 200)), image: f.image, status: st, publishedAt: nowIso() }));
                log(`Article ${st}`, f.title);
                setF({ title: "", category: "Guides", excerpt: "", body: "", image: "materials" });
                toast.success(st === "draft" ? "Draft saved" : "Article published");
              }}
            >
              {st === "draft" ? "Save draft" : "Publish"}
            </Button>
          ))}
        </div>
      </Panel>
    </div>
  );
}
