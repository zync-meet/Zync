import { formatDistanceToNow } from "date-fns";
import { Activity, CheckCircle2, Clock3, ListTodo, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MobileActivityLogViewProps {
  activityLogs: any[];
  tasks: any[];
  elapsedTime: string;
  onClearLogs: () => void;
  onDeleteLog: (id: string) => void;
}

const normalizeStatus = (value: unknown) => String(value ?? "").toLowerCase().trim();

const isCompleted = (task: any) => {
  const status = normalizeStatus(task?.status);
  return status.includes("complete") || status === "done";
};

const isInProgress = (task: any) => {
  if (isCompleted(task)) return false;
  const status = normalizeStatus(task?.status);
  return status.includes("progress") || status === "active" || status === "in review";
};

const isOverdue = (task: any) => {
  if (isCompleted(task)) return false;
  const due = task?.dueDate || task?.deadline;
  if (!due) return false;
  return new Date(due).getTime() < Date.now();
};

const MobileActivityLogView = ({
  activityLogs,
  tasks,
  elapsedTime,
  onClearLogs,
  onDeleteLog,
}: MobileActivityLogViewProps) => {
  const totalTasks = tasks.length;
  const completed = tasks.filter(isCompleted).length;
  const inProgress = tasks.filter(isInProgress).length;
  const overdue = tasks.filter(isOverdue).length;

  return (
    <div className="p-4 space-y-4">
      <Card className="bg-card/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Current session: {elapsedTime}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/60 p-2">
              <p className="text-[11px] text-muted-foreground">Total Tasks</p>
              <p className="text-lg font-semibold">{totalTasks}</p>
            </div>
            <div className="rounded-lg border border-border/60 p-2">
              <p className="text-[11px] text-muted-foreground">Completed</p>
              <p className="text-lg font-semibold">{completed}</p>
            </div>
            <div className="rounded-lg border border-border/60 p-2">
              <p className="text-[11px] text-muted-foreground">In Progress</p>
              <p className="text-lg font-semibold">{inProgress}</p>
            </div>
            <div className="rounded-lg border border-border/60 p-2">
              <p className="text-[11px] text-muted-foreground">Overdue</p>
              <p className="text-lg font-semibold">{overdue}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/70">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          {activityLogs.length > 0 && (
            <Button size="sm" variant="outline" onClick={onClearLogs}>
              Clear
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
          ) : (
            activityLogs.slice(0, 20).map((log) => {
              const start = new Date(log.startTime);
              const title = log.title || log.eventType || "Activity session";
              return (
                <div key={log._id} className="rounded-lg border border-border/60 p-3 flex items-start gap-2">
                  <Clock3 className="h-4 w-4 text-primary mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(start, { addSuffix: true })}
                    </p>
                  </div>
                  {log._id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => onDeleteLog(log._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileActivityLogView;
