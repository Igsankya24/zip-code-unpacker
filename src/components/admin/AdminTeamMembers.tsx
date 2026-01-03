import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, GripVertical, Linkedin, Twitter, Mail, Phone, Crop } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  display_order: number;
  is_visible: boolean;
}

const AdminTeamMembers = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    bio: "",
    photo_url: "",
    email: "",
    phone: "",
    linkedin_url: "",
    twitter_url: "",
    is_visible: true,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch team members", variant: "destructive" });
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
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
    e.target.value = "";
  };

  const handleCroppedImage = async (blob: Blob) => {
    setUploading(true);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("team-photos")
      .upload(fileName, blob, { contentType: "image/jpeg" });

    if (uploadError) {
      toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("team-photos").getPublicUrl(fileName);
    setFormData((prev) => ({ ...prev, photo_url: urlData.publicUrl }));
    setUploading(false);
    toast({ title: "Success", description: "Photo uploaded successfully" });
  };

  const openCreateDialog = () => {
    setSelectedMember(null);
    setFormData({
      name: "",
      role: "",
      bio: "",
      photo_url: "",
      email: "",
      phone: "",
      linkedin_url: "",
      twitter_url: "",
      is_visible: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio || "",
      photo_url: member.photo_url || "",
      email: member.email || "",
      phone: member.phone || "",
      linkedin_url: member.linkedin_url || "",
      twitter_url: member.twitter_url || "",
      is_visible: member.is_visible,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.role.trim()) {
      toast({ title: "Error", description: "Name and role are required", variant: "destructive" });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      role: formData.role.trim(),
      bio: formData.bio.trim() || null,
      photo_url: formData.photo_url.trim() || null,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      linkedin_url: formData.linkedin_url.trim() || null,
      twitter_url: formData.twitter_url.trim() || null,
      is_visible: formData.is_visible,
    };

    if (selectedMember) {
      const { error } = await supabase
        .from("team_members")
        .update(payload)
        .eq("id", selectedMember.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update team member", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Team member updated" });
    } else {
      const { error } = await supabase
        .from("team_members")
        .insert({ ...payload, display_order: members.length });

      if (error) {
        toast({ title: "Error", description: "Failed to create team member", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Team member added" });
    }

    setDialogOpen(false);
    fetchMembers();
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", selectedMember.id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete team member", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Team member deleted" });
    setDeleteDialogOpen(false);
    setSelectedMember(null);
    fetchMembers();
  };

  const toggleVisibility = async (member: TeamMember) => {
    const { error } = await supabase
      .from("team_members")
      .update({ is_visible: !member.is_visible })
      .eq("id", member.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
      return;
    }

    fetchMembers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Members</h2>
          <p className="text-muted-foreground">Manage CEO, founders, and key team members shown on the About page</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No team members added yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id} className={!member.is_visible ? "opacity-50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                  
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-primary">{member.role}</p>
                    {member.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{member.bio}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {member.email && <Mail className="w-4 h-4 text-muted-foreground" />}
                      {member.phone && <Phone className="w-4 h-4 text-muted-foreground" />}
                      {member.linkedin_url && <Linkedin className="w-4 h-4 text-muted-foreground" />}
                      {member.twitter_url && <Twitter className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={member.is_visible}
                      onCheckedChange={() => toggleVisibility(member)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(member)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedMember(member);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMember ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex gap-2">
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
                    <Crop className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload & Crop"}
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                    disabled={uploading}
                  />
                </Label>
                {formData.photo_url && (
                  <Button variant="outline" size="sm" onClick={() => setFormData((prev) => ({ ...prev, photo_url: "" }))}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role/Title *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., CEO & Founder"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Brief description about this team member..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter URL</Label>
                <Input
                  id="twitter"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, twitter_url: e.target.value }))}
                  placeholder="https://twitter.com/username"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_visible: checked }))}
              />
              <Label htmlFor="visible">Visible on About page</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{selectedMember ? "Save Changes" : "Add Member"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMember?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

export default AdminTeamMembers;