import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, User, Phone, Mail, Briefcase, MapPin, Crop, X } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

interface Technician {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  address: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminTechnicians = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    address: "",
    photo_url: "",
    is_active: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("technicians")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setTechnicians(data || []);
    }
    setLoading(false);
  };

  const openAddDialog = () => {
    setEditingTechnician(null);
    setFormData({ name: "", email: "", phone: "", specialization: "", address: "", photo_url: "", is_active: true });
    setDialogOpen(true);
  };

  const openEditDialog = (technician: Technician) => {
    setEditingTechnician(technician);
    setFormData({
      name: technician.name,
      email: technician.email || "",
      phone: technician.phone || "",
      specialization: technician.specialization || "",
      address: technician.address || "",
      photo_url: technician.photo_url || "",
      is_active: technician.is_active,
    });
    setDialogOpen(true);
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 10MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTempImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleCroppedImage = async (blob: Blob) => {
    setUploading(true);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("technician-photos")
      .upload(fileName, blob, { contentType: "image/jpeg" });

    if (uploadError) {
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("technician-photos")
      .getPublicUrl(fileName);

    setFormData({ ...formData, photo_url: urlData.publicUrl });
    setUploading(false);
    toast({ title: "Success", description: "Photo uploaded" });
  };

  const removePhoto = () => {
    setFormData({ ...formData, photo_url: "" });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      specialization: formData.specialization.trim() || null,
      address: formData.address.trim() || null,
      photo_url: formData.photo_url || null,
      is_active: formData.is_active,
    };

    if (editingTechnician) {
      const { error } = await supabase
        .from("technicians")
        .update(payload)
        .eq("id", editingTechnician.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Technician updated" });
        setDialogOpen(false);
        fetchTechnicians();
      }
    } else {
      const { error } = await supabase.from("technicians").insert(payload);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Technician added" });
        setDialogOpen(false);
        fetchTechnicians();
      }
    }
  };

  const deleteTechnician = async (id: string) => {
    if (!confirm("Are you sure you want to delete this technician?")) return;

    const { error } = await supabase.from("technicians").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Technician deleted" });
      fetchTechnicians();
    }
  };

  const toggleActive = async (technician: Technician) => {
    const { error } = await supabase
      .from("technicians")
      .update({ is_active: !technician.is_active })
      .eq("id", technician.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchTechnicians();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Technicians</h2>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Technician
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {technicians.map((tech) => (
          <div
            key={tech.id}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  {tech.photo_url ? (
                    <AvatarImage src={tech.photo_url} alt={tech.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10">
                    <User className="w-6 h-6 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-foreground">{tech.name}</h3>
                  {tech.specialization && (
                    <p className="text-sm text-muted-foreground">{tech.specialization}</p>
                  )}
                </div>
              </div>
              <Badge variant={tech.is_active ? "default" : "secondary"}>
                {tech.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-1 text-sm">
              {tech.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {tech.email}
                </div>
              )}
              {tech.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {tech.phone}
                </div>
              )}
              {tech.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{tech.address}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => openEditDialog(tech)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleActive(tech)}>
                <Switch checked={tech.is_active} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTechnician(tech.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {technicians.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No technicians added yet. Click "Add Technician" to get started.
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTechnician ? "Edit Technician" : "Add Technician"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  {formData.photo_url ? (
                    <AvatarImage src={formData.photo_url} alt="Technician" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10">
                    <User className="w-8 h-8 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Crop className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload & Crop"}
                  </Button>
                  {formData.photo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removePhoto}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter technician name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="technician@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., Network, Hardware, Software"
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
            <Button onClick={handleSubmit} disabled={uploading}>
              {editingTechnician ? "Update" : "Add"} Technician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      <ImageCropper
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCroppedImage}
        aspectRatio={1}
        circularCrop={true}
      />
    </div>
  );
};

export default AdminTechnicians;
