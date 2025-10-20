import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2, FileText, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { File as FileType } from "@shared/schema";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  file?: FileType;
}

interface FileExplorerProps {
  files: FileType[];
  onFileSelect: (file: FileType) => void;
  onFileCreate: (path: string) => void;
  onFileDelete: (fileId: string) => void;
  selectedFile?: FileType;
}

export function FileExplorer({ files, onFileSelect, onFileCreate, onFileDelete, selectedFile }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]));

  const buildFileTree = (files: FileType[]): FileNode[] => {
    const root: FileNode[] = [];
    const folderMap = new Map<string, FileNode>();

    files.forEach((file) => {
      const parts = file.path.split("/").filter(Boolean);
      let currentLevel = root;
      let currentPath = "";

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isFile = index === parts.length - 1;

        if (isFile) {
          currentLevel.push({
            name: part,
            path: file.path,
            type: "file",
            file,
          });
        } else {
          let folder = folderMap.get(currentPath);
          if (!folder) {
            folder = {
              name: part,
              path: currentPath,
              type: "folder",
              children: [],
            };
            folderMap.set(currentPath, folder);
            currentLevel.push(folder);
          }
          currentLevel = folder.children!;
        }
      });
    });

    const sortNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      });
    };

    const sortRecursive = (nodes: FileNode[]): FileNode[] => {
      nodes.forEach((node) => {
        if (node.children) {
          node.children = sortRecursive(node.children);
        }
      });
      return sortNodes(nodes);
    };

    return sortRecursive(root);
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
      case "py":
      case "java":
      case "cpp":
      case "c":
        return <FileCode className="w-4 h-4 text-chart-1" />;
      case "json":
      case "xml":
      case "yaml":
      case "yml":
        return <FileText className="w-4 h-4 text-chart-4" />;
      case "md":
      case "txt":
        return <FileText className="w-4 h-4 text-muted-foreground" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile?.path === node.path;

    if (node.type === "folder") {
      return (
        <div key={node.path} className="select-none">
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className="flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover-elevate active-elevate-2 rounded-sm"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => toggleFolder(node.path)}
                data-testid={`folder-${node.path}`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-chart-4 flex-shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-chart-4 flex-shrink-0" />
                )}
                <span className="truncate text-foreground">{node.name}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onFileCreate(node.path)} data-testid="menu-new-file">
                <Plus className="w-4 h-4 mr-2" />
                New File
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {isExpanded && node.children && (
            <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    return (
      <ContextMenu key={node.path}>
        <ContextMenuTrigger>
          <div
            className={`flex items-center gap-1 px-2 py-1 text-sm cursor-pointer rounded-sm ${
              isSelected ? "bg-accent" : "hover-elevate active-elevate-2"
            }`}
            style={{ paddingLeft: `${depth * 12 + 24}px` }}
            onClick={() => node.file && onFileSelect(node.file)}
            data-testid={`file-${node.path}`}
          >
            {getFileIcon(node.name)}
            <span className="truncate text-foreground">{node.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => node.file && onFileDelete(node.file.id)}
            className="text-destructive"
            data-testid="menu-delete-file"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const fileTree = buildFileTree(files);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Files</h2>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => onFileCreate("/")}
          data-testid="button-new-file"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {fileTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Folder className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No files yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click + to create a file</p>
            </div>
          ) : (
            fileTree.map((node) => renderNode(node))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
