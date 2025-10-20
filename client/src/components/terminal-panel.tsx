import { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Plus, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TerminalSession } from "@shared/schema";

interface TerminalPanelProps {
  sessions: TerminalSession[];
  onCreateSession: () => void;
  onCloseSession: (sessionId: string) => void;
  onExecuteCommand: (sessionId: string, command: string) => void;
  activeSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
}

export function TerminalPanel({
  sessions,
  onCreateSession,
  onCloseSession,
  onExecuteCommand,
  activeSessionId,
  onSessionSelect,
}: TerminalPanelProps) {
  const [commandInput, setCommandInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || !activeSessionId) return;

    onExecuteCommand(activeSessionId, commandInput);
    setCommandHistory((prev) => [...prev, commandInput]);
    setCommandInput("");
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommandInput("");
        } else {
          setHistoryIndex(newIndex);
          setCommandInput(commandHistory[newIndex]);
        }
      }
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background p-8 text-center">
        <TerminalIcon className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No terminal sessions</p>
        <Button size="sm" onClick={onCreateSession} className="mt-4" data-testid="button-create-terminal">
          <Plus className="w-4 h-4 mr-2" />
          New Terminal
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <Tabs value={activeSessionId} onValueChange={onSessionSelect} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card">
          <div className="flex items-center justify-between px-2">
            <TabsList className="h-10 justify-start rounded-none bg-transparent p-0">
              {sessions.map((session, index) => (
                <TabsTrigger
                  key={session.id}
                  value={session.id}
                  className="relative rounded-none border-r border-border data-[state=active]:bg-background data-[state=active]:shadow-none h-10 px-3 gap-2"
                  data-testid={`terminal-tab-${index + 1}`}
                >
                  <TerminalIcon className="w-4 h-4" />
                  <span className="text-sm">{session.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-4 w-4 ml-1 hover:bg-accent/50 rounded-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseSession(session.id);
                    }}
                    data-testid={`button-close-terminal-${index + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onCreateSession}
              data-testid="button-new-terminal"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {sessions.map((session) => (
          <TabsContent
            key={session.id}
            value={session.id}
            className="flex-1 m-0 data-[state=inactive]:hidden flex flex-col"
          >
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="font-mono text-sm space-y-2">
                {session.history && session.history.length > 0 ? (
                  session.history.map((entry, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-chart-3">$</span>
                        <span className="text-foreground">{entry.command}</span>
                      </div>
                      {entry.output && (
                        <pre className={`pl-4 whitespace-pre-wrap text-xs ${entry.exitCode === 0 ? "text-muted-foreground" : "text-destructive"}`}>
                          {entry.output}
                        </pre>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-xs">
                    <p>Welcome to AI Agent Terminal</p>
                    <p className="mt-1">Type commands below to execute them</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="border-t border-border p-3 bg-card">
              <div className="flex items-center gap-2">
                <span className="text-chart-3 font-mono text-sm">$</span>
                <Input
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  className="flex-1 font-mono text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 px-2"
                  data-testid="input-terminal-command"
                />
                <Button type="submit" size="icon" className="h-8 w-8" data-testid="button-send-command">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
