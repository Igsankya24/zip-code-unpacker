import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Key, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    key_name: "",
    key_value: "",
    description: "",
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .order("key_name");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setApiKeys(data || []);
    }
    setLoading(false);
  };

  const openAddDialog = () => {
    setEditingKey(null);
    setFormData({ key_name: "", key_value: "", description: "", is_active: true });
    setDialogOpen(true);
  };

  const openEditDialog = (apiKey: ApiKey) => {
    setEditingKey(apiKey);
    setFormData({
      key_name: apiKey.key_name,
      key_value: apiKey.key_value,
      description: apiKey.description || "",
      is_active: apiKey.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.key_name.trim() || !formData.key_value.trim()) {
      toast({ title: "Error", description: "Key name and value are required", variant: "destructive" });
      return;
    }

    const payload = {
      key_name: formData.key_name.trim().toUpperCase().replace(/\s+/g, "_"),
      key_value: formData.key_value.trim(),
      description: formData.description.trim() || null,
      is_active: formData.is_active,
    };

    if (editingKey) {
      const { error } = await supabase
        .from("api_keys")
        .update(payload)
        .eq("id", editingKey.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "API key updated" });
        setDialogOpen(false);
        fetchApiKeys();
      }
    } else {
      const { error } = await supabase.from("api_keys").insert(payload);

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Error", description: "An API key with this name already exists", variant: "destructive" });
        } else {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        }
      } else {
        toast({ title: "Success", description: "API key added" });
        setDialogOpen(false);
        fetchApiKeys();
      }
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    const { error } = await supabase.from("api_keys").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "API key deleted" });
      fetchApiKeys();
    }
  };

  const toggleActive = async (apiKey: ApiKey) => {
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: !apiKey.is_active })
      .eq("id", apiKey.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchApiKeys();
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const maskValue = (value: string) => {
    if (value.length <= 8) return "••••••••";
    return value.slice(0, 4) + "••••••••" + value.slice(-4);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys for email, messaging, and other integrations
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add API Key
        </Button>
      </div>

      <div className="grid gap-4">
        {apiKeys.map((apiKey) => (
          <div
            key={apiKey.id}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{apiKey.key_name}</h3>
                  {apiKey.description && (
                    <p className="text-sm text-muted-foreground">{apiKey.description}</p>
                  )}
                </div>
              </div>
              <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                {apiKey.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <code className="flex-1 text-sm font-mono text-muted-foreground">
                {visibleKeys.has(apiKey.id) ? apiKey.key_value : maskValue(apiKey.key_value)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleKeyVisibility(apiKey.id)}
              >
                {visibleKeys.has(apiKey.id) ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => openEditDialog(apiKey)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleActive(apiKey)}>
                <Switch checked={apiKey.is_active} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteApiKey(apiKey.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {apiKeys.length === 0 && (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-border">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No API keys configured yet.</p>
            <p className="text-sm">Add API keys for services like Resend (email), etc.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKey ? "Edit API Key" : "Add API Key"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key_name">Key Name *</Label>
              <Input
                id="key_name"
                value={formData.key_name}
                onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                placeholder="e.g., RESEND_API_KEY"
              />
              <p className="text-xs text-muted-foreground">
                Will be converted to UPPERCASE_WITH_UNDERSCORES
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="key_value">Key Value *</Label>
              <Input
                id="key_value"
                type="password"
                value={formData.key_value}
                onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
                placeholder="Enter the API key value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this key used for?"
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingKey ? "Update" : "Add"} API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApiKeys;