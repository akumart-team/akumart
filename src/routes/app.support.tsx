import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle, Panel, Table, td } from "@/components/app-ui";
import { StatusChip } from "@/components/status-chip";
import { Field, inputCls } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDB, useMe } from "@/lib/store";
import { createTicket } from "@/lib/actions";
import { dt } from "@/lib/format";

export const Route = createFileRoute("/app/support")({
  component: Support,
});

function Support() {
  const me = useMe()!;
  const tickets = useDB((d) => d.tickets.filter((t) => t.userId === me.id));
  const [f, setF] = useState({ subject: "", message: "" });
  return (
    <div className="max-w-4xl">
      <PageTitle title="Support" intro="Your tickets, including those created from the assistant." />
      <Panel title="New ticket" className="mb-6">
        <div className="grid gap-4">
          <Field label="Subject">
            <input className={inputCls} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
          </Field>
          <Field label="Message">
            <Textarea rows={4} className="rounded-xl" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          </Field>
          <Button
            className="justify-self-start"
            onClick={() => {
              if (!f.subject || f.message.length < 10) return toast.error("Add a subject and a 10+ character message");
              const id = createTicket({ userId: me.id, name: me.name, email: me.email, subject: f.subject, message: f.message, channel: "contact", priority: "normal" });
              setF({ subject: "", message: "" });
              toast.success(`Ticket ${id} created`);
            }}
          >
            Submit ticket
          </Button>
        </div>
      </Panel>
      <Table head={["Ticket", "Subject", "Channel", "Status", "Created"]}>
        {tickets.length === 0 ? (
          <tr>
            <td className={td} colSpan={5}>
              No tickets yet.
            </td>
          </tr>
        ) : (
          tickets.map((t) => (
            <tr key={t.id}>
              <td className={td}>{t.id}</td>
              <td className={td}>{t.subject}</td>
              <td className={td}>{t.channel.replace("_", " ")}</td>
              <td className={td}>
                <StatusChip status={t.status} />
              </td>
              <td className={td}>{dt(t.at)}</td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
}
