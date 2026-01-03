import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ExternalLink, Image, Crop, X } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";

interface Service {
  id: string;
  name: string;
}

interface ServiceProject {
  id: string;
  service_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  services?: { name: string };
}

const AdminServiceProjects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<ServiceProject[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ServiceProject | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    service_id: "",
    title: "",
    description: "",
    image_url: "",
    project_url: "",
    is_visible: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [projectsRes, servicesRes] = await Promise.all([
      supabase
        .from("service_projects")
        .select("*, services(name)")
        .order("display_order", { ascending: true }),
      supabase
        .from("services")
        .select("id, name")
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),
    ]);

    if (projectsRes.data) setProjects(projectsRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      service_id: "",
      title: "",
      description: "",
      image_url: "",
      project_url: "",
      is_visible: true,
      display_order: 0,
    });
    setEditingProject(null);
  };

  const handleSubmit = async () => {
    if (!formData.service_id || !formData.title) {
      toast({ title: "Error", description: "Service and title are required", variant: "destructive" });
      return;
    }

    const payload = {
      service_id: formData.service_id,
      title: formData.title,
      description: formData.description || null,
      image_url: formData.image_url || null,
      project_url: formData.project_url || null,
      is_visible: formData.is_visible,
      display_order: formData.display_order,
    };

    if (editingProject) {
      const { error } = await supabase
        .from("service_projects")
        .update(payload)
        .eq("id", editingProject.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Project updated successfully" });
        setDialogOpen(false);
        resetForm();
        fetchData();
      }
    } else {
      const { error } = await supabase.from("service_projects").insert(payload);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Project added successfully" });
        setDialogOpen(false);
        resetForm();
        fetchData();
      }
    }
  };

  const handleEdit = (project: ServiceProject) => {
    setEditingProject(project);
    setFormData({
      service_id: project.service_id,
      title: project.title,
      description: project.description || "",
      image_url: project.image_url || "",
      project_url: project.project_url || "",
      is_visible: project.is_visible,
      display_order: project.display_order,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    const { error } = await supabase.from("service_projects").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Project deleted successfully" });
      fetchData();
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      .from("project-images")
      .upload(fileName, blob, { contentType: "image/jpeg" });

    if (uploadError) {
      toast({ title: "Error", description: "Failed to upload image. Bucket may not exist.", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("project-images")
      .getPublicUrl(fileName);

    setFormData({ ...formData, image_url: urlData.publicUrl });
    setUploading(false);
    toast({ title: "Success", description: "Image uploaded" });
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Service Projects / Portfolio</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Service *</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter project title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the project"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-2">
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
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
                    {formData.image_url && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, image_url: "" })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Or enter image URL directly"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Project URL</Label>
                <Input
                  value={formData.project_url}
                  onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                  placeholder="https://example.com/project"
                />
              </div>

              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_visible}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                />
                <Label>Visible to public</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingProject ? "Update" : "Add"} Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No projects added yet. Click "Add Project" to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.services?.name || "-"}</TableCell>
                  <TableCell>
                    {project.image_url ? (
                      <Image className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.project_url ? (
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={project.is_visible ? "text-green-500" : "text-muted-foreground"}>
                      {project.is_visible ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell>{project.display_order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(project)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Image Cropper */}
      <ImageCropper
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCroppedImage}
        aspectRatio={16 / 9}
        circularCrop={false}
      />
    </Card>
  );
};

export default AdminServiceProjects;
