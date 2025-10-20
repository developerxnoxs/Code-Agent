import { useEffect, useRef } from "react";
import { Activity, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { ConsoleLog, AgentTask } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface AgentConsoleProps {
  logs: ConsoleLog[];
  currentTask?: AgentTask;
}

export function AgentConsole({ logs, currentTask }: AgentConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (level: string) => {
    switch (level) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-chart-3" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-chart-4" />;
      default:
        return <Info className="w-4 h-4 text-chart-1" />;
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge variant="default" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Running
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="bg-chart-3 hover:bg-chart-3">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-chart-2" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Agent Console</h2>
        </div>
        {currentTask && getTaskStatusBadge(currentTask.status)}
      </div>

      {currentTask && currentTask.status === "running" && (
        <div className="p-4 bg-card border-b border-border">
          <div className="flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-chart-2 animate-spin flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">Current Task</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{currentTask.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {currentTask.type.replace(/_/g, " ")}
                </Badge>
                {currentTask.startedAt && (
                  <span className="text-xs text-muted-foreground">
                    Started {formatDistanceToNow(new Date(currentTask.startedAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Activity className="w-12 h-12 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">Agent logs will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 mt-0.5">{getLogIcon(log.level)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground break-words">{log.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </span>
                    {log.metadata && (
                      <Badge variant="outline" className="text-xs">
                        {JSON.stringify(log.metadata).substring(0, 50)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
