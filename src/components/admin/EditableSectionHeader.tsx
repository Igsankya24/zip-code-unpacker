import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface EditableSectionHeaderProps {
  title: string;
  settingKey: string;
  onSave: (key: string, value: string) => Promise<void>;
  className?: string;
}

const EditableSectionHeader = ({
  title,
  settingKey,
  onSave,
  className = "",
}: EditableSectionHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editValue.trim() === "") return;
    setSaving(true);
    await onSave(settingKey, editValue);
    setSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  return (
    <>
      <div className={`flex items-center gap-2 group ${className}`}>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            setEditValue(title);
            setIsEditing(true);
          }}
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </Button>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Section Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter section name"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !editValue.trim()}>
              <Check className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditableSectionHeader;
