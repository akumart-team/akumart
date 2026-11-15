import { useState } from "react";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import { rows, record, text } from "@/lib/api/services/resources";
import { workflowPaths } from "@/lib/api/services/workflows";
import { dateLabel, decimalLabel, nairaLabel } from "@/lib/api/display";
import { useProfile } from "@/lib/api/hooks/use-api";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ActionButton, QueryState, useResource } from "./data-view";
import { WorkflowEmpty, WorkflowMetric } from "./workflow-ui";
export function RequestResponses({ id, title }: { id: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const me = useProfile();
  const query = useResource(workflowPaths.request(id), "private", open);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          View responses
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto rounded-3xl p-5 sm:p-7">
        <DialogHeader className="text-left">
          <DialogTitle className="pr-6 font-display text-2xl">Supplier responses</DialogTitle>
          <DialogDescription className="break-words">
            {title || "Compare supplier terms and shortlist the responses that fit your needs."}
          </DialogDescription>
        </DialogHeader>
        <QueryState query={query}>
          {(data) => {
            const request = record(data);
            return rows(request.responses).length ? (
              <ul className="space-y-4">
                {rows(request.responses).map((response, index) => (
                  <li key={text(response.id)} className="space-y-4 rounded-2xl border p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Supplier response {index + 1}
                      </p>
                      <StatusChip status={text(response.status)} />
                    </div>
                    <dl className="grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-4">
                      <WorkflowMetric label="Available quantity">
                        {decimalLabel(response.quantity)} {text(request.unit)}
                      </WorkflowMetric>
                      <WorkflowMetric label="Unit price">
                        {nairaLabel(response.unitPrice)}
                      </WorkflowMetric>
                    </dl>
                    <p className="break-words text-sm leading-relaxed text-muted-foreground">
                      {text(response.note)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated {dateLabel(response.updatedAt || response.createdAt)}
                    </p>
                    {request.buyerId === me.data?.id && (
                      <div className="flex flex-wrap gap-2 border-t pt-4">
                        <ActionButton
                          variant="default"
                          path={workflowPaths.response(id, text(response.id))}
                          method="PATCH"
                          body={{ status: "shortlisted", expectedUpdatedAt: response.updatedAt }}
                          disabled={response.status === "shortlisted"}
                        >
                          Shortlist response
                        </ActionButton>
                        <ActionButton
                          path={workflowPaths.response(id, text(response.id))}
                          method="PATCH"
                          body={{ status: "declined", expectedUpdatedAt: response.updatedAt }}
                          disabled={response.status === "declined"}
                        >
                          Decline response
                        </ActionButton>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <WorkflowEmpty
                title="No supplier responses yet"
                body="Responses will appear here when suppliers reply to your request."
              />
            );
          }}
        </QueryState>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Shortlisting helps you compare suppliers. It does not create an order or reserve
          materials.
        </p>
      </DialogContent>
    </Dialog>
  );
}
