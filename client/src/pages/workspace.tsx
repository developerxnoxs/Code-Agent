import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { FileExplorer } from "@/components/file-explorer";
import { CodeEditor } from "@/components/code-editor";
import { TerminalPanel } from "@/components/terminal-panel";
import { AgentConsole } from "@/components/agent-console";
import { DatabasePanel } from "@/components/database-panel";
import { SecretsPanel } from "@/components/secrets-panel";
import { WorkflowPanel } from "@/components/workflow-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Moon, Sun, Menu, Activity } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { useIsMobile } from "@/hooks/use-mobile";
import type { File, TerminalSession, ConsoleLog, AgentTask, DbSchema, Secret, Workflow } from "@shared/schema";

export default function Workspace() {
  const [activeView, setActiveView] = useState("files");
  const [openFiles, setOpenFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>();
  const [activeTerminalId, setActiveTerminalId] = useState<string>();
  const [mobileBottomPanel, setMobileBottomPanel] = useState<"terminal" | "console">("terminal");
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return (saved as "light" | "dark") || "dark";
  });
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Initialize theme on mount
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket((data) => {
    // Handle WebSocket messages
    if (data.type === "file_updated") {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    } else if (data.type === "terminal_output" || data.type === "terminal_updated") {
      queryClient.invalidateQueries({ queryKey: ["/api/terminals"] });
    } else if (data.type === "log_created") {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    } else if (data.type === "task_updated") {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/current-task"] });
    } else if (data.type === "workflow_updated") {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
    }
  });

  const { data: project } = useQuery({
    queryKey: ["/api/projects/current"],
  });

  const { data: files = [] } = useQuery<File[]>({
    queryKey: ["/api/files"],
    enabled: !!project,
  });

  const { data: terminals = [] } = useQuery<TerminalSession[]>({
    queryKey: ["/api/terminals"],
    enabled: !!project,
  });

  const { data: logs = [] } = useQuery<ConsoleLog[]>({
    queryKey: ["/api/logs"],
    enabled: !!project,
  });

  const { data: currentTask } = useQuery<AgentTask>({
    queryKey: ["/api/agent/current-task"],
    enabled: !!project,
  });

  const { data: schemas = [] } = useQuery<DbSchema[]>({
    queryKey: ["/api/database/schemas"],
    enabled: !!project,
  });

  const { data: secrets = [] } = useQuery<Secret[]>({
    queryKey: ["/api/secrets"],
    enabled: !!project,
  });

  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
    enabled: !!project,
  });

  const createFileMutation = useMutation({
    mutationFn: async (path: string) => {
      const fileName = prompt("Enter file name:");
      if (!fileName) return;
      const fullPath = path === "/" ? fileName : `${path}/${fileName}`;
      return apiRequest("POST", "/api/files", { path: fullPath, content: "", projectId: project?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "File created successfully" });
    },
  });

  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, content }: { fileId: string; content: string }) => {
      return apiRequest("PATCH", `/api/files/${fileId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "File saved successfully" });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return apiRequest("DELETE", `/api/files/${fileId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "File deleted successfully" });
    },
  });

  const createTerminalMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/terminals", { name: `Terminal ${terminals.length + 1}`, projectId: project?.id });
    },
    onSuccess: (newTerminal: TerminalSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminals"] });
      setActiveTerminalId(newTerminal.id);
      toast({ title: "Terminal created successfully" });
    },
  });

  const deleteTerminalMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest("DELETE", `/api/terminals/${sessionId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminals"] });
      toast({ title: "Terminal closed successfully" });
    },
  });

  const executeCommandMutation = useMutation({
    mutationFn: async ({ sessionId, command }: { sessionId: string; command: string }) => {
      return apiRequest("POST", `/api/terminals/${sessionId}/execute`, { command });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminals"] });
    },
  });

  const createSecretMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      return apiRequest("POST", "/api/secrets", { key, value, description, projectId: project?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/secrets"] });
      toast({ title: "Secret added successfully" });
    },
  });

  const deleteSecretMutation = useMutation({
    mutationFn: async (secretId: string) => {
      return apiRequest("DELETE", `/api/secrets/${secretId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/secrets"] });
      toast({ title: "Secret deleted successfully" });
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      return apiRequest("POST", "/api/workflows", { name, description, projectId: project?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow created successfully" });
    },
  });

  const startWorkflowMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      return apiRequest("POST", `/api/workflows/${workflowId}/start`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow started" });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!openFiles.find((f) => f.id === file.id)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFileId(file.id);
  };

  const handleFileClose = (fileId: string) => {
    const newOpenFiles = openFiles.filter((f) => f.id !== fileId);
    setOpenFiles(newOpenFiles);
    if (activeFileId === fileId && newOpenFiles.length > 0) {
      setActiveFileId(newOpenFiles[0].id);
    } else if (newOpenFiles.length === 0) {
      setActiveFileId(undefined);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Component untuk render left panel content
  const renderLeftPanelContent = () => {
    switch (activeView) {
      case "files":
        return (
          <FileExplorer
            files={files}
            onFileSelect={handleFileSelect}
            onFileCreate={(path) => createFileMutation.mutate(path)}
            onFileDelete={(id) => deleteFileMutation.mutate(id)}
            selectedFile={openFiles.find((f) => f.id === activeFileId)}
          />
        );
      case "database":
        return (
          <DatabasePanel
            schemas={schemas}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["/api/database/schemas"] })}
            onTableCreate={(name) => toast({ title: "Table creation", description: "Feature coming soon" })}
            onTableDelete={(id) => toast({ title: "Table deletion", description: "Feature coming soon" })}
            onTableSelect={(schema) => toast({ title: `Selected: ${schema.tableName}` })}
          />
        );
      case "secrets":
        return (
          <SecretsPanel
            secrets={secrets}
            onSecretCreate={(key, value, description) =>
              createSecretMutation.mutate({ key, value, description })
            }
            onSecretDelete={(id) => deleteSecretMutation.mutate(id)}
          />
        );
      case "workflows":
        return (
          <WorkflowPanel
            workflows={workflows}
            onWorkflowCreate={(name, description) => createWorkflowMutation.mutate({ name, description })}
            onWorkflowStart={(id) => startWorkflowMutation.mutate(id)}
            onWorkflowStop={(id) => toast({ title: "Stop workflow", description: "Feature coming soon" })}
            onWorkflowDelete={(id) => toast({ title: "Delete workflow", description: "Feature coming soon" })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />

        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between h-12 px-2 sm:px-4 border-b border-border bg-card">
            <div className="flex items-center gap-1 sm:gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              
              {/* Mobile: Show menu button for left panel */}
              {isMobile && (
                <Sheet open={showLeftPanel} onOpenChange={setShowLeftPanel}>
                  <SheetTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-mobile-menu">
                      <Menu className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    {renderLeftPanelContent()}
                  </SheetContent>
                </Sheet>
              )}

              <div className="flex items-center gap-1 sm:gap-2">
                <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${currentTask?.status === "running" ? "text-chart-2 animate-pulse" : "text-muted-foreground"}`} />
                <h1 className="text-xs sm:text-sm font-semibold text-foreground hidden sm:block">AI Agent Workspace</h1>
                <h1 className="text-xs font-semibold text-foreground sm:hidden">Workspace</h1>
              </div>
              {currentTask?.status === "running" && (
                <Badge variant="default" className="gap-1 text-xs hidden md:flex">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Agent Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile: Show console toggle button */}
              {isMobile && (
                <Sheet open={showRightPanel} onOpenChange={setShowRightPanel}>
                  <SheetTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-mobile-console">
                      <Activity className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-0">
                    <AgentConsole logs={logs} currentTask={currentTask} />
                  </SheetContent>
                </Sheet>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleTheme}
                className="h-8 w-8"
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 min-h-0">
            {/* Left Panel - Desktop Only */}
            {!isMobile && (
              <div className="w-64 border-r border-border bg-sidebar">
                {renderLeftPanelContent()}
              </div>
            )}

            {/* Center - Editor and Terminal */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Code Editor */}
              <div className="flex-1 min-h-0">
                <CodeEditor
                  files={openFiles}
                  onFileUpdate={(fileId, content) => updateFileMutation.mutate({ fileId, content })}
                  onFileClose={handleFileClose}
                  activeFileId={activeFileId}
                  onFileSelect={setActiveFileId}
                />
              </div>

              {/* Terminal and Console - Responsive */}
              {isMobile ? (
                <div className="h-48 border-t border-border">
                  <Tabs value={mobileBottomPanel} onValueChange={(v) => setMobileBottomPanel(v as "terminal" | "console")}>
                    <div className="border-b border-border bg-card">
                      <TabsList className="h-10 w-full justify-start rounded-none bg-transparent p-0">
                        <TabsTrigger value="terminal" className="rounded-none" data-testid="tab-terminal">
                          Terminal
                        </TabsTrigger>
                        <TabsTrigger value="console" className="rounded-none" data-testid="tab-console">
                          Console
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="terminal" className="m-0 h-[calc(100%-40px)]">
                      <TerminalPanel
                        sessions={terminals}
                        onCreateSession={() => createTerminalMutation.mutate()}
                        onCloseSession={(id) => deleteTerminalMutation.mutate(id)}
                        onExecuteCommand={(sessionId, command) => executeCommandMutation.mutate({ sessionId, command })}
                        activeSessionId={activeTerminalId || terminals[0]?.id}
                        onSessionSelect={setActiveTerminalId}
                      />
                    </TabsContent>
                    <TabsContent value="console" className="m-0 h-[calc(100%-40px)]">
                      <AgentConsole logs={logs} currentTask={currentTask} />
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="h-64 border-t border-border">
                  <TerminalPanel
                    sessions={terminals}
                    onCreateSession={() => createTerminalMutation.mutate()}
                    onCloseSession={(id) => deleteTerminalMutation.mutate(id)}
                    onExecuteCommand={(sessionId, command) => executeCommandMutation.mutate({ sessionId, command })}
                    activeSessionId={activeTerminalId || terminals[0]?.id}
                    onSessionSelect={setActiveTerminalId}
                  />
                </div>
              )}
            </div>

            {/* Right Panel - Desktop Only */}
            {!isMobile && (
              <div className="w-80 border-l border-border bg-sidebar">
                <AgentConsole logs={logs} currentTask={currentTask} />
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
