import { useState, useEffect } from "react";
import { X, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { File } from "@shared/schema";

interface CodeEditorProps {
  files: File[];
  onFileUpdate: (fileId: string, content: string) => void;
  onFileClose: (fileId: string) => void;
  activeFileId?: string;
  onFileSelect: (fileId: string) => void;
}

export function CodeEditor({ files, onFileUpdate, onFileClose, activeFileId, onFileSelect }: CodeEditorProps) {
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({});

  const activeFile = files.find((f) => f.id === activeFileId);

  useEffect(() => {
    if (activeFile && !editedContent[activeFile.id]) {
      setEditedContent((prev) => ({ ...prev, [activeFile.id]: activeFile.content }));
    }
  }, [activeFile, editedContent]);

  const handleContentChange = (fileId: string, content: string) => {
    setEditedContent((prev) => ({ ...prev, [fileId]: content }));
    const file = files.find((f) => f.id === fileId);
    setHasUnsavedChanges((prev) => ({ ...prev, [fileId]: file ? content !== file.content : false }));
  };

  const handleSave = (fileId: string) => {
    const content = editedContent[fileId] || "";
    onFileUpdate(fileId, content);
    setHasUnsavedChanges((prev) => ({ ...prev, [fileId]: false }));
  };

  const handleRevert = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (file) {
      setEditedContent((prev) => ({ ...prev, [fileId]: file.content }));
      setHasUnsavedChanges((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No file selected</p>
          <p className="text-xs text-muted-foreground mt-1">Open a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <Tabs value={activeFileId} onValueChange={onFileSelect} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card">
          <TabsList className="h-10 w-full justify-start rounded-none bg-transparent p-0">
            {files.map((file) => (
              <TabsTrigger
                key={file.id}
                value={file.id}
                className="relative rounded-none border-r border-border data-[state=active]:bg-background data-[state=active]:shadow-none h-10 px-4 gap-2"
                data-testid={`tab-${file.path}`}
              >
                <span className="text-sm truncate max-w-[150px]">{file.path.split("/").pop()}</span>
                {hasUnsavedChanges[file.id] && (
                  <span className="w-2 h-2 rounded-full bg-chart-4" title="Unsaved changes" />
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 ml-1 hover:bg-accent/50 rounded-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClose(file.id);
                  }}
                  data-testid={`button-close-tab-${file.path}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {files.map((file) => (
          <TabsContent
            key={file.id}
            value={file.id}
            className="flex-1 m-0 data-[state=inactive]:hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">{file.path}</span>
                {file.language && (
                  <span className="text-xs px-2 py-0.5 bg-accent rounded-sm text-accent-foreground">
                    {file.language}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {hasUnsavedChanges[file.id] && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevert(file.id)}
                      data-testid="button-revert"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Revert
                    </Button>
                    <Button size="sm" onClick={() => handleSave(file.id)} data-testid="button-save">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <textarea
                value={editedContent[file.id] ?? file.content}
                onChange={(e) => handleContentChange(file.id, e.target.value)}
                className="w-full h-full min-h-[500px] p-4 bg-background text-foreground font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
                data-testid="textarea-code-editor"
              />
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
