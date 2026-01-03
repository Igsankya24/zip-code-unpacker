import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Send } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface Service {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  features: string[];
  price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  is_visible: boolean;
  display_order: number;
}

const iconOptions = [
  "Globe", "Smartphone", "Monitor", "Shield", "Database", "Headphones",
  "Code", "Server", "Cloud", "Lock", "Zap", "Settings"
];

const SortableServiceRow = ({
  service,
  onEdit,
  onToggleVisibility,
  onDelete,
  isSuperAdmin,
  canManageServices,
}: {
  service: Service;
  onEdit: (service: Service) => void;
  onToggleVisibility: (service: Service) => void;
  onDelete: (service: Service) => void;
  isSuperAdmin: boolean;
  canManageServices: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-t border-border hover:bg-muted/30">
      <td className="p-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </td>
      <td className="p-4">
        <div>
          <p className="font-medium text-foreground">{service.name}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
        </div>
      </td>
      <td className="p-4 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">{service.icon}</span>
      </td>
      <td className="p-4">
        <span className="font-medium text-foreground">{service.price ? `₹${service.price}` : "-"}</span>
      </td>
      <td className="p-4">
        <button
          onClick={() => onToggleVisibility(service)}
          className={`p-2 rounded-lg ${service.is_visible ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}
          title={service.is_visible ? "Click to hide" : "Click to show"}
        >
          {service.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(service)} title="Edit">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(service)}
            title={isSuperAdmin || canManageServices ? "Delete" : "Request deletion"}
          >
            {isSuperAdmin || canManageServices ? (
              <Trash2 className="w-4 h-4 text-destructive" />
            ) : (
              <Send className="w-4 h-4 text-orange-500" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
};

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteRequestDialog, setDeleteRequestDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "Globe",
    features: "",
    price: "",
    duration_minutes: "",
    is_active: true,
    is_visible: true,
  });
  const { toast } = useToast();
  const { user, isSuperAdmin, permissions } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = services.findIndex((s) => s.id === active.id);
      const newIndex = services.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(services, oldIndex, newIndex);
      setServices(newOrder);

      for (let i = 0; i < newOrder.length; i++) {
        await supabase.from("services").update({ display_order: i }).eq("id", newOrder[i].id);
      }
      toast({ title: "Success", description: "Order updated" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "Globe",
      features: "",
      price: "",
      duration_minutes: "",
      is_active: true,
      is_visible: true,
    });
    setEditingService(null);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      icon: service.icon,
      features: service.features?.join(", ") || "",
      price: service.price?.toString() || "",
      duration_minutes: service.duration_minutes?.toString() || "",
      is_active: service.is_active,
      is_visible: service.is_visible,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceData = {
      name: formData.name,
      description: formData.description || null,
      icon: formData.icon,
      features: formData.features.split(",").map(f => f.trim()).filter(Boolean),
      price: formData.price ? parseFloat(formData.price) : null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      is_active: formData.is_active,
      is_visible: formData.is_visible,
      updated_at: new Date().toISOString(),
    };

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editingService.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Service updated successfully" });
        setDialogOpen(false);
        resetForm();
        fetchServices();
      }
    } else {
      const { error } = await supabase
        .from("services")
        .insert({ ...serviceData, display_order: services.length + 1 });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Service created successfully" });
        setDialogOpen(false);
        resetForm();
        fetchServices();
      }
    }
  };

  const toggleVisibility = async (service: Service) => {
    const { error } = await supabase
      .from("services")
      .update({ is_visible: !service.is_visible, updated_at: new Date().toISOString() })
      .eq("id", service.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: `Service ${service.is_visible ? "hidden" : "shown"} on website` 
      });
      fetchServices();
    }
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Service deleted successfully" });
      fetchServices();
    }
  };

  const requestDeletion = async () => {
    if (!selectedService || !user) return;

    const { error } = await supabase.from("deletion_requests").insert({
      request_type: "service",
      target_id: selectedService.id,
      requested_by: user.id,
      reason: deleteReason,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Deletion request sent to Super Admin" });
      
      // Create notification for super admins
      await supabase.from("notifications").insert({
        title: "Service Deletion Request",
        message: `Admin requested deletion of service: ${selectedService.name}`,
        type: "warning"
      });
    }

    setDeleteRequestDialog(false);
    setSelectedService(null);
    setDeleteReason("");
  };

  const handleDeleteClick = (service: Service) => {
    if (isSuperAdmin || permissions.can_manage_services) {
      if (confirm("Are you sure you want to delete this service?")) {
        deleteService(service.id);
      }
    } else {
      setSelectedService(service);
      setDeleteRequestDialog(true);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Services</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Features (comma-separated)</label>
                <Input
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Feature 1, Feature 2, Feature 3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (mins)</label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <label className="text-sm">Active</label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                  />
                  <label className="text-sm">Visible on Website</label>
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingService ? "Update Service" : "Create Service"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">Order</th>
                  <th className="p-4 text-left text-sm font-medium">Name</th>
                  <th className="p-4 text-left text-sm font-medium hidden md:table-cell">Icon</th>
                  <th className="p-4 text-left text-sm font-medium">Price</th>
                  <th className="p-4 text-left text-sm font-medium">Visible</th>
                  <th className="p-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <SortableContext items={services.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {services.map((service) => (
                    <SortableServiceRow
                      key={service.id}
                      service={service}
                      onEdit={openEditDialog}
                      onToggleVisibility={toggleVisibility}
                      onDelete={handleDeleteClick}
                      isSuperAdmin={isSuperAdmin}
                      canManageServices={permissions.can_manage_services || false}
                    />
                  ))}
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No services found. Add your first service!
                      </td>
                    </tr>
                  )}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </div>
      </DndContext>

      {/* Deletion Request Dialog */}
      <Dialog open={deleteRequestDialog} onOpenChange={setDeleteRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Service Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              You don't have permission to delete services directly. 
              Your request will be sent to a Super Admin for approval.
            </p>
            {selectedService && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm"><strong>Service:</strong> {selectedService.name}</p>
                <p className="text-sm"><strong>Price:</strong> {selectedService.price ? `₹${selectedService.price}` : '-'}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Reason for deletion</label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Explain why this service should be deleted..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={requestDeletion}>
              <Send className="w-4 h-4 mr-2" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
