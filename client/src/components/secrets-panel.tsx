import { useState } from "react";
import { Key, Plus, Eye, EyeOff, Copy, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useToast } from "@/hooks/use-toast";
import type { Secret } from "@shared/schema";

interface SecretsPanelProps {
  secrets: Secret[];
  onSecretCreate: (key: string, value: string, description?: string) => void;
  onSecretDelete: (secretId: string) => void;
}

export function SecretsPanel({ secrets, onSecretCreate, onSecretDelete }: SecretsPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSecret, setNewSecret] = useState({ key: "", value: "", description: "" });
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreateSecret = () => {
    if (newSecret.key.trim() && newSecret.value.trim()) {
      onSecretCreate(newSecret.key, newSecret.value, newSecret.description);
      setNewSecret({ key: "", value: "", description: "" });
      setIsDialogOpen(false);
    }
  };

  const toggleVisibility = (secretId: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(secretId)) {
        next.delete(secretId);
      } else {
        next.add(secretId);
      }
      return next;
    });
  };

  const copyToClipboard = async (secretId: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedSecret(secretId);
      toast({
        title: "Copied to clipboard",
        description: "Secret value copied successfully",
      });
      setTimeout(() => setCopiedSecret(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const maskValue = (value: string) => {
    return "•".repeat(Math.min(value.length, 20));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-chart-4" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Secrets</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6" data-testid="button-add-secret">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Secret</DialogTitle>
              <DialogDescription>Store a secret key-value pair securely</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="secret-key">Key</Label>
                <Input
                  id="secret-key"
                  value={newSecret.key}
                  onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value.toUpperCase() })}
                  placeholder="API_KEY, DATABASE_URL, etc."
                  data-testid="input-secret-key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret-value">Value</Label>
                <Input
                  id="secret-value"
                  type="password"
                  value={newSecret.value}
                  onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                  placeholder="Secret value"
                  data-testid="input-secret-value"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret-description">Description (Optional)</Label>
                <Textarea
                  id="secret-description"
                  value={newSecret.description}
                  onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
                  placeholder="What is this secret for?"
                  rows={2}
                  data-testid="input-secret-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSecret} data-testid="button-confirm-add-secret">
                Add Secret
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        {secrets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <Key className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No secrets stored</p>
            <p className="text-xs text-muted-foreground mt-1">Add API keys and credentials</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {secrets.map((secret) => {
              const isVisible = visibleSecrets.has(secret.id);
              const isCopied = copiedSecret === secret.id;

              return (
                <div
                  key={secret.id}
                  className="p-3 rounded-md border border-border bg-card hover-elevate group"
                  data-testid={`secret-${secret.key}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium font-mono text-foreground truncate">{secret.key}</p>
                      {secret.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{secret.description}</p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => onSecretDelete(secret.id)}
                      data-testid={`button-delete-secret-${secret.key}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 px-2 py-1 bg-muted rounded-sm font-mono text-sm">
                      <span className="truncate block">
                        {isVisible ? secret.value : maskValue(secret.value)}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => toggleVisibility(secret.id)}
                      data-testid={`button-toggle-visibility-${secret.key}`}
                    >
                      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => copyToClipboard(secret.id, secret.value)}
                      data-testid={`button-copy-secret-${secret.key}`}
                    >
                      {isCopied ? <Check className="w-4 h-4 text-chart-3" /> : <Copy className="w-4 h-4" />}
                    </Button>
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
