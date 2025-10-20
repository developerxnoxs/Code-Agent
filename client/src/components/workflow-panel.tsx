import { useState } from "react";
import { Workflow as WorkflowIcon, Plus, Play, Pause, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { Workflow } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface WorkflowPanelProps {
  workflows: Workflow[];
  onWorkflowCreate: (name: string, description: string) => void;
  onWorkflowStart: (workflowId: string) => void;
  onWorkflowStop: (workflowId: string) => void;
  onWorkflowDelete: (workflowId: string) => void;
}

export function WorkflowPanel({
  workflows,
  onWorkflowCreate,
  onWorkflowStart,
  onWorkflowStop,
  onWorkflowDelete,
}: WorkflowPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: "", description: "" });

  const handleCreateWorkflow = () => {
    if (newWorkflow.name.trim()) {
      onWorkflowCreate(newWorkflow.name, newWorkflow.description);
      setNewWorkflow({ name: "", description: "" });
      setIsDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
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
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const calculateProgress = (workflow: Workflow) => {
    if (!workflow.steps || workflow.steps.length === 0) return 0;
    const completedSteps = workflow.steps.filter((s) => s.status === "completed").length;
    return (completedSteps / workflow.steps.length) * 100;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <WorkflowIcon className="w-4 h-4 text-chart-2" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workflows</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6" data-testid="button-create-workflow">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workflow</DialogTitle>
              <DialogDescription>Define a new autonomous task sequence</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="Build authentication system"
                  data-testid="input-workflow-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Describe what this workflow should accomplish..."
                  rows={3}
                  data-testid="input-workflow-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow} data-testid="button-confirm-create-workflow">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <WorkflowIcon className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No workflows yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create autonomous task sequences</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {workflows.map((workflow) => {
              const progress = calculateProgress(workflow);

              return (
                <div
                  key={workflow.id}
                  className="p-3 rounded-md border border-border bg-card hover-elevate group"
                  data-testid={`workflow-${workflow.name}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-foreground truncate">{workflow.name}</h3>
                        {getStatusBadge(workflow.status)}
                      </div>
                      {workflow.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{workflow.description}</p>
                      )}
                    </div>
                  </div>

                  {workflow.steps && workflow.steps.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {workflow.steps.filter((s) => s.status === "completed").length} / {workflow.steps.length} steps
                        </span>
                        <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {workflow.createdAt &&
                        `Created ${formatDistanceToNow(new Date(workflow.createdAt), { addSuffix: true })}`}
                    </div>
                    <div className="flex items-center gap-1">
                      {workflow.status === "running" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onWorkflowStop(workflow.id)}
                          data-testid={`button-stop-workflow-${workflow.name}`}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Stop
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onWorkflowStart(workflow.id)}
                          data-testid={`button-start-workflow-${workflow.name}`}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onWorkflowDelete(workflow.id)}
                        data-testid={`button-delete-workflow-${workflow.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
