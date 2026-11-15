import { useState } from "react";
import { Search, ShieldCheck, X } from "lucide-react";
import { Panel } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/field";
import { useProfile } from "@/lib/api/hooks/use-api";
import { text, field, type RecordValue } from "@/lib/api/services/resources";
import { workflowPaths } from "@/lib/api/services/workflows";
import { ActionForm, DataTable } from "./data-view";
type Selected = { id: string; email: string; role: string; active: boolean };
export function StaffManagement() {
  const me = useProfile();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [notice, setNotice] = useState("");
  if (me.data?.staff?.role !== "super" || !me.data.staff.active) return null;
  function choose(row: RecordValue, existing = false) {
    setSelected({
      id: text(existing ? row.profileId : row.id),
      email: text(existing ? field(row, "profile.email") : row.email),
      role: existing ? text(row.role) : "support",
      active: existing ? row.active === true : true,
    });
    setNotice("");
  }
  return (
    <section className="space-y-5" aria-label="Staff access management">
      <Panel title="Staff and permissions">
        <p className="text-sm text-muted-foreground">
          Assign staff access to an existing account. Buyer, seller and recycling preferences do not
          grant staff permissions.
        </p>
        <form
          className="mt-4 flex gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search.trim());
          }}
        >
          <input
            className={inputCls}
            aria-label="Search account email"
            type="email"
            required
            placeholder="Find an account by email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            Find account
          </Button>
        </form>
      </Panel>
      {notice && (
        <p role="status" className="text-sm text-primary">
          {notice}
        </p>
      )}
      {query && (
        <DataTable
          title="Matching accounts"
          path={"/admin/users?search=" + encodeURIComponent(query)}
          columns={[
            { key: "email", label: "Email" },
            { key: "displayName", label: "Name" },
          ]}
          actions={(row) => (
            <Button size="sm" variant="outline" onClick={() => choose(row)}>
              Manage access
            </Button>
          )}
        />
      )}
      <DataTable
        title="Staff memberships"
        path="/admin/staff"
        columns={[
          { key: "profile.email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "active", label: "Active" },
        ]}
        actions={(row) => (
          <Button size="sm" variant="outline" onClick={() => choose(row, true)}>
            Edit access
          </Button>
        )}
      />
      {selected && (
        <div className="relative rounded-3xl border border-primary/30 bg-primary/5 p-4">
          <Button
            className="absolute right-5 top-5 z-10"
            variant="ghost"
            size="icon"
            aria-label="Close staff editor"
            onClick={() => setSelected(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <p className="mb-4 flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4" />
            {selected.email}
          </p>
          {selected.id === me.data.id && (
            <p className="mb-4 text-sm text-muted-foreground">
              You are editing your own access. The last active super administrator cannot be
              removed.
            </p>
          )}
          <ActionForm
            key={selected.id + selected.role + selected.active}
            title="Update staff access"
            path={workflowPaths.staff(selected.id)}
            method="PUT"
            button="Save staff access"
            fields={[
              {
                name: "role",
                label: "Staff role",
                type: "select",
                required: true,
                options: ["support", "operations", "finance", "content", "super"],
                value: selected.role,
              },
              { name: "active", label: "Access enabled", type: "checkbox", value: selected.active },
              {
                name: "reason",
                label: "Reason for this change",
                required: true,
                min: 5,
                max: 1000,
              },
            ]}
            onSuccess={() => {
              setSelected(null);
              setNotice("Staff access updated. The change has been recorded in the audit log.");
            }}
          />
        </div>
      )}
    </section>
  );
}
