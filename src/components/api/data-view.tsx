import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, useApiSession, useClientReady } from "@/lib/api/hooks/use-api";
import { ApiError, errorMessage, request } from "@/lib/api/client";
import {
  readResource,
  writeResource,
  record,
  rows,
  field,
  text,
  type Access,
  type RecordValue,
} from "@/lib/api/services/resources";
import { Panel, PageTitle } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/field";
import { StatusChip } from "@/components/status-chip";
import { useTradeGate } from "@/components/gate";
import { getUploadAccess, MAX_UPLOAD_BYTES, validateDocument } from "@/lib/api/services/uploads";

export function useResource(path: string, access: Access = "private", enabled = true) {
  const session = useApiSession();
  const ready = useClientReady();
  return useQuery({
    queryKey: ["api", "resource", session.data?.user.id || "guest", path],
    queryFn: () => readResource(path, access),
    enabled:
      enabled &&
      ready &&
      (access === "public" ||
        (session.isSuccess && (access === "optional" || Boolean(session.data)))),
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
    staleTime: 15000,
  });
}
export function QueryState({
  query,
  children,
}: {
  query: ReturnType<typeof useResource>;
  children: (data: unknown) => ReactNode;
}) {
  if (query.isPending)
    return (
      <p role="status" className="py-6 text-muted-foreground">
        Loading…
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="rounded-2xl border bg-card p-6">
        <p>{errorMessage(query.error)}</p>
        <Button className="mt-3" variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
        {query.error instanceof ApiError && query.error.status === 401 && (
          <Link to="/login" className="ml-4 text-primary">
            Sign in
          </Link>
        )}
      </div>
    );
  return <>{children(query.data.data)}</>;
}
export interface Column {
  key: string;
  label: string;
  link?: (row: RecordValue) => string;
  status?: boolean;
}
export function DataTable({
  path,
  title,
  columns,
  access = "private",
  empty = "No records yet.",
  actions,
}: {
  path: string;
  title: string;
  columns: Column[];
  access?: Access;
  empty?: string;
  actions?: (row: RecordValue) => ReactNode;
}) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [path]);
  const query = useResource(
    path + (path.includes("?") ? "&" : "?") + `page=${page}&limit=20`,
    access,
  );
  return (
    <Panel title={title}>
      <QueryState query={query}>
        {(data) =>
          rows(data).length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th className="p-3" key={c.key}>
                        {c.label}
                      </th>
                    ))}
                    {actions && <th className="p-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows(data).map((row, index) => (
                    <tr
                      className="border-t"
                      key={typeof row.id === "string" ? row.id : page + "-" + index}
                    >
                      {columns.map((c) => (
                        <td className="max-w-sm break-words p-3" key={c.key}>
                          {c.link ? (
                            <Link
                              to={c.link(row) as "/"}
                              className="font-medium text-primary underline-offset-2 hover:underline"
                            >
                              {text(field(row, c.key))}
                            </Link>
                          ) : c.status ? (
                            <StatusChip status={text(field(row, c.key))} />
                          ) : (
                            text(field(row, c.key))
                          )}
                        </td>
                      ))}
                      {actions && <td className="p-3">{actions(row)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-muted-foreground">{empty}</p>
          )
        }
      </QueryState>
      {query.data?.pagination && (
        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="outline"
            disabled={page === 1 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} · {query.data.pagination.total} records
          </span>
          <Button
            variant="outline"
            disabled={page * 20 >= query.data.pagination.total || query.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </Panel>
  );
}
export function Summary({
  path,
  title,
  fields,
  access = "private",
}: {
  path: string;
  title: string;
  fields: Column[];
  access?: Access;
}) {
  const query = useResource(path, access);
  return (
    <Panel title={title}>
      <QueryState query={query}>
        {(data) => (
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((c) => (
              <div key={c.key}>
                <dt className="text-sm text-muted-foreground">{c.label}</dt>
                <dd className="mt-1 break-words text-xl font-semibold">
                  {c.status ? (
                    <StatusChip status={text(field(data, c.key))} />
                  ) : (
                    text(field(data, c.key))
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </QueryState>
    </Panel>
  );
}
export interface FormField {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "email"
    | "tel"
    | "password"
    | "number"
    | "date"
    | "datetime-local"
    | "checkbox"
    | "select"
    | "upload";
  options?: (string | { value: string; label: string })[];
  placeholder?: string;
  pattern?: string;
  inputMode?: "text" | "decimal" | "numeric";
  minDate?: string;
  required?: boolean;
  value?: string | boolean;
  purpose?: string;
  min?: number;
  max?: number;
  step?: string;
}
export function ActionForm({
  title,
  button = "Save",
  fields,
  path,
  method = "POST",
  body: makeBody,
  access = "private",
  onSuccess,
  embedded = false,
}: {
  title: string;
  button?: string;
  fields: FormField[];
  path: string;
  method?: string;
  body?: (values: RecordValue) => unknown;
  access?: Access;
  onSuccess?: (data: unknown) => void;
  embedded?: boolean;
}) {
  const qc = useQueryClient();
  const gate = useTradeGate();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const mutation = useMutation({
    mutationFn: (body: unknown) => writeResource(path, method, body, access),
    retry: false,
    onError: async () => {
      await qc.invalidateQueries({ queryKey: ["api", "resource"] });
    },
    onSuccess: async (result) => {
      setSuccess("Saved successfully.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["api", "resource"] }),
        qc.invalidateQueries({ queryKey: apiKeys.profile }),
      ]);
      onSuccess?.(result.data);
    },
  });
  const ready = useClientReady();
  const pending = !ready || mutation.isPending || uploading || checking;
  return (
    <Panel
      title={embedded ? undefined : title}
      className={embedded ? "rounded-none border-0 bg-transparent p-0 md:p-0" : undefined}
    >
      <form
        aria-label={title}
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setSuccess("");
          const data = new FormData(event.currentTarget);
          const values: RecordValue = {};
          for (const f of fields) {
            const v =
              f.type === "upload"
                ? uploads[f.name]
                : f.type === "checkbox"
                  ? data.has(f.name)
                  : data.get(f.name);
            if (v !== null && v !== undefined && v !== "")
              values[f.name] = f.type === "number" ? Number(v) : v;
          }
          const save = async () => {
            try {
              await mutation.mutateAsync(makeBody ? makeBody(values) : values);
            } catch (cause) {
              setError(errorMessage(cause));
            }
          };
          if (/^\/(buyer-requests|offers|listings)(\/|$)/.test(path)) {
            setChecking(true);
            try {
              await gate(
                {
                  path: window.location.pathname + window.location.search,
                  label: title,
                  level: "basic",
                },
                save,
              );
            } finally {
              setChecking(false);
            }
          } else await save();
        }}
      >
        <fieldset disabled={pending} className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => (
            <Field
              key={f.name}
              htmlFor={`${path}-${f.name}`}
              label={f.label}
              className={f.type === "textarea" ? "md:col-span-2" : undefined}
            >
              {f.type === "upload" ? (
                <input
                  id={`${path}-${f.name}`}
                  aria-label={f.label}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  required={f.required && !uploads[f.name]}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setError("");
                    setSuccess("");
                    setUploading(true);
                    try {
                      validateDocument(file);
                      if (
                        ["listing_image", "article_image", "campaign_creative"].includes(
                          f.purpose || "",
                        ) &&
                        !file.type.startsWith("image/")
                      )
                        throw new Error("Choose an image file.");
                      const body = new FormData();
                      body.append("purpose", f.purpose || "verification_document");
                      body.append("file", file);
                      const result = await request<{ data: { id: string; status: string } }>(
                        "/uploads",
                        { method: "POST", body },
                      );
                      if (result.data.status !== "ready") throw new Error("File is not ready.");
                      setUploads((old) => ({ ...old, [f.name]: result.data.id }));
                    } catch (cause) {
                      event.target.value = "";
                      setError(errorMessage(cause));
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              ) : f.type === "select" ? (
                <select
                  className={inputCls}
                  id={`${path}-${f.name}`}
                  name={f.name}
                  defaultValue={typeof f.value === "string" ? f.value : undefined}
                  required={f.required}
                >
                  {f.placeholder && (
                    <option value="" disabled>
                      {f.placeholder}
                    </option>
                  )}
                  {!f.required && <option value="">No change</option>}
                  {f.options?.map((option) => {
                    const value = typeof option === "string" ? option : option.value;
                    return (
                      <option key={value} value={value}>
                        {typeof option === "string" ? value.replaceAll("_", " ") : option.label}
                      </option>
                    );
                  })}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  className={inputCls}
                  id={`${path}-${f.name}`}
                  name={f.name}
                  required={f.required}
                  defaultValue={String(f.value || "")}
                  placeholder={f.placeholder}
                  minLength={f.min}
                  maxLength={f.max || 5000}
                />
              ) : f.type === "checkbox" ? (
                <input
                  id={`${path}-${f.name}`}
                  type="checkbox"
                  name={f.name}
                  defaultChecked={Boolean(f.value)}
                  required={f.required}
                />
              ) : (
                <input
                  className={inputCls}
                  id={`${path}-${f.name}`}
                  name={f.name}
                  type={f.type || "text"}
                  pattern={f.pattern}
                  inputMode={f.inputMode}
                  placeholder={f.placeholder}
                  required={f.required}
                  defaultValue={typeof f.value === "string" ? f.value : undefined}
                  minLength={f.type === "number" ? undefined : f.min}
                  maxLength={f.type === "number" ? undefined : f.max}
                  min={f.type === "date" ? f.minDate : f.type === "number" ? f.min : undefined}
                  max={f.type === "number" ? f.max : undefined}
                  step={f.step}
                />
              )}
            </Field>
          ))}
          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              {uploading ? "Uploading…" : mutation.isPending ? "Saving…" : button}
            </Button>
          </div>
        </fieldset>
        {Object.keys(uploads).length > 0 && (
          <p className="text-xs text-muted-foreground">
            Documents uploaded privately. Maximum {MAX_UPLOAD_BYTES / 1024 / 1024} MiB per file.
          </p>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-primary">
            {success}
          </p>
        )}
      </form>
    </Panel>
  );
}
export function ResourcePage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageTitle title={title} intro={intro} />
      {children}
    </div>
  );
}
export function ActionButton({
  path,
  method = "POST",
  body,
  children,
  disabled = false,
  onSuccess,
  variant = "outline",
}: {
  path: string;
  method?: string;
  body?: unknown;
  children: ReactNode;
  disabled?: boolean;
  onSuccess?: (data: unknown) => void;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
}) {
  const qc = useQueryClient();
  const gate = useTradeGate();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: () => writeResource(path, method, body),
    retry: false,
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["api", "resource"] });
      onSuccess?.(result.data);
    },
    onError: async (cause) => {
      setError(errorMessage(cause));
      await qc.invalidateQueries({ queryKey: ["api", "resource"] });
    },
  });
  return (
    <span className="inline-flex flex-col gap-2">
      <Button
        size="sm"
        variant={variant}
        disabled={disabled || mutation.isPending || checking}
        onClick={() => {
          setError("");
          if (/^\/(offers|listings)(\/|$)/.test(path)) {
            setChecking(true);
            void gate(
              {
                path: window.location.pathname + window.location.search,
                label: typeof children === "string" ? children : "Continue Marketplace action",
                level: "basic",
              },
              async () => {
                try {
                  await mutation.mutateAsync();
                } catch {
                  /* onError renders the backend message */
                }
              },
            ).finally(() => setChecking(false));
          } else mutation.mutate();
        }}
      >
        {mutation.isPending ? "Saving…" : children}
      </Button>
      {error && (
        <span role="alert" className="text-sm text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
export function PrivateImage({ id, alt }: { id?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const query = useQuery({
    queryKey: ["api", "file", id],
    queryFn: () => getUploadAccess(id!),
    enabled: Boolean(id),
    retry: false,
    staleTime: 240000,
    gcTime: 240000,
  });
  if (!id || query.isError || failed)
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-secondary text-sm text-muted-foreground">
        {query.isError || failed ? "Image unavailable" : "No image"}
      </div>
    );
  return query.data ? (
    <img
      className="aspect-video w-full rounded-xl object-cover"
      src={query.data.data.url}
      alt={alt}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="aspect-video animate-pulse rounded-xl bg-secondary" />
  );
}
