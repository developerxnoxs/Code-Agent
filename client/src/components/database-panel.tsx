import { useState } from "react";
import { Database, Table2, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DbSchema } from "@shared/schema";

interface DatabasePanelProps {
  schemas: DbSchema[];
  onRefresh: () => void;
  onTableCreate: (tableName: string) => void;
  onTableDelete: (schemaId: string) => void;
  onTableSelect: (schema: DbSchema) => void;
}

export function DatabasePanel({ schemas, onRefresh, onTableCreate, onTableDelete, onTableSelect }: DatabasePanelProps) {
  const [newTableName, setNewTableName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateTable = () => {
    if (newTableName.trim()) {
      onTableCreate(newTableName);
      setNewTableName("");
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-chart-1" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Database</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onRefresh}
            data-testid="button-refresh-db"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6" data-testid="button-create-table">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Table</DialogTitle>
                <DialogDescription>Create a new database table</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="table-name">Table Name</Label>
                  <Input
                    id="table-name"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="users, products, etc."
                    data-testid="input-table-name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTable} data-testid="button-confirm-create-table">
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {schemas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <Database className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No tables yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create or sync database tables</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {schemas.map((schema) => (
              <div
                key={schema.id}
                className="flex items-center justify-between p-3 rounded-md hover-elevate active-elevate-2 cursor-pointer group"
                onClick={() => onTableSelect(schema)}
                data-testid={`table-${schema.tableName}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Table2 className="w-4 h-4 text-chart-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{schema.tableName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {schema.schema.columns.length} columns
                      </Badge>
                      <span className="text-xs text-muted-foreground">{schema.rowCount || 0} rows</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTableDelete(schema.id);
                  }}
                  data-testid={`button-delete-table-${schema.tableName}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
