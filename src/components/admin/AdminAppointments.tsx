import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Calendar, FileSpreadsheet, FileText, File, Download, Send, Check, X, CheckCircle, Receipt, Search } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { exportToExcel, exportToPDF, exportToWord } from "@/lib/exportUtils";

interface AdminAppointmentsProps {
  onNavigateToInvoice?: (appointmentId: string) => void;
}

interface Appointment {
  id: string;
  reference_id: string | null;
  user_id: string | null;
  service_id: string | null;
  technician_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
  service_name?: string;
  technician_name?: string;
}

interface Technician {
  id: string;
  name: string;
}

const AdminAppointments = ({ onNavigateToInvoice }: AdminAppointmentsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteRequestDialog, setDeleteRequestDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const { toast } = useToast();
  const { user, isSuperAdmin, permissions } = useAuth();

  useEffect(() => {
    fetchAppointments();
    fetchTechnicians();

    const channel = supabase
      .channel("admin-appointments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => fetchAppointments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTechnicians = async () => {
    const { data } = await supabase
      .from("technicians")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    setTechnicians(data || []);
  };

  const fetchAppointments = async () => {
    setLoading(true);
    
    const { data: appointmentsData, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const userIds = [...new Set((appointmentsData?.map(a => a.user_id).filter(Boolean) as string[]) || [])];
    const serviceIds = [...new Set(appointmentsData?.filter(a => a.service_id).map(a => a.service_id) || [])];
    const technicianIds = [...new Set(appointmentsData?.filter(a => a.technician_id).map(a => a.technician_id) || [])];

    const [profilesRes, servicesRes, techniciansRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("user_id, email, full_name").in("user_id", userIds)
        : { data: [] as any[] },
      serviceIds.length > 0 ? supabase.from("services").select("id, name").in("id", serviceIds) : { data: [] },
      technicianIds.length > 0 ? supabase.from("technicians").select("id, name").in("id", technicianIds) : { data: [] },
    ]);

    const profilesMap: Record<string, { email: string; name: string }> = {};
    profilesRes.data?.forEach(p => {
      profilesMap[p.user_id] = { email: p.email || "", name: p.full_name || "" };
    });

    const servicesMap: Record<string, string> = {};
    servicesRes.data?.forEach(s => {
      servicesMap[s.id] = s.name;
    });

    const techniciansMap: Record<string, string> = {};
    techniciansRes.data?.forEach(t => {
      techniciansMap[t.id] = t.name;
    });

    const enrichedAppointments = appointmentsData?.map(a => ({
      ...a,
      user_email: a.user_id ? profilesMap[a.user_id]?.email : undefined,
      user_name: a.user_id ? profilesMap[a.user_id]?.name : "Guest",
      service_name: a.service_id ? servicesMap[a.service_id] : undefined,
      technician_name: a.technician_id ? techniciansMap[a.technician_id] : undefined,
    })) || [];

    setAppointments(enrichedAppointments);
    setLoading(false);
  };

  const assignTechnician = async (appointmentId: string, technicianId: string | null) => {
    const { error } = await supabase
      .from("appointments")
      .update({ technician_id: technicianId })
      .eq("id", appointmentId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: technicianId ? "Technician assigned" : "Technician unassigned" });
      fetchAppointments();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!permissions.can_confirm_appointments && !isSuperAdmin) {
      toast({ title: "Error", description: "You don't have permission to update appointments", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Status updated" });
      fetchAppointments();
    }
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Appointment deleted" });
      fetchAppointments();
    }
  };

  const requestDeletion = async () => {
    if (!selectedAppointment || !user) return;

    const { error } = await supabase.from("deletion_requests").insert({
      request_type: "appointment",
      target_id: selectedAppointment.id,
      requested_by: user.id,
      reason: deleteReason,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Deletion request sent to Super Admin" });
      
      // Create notification for super admins
      await supabase.from("notifications").insert({
        title: "New Deletion Request",
        message: `Admin requested deletion of appointment ${selectedAppointment.reference_id || selectedAppointment.id.substring(0, 8)}`,
        type: "warning"
      });
    }

    setDeleteRequestDialog(false);
    setSelectedAppointment(null);
    setDeleteReason("");
  };

  const handleDeleteClick = (appointment: Appointment) => {
    if (isSuperAdmin || permissions.can_delete_appointments) {
      if (confirm("Are you sure you want to delete this appointment?")) {
        deleteAppointment(appointment.id);
      }
    } else {
      setSelectedAppointment(appointment);
      setDeleteRequestDialog(true);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesSearch = !searchQuery.trim() || 
      (a.reference_id?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.user_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.user_email?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-500/10 text-green-500";
      case "completed": return "bg-blue-500/10 text-blue-500";
      case "cancelled": return "bg-red-500/10 text-red-500";
      default: return "bg-yellow-500/10 text-yellow-500";
    }
  };

  const handleExport = (type: 'excel' | 'pdf' | 'word') => {
    const exportData = filteredAppointments.map(a => ({
      'Ref ID': a.reference_id || '-',
      Customer: a.user_name || 'Unknown',
      Email: a.user_email || '-',
      Service: a.service_name || '-',
      Date: format(new Date(a.appointment_date), "MMM d, yyyy"),
      Time: a.appointment_time,
      Technician: a.technician_name || 'Unassigned',
      Status: a.status,
      Notes: a.notes || '-',
      Created: format(new Date(a.created_at), "MMM d, yyyy")
    }));

    const filename = `appointments_${format(new Date(), 'yyyy-MM-dd')}`;
    
    switch (type) {
      case 'excel':
        exportToExcel(exportData, filename);
        break;
      case 'pdf':
        exportToPDF(exportData, filename, 'Appointments Report');
        break;
      case 'word':
        exportToWord(exportData, filename, 'Appointments Report');
        break;
    }
    
    toast({ title: "Success", description: `Exported to ${type.toUpperCase()}` });
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Appointments</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('word')}>
                <File className="w-4 h-4 mr-2" />
                Word (.doc)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-4 text-left text-sm font-medium">Ref ID</th>
                <th className="p-4 text-left text-sm font-medium">Customer</th>
                <th className="p-4 text-left text-sm font-medium hidden md:table-cell">Service</th>
                <th className="p-4 text-left text-sm font-medium">Date & Time</th>
                <th className="p-4 text-left text-sm font-medium hidden lg:table-cell">Technician</th>
                <th className="p-4 text-left text-sm font-medium">Status</th>
                <th className="p-4 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {appointment.reference_id || "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{appointment.user_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{appointment.user_email}</p>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-muted-foreground">{appointment.service_name || "-"}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{format(new Date(appointment.appointment_date), "MMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{appointment.appointment_time}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <Select
                      value={appointment.technician_id || "unassigned"}
                      onValueChange={(value) => assignTechnician(appointment.id, value === "unassigned" ? null : value)}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue placeholder="Assign..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Pending: Show Confirm and Cancel buttons */}
                      {appointment.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(appointment.id, "confirmed")}
                            disabled={!permissions.can_confirm_appointments && !isSuperAdmin}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Confirm appointment"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(appointment.id, "cancelled")}
                            disabled={!permissions.can_confirm_appointments && !isSuperAdmin}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Cancel appointment"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      {/* Confirmed: Show Complete button */}
                      {appointment.status === "confirmed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatus(appointment.id, "completed")}
                          disabled={!permissions.can_confirm_appointments && !isSuperAdmin}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      
                      {/* Completed: Show Generate Invoice button */}
                      {appointment.status === "completed" && onNavigateToInvoice && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigateToInvoice(appointment.id)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          title="Generate invoice"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Invoice
                        </Button>
                      )}
                      
                      {/* Cancelled: Show status text */}
                      {appointment.status === "cancelled" && (
                        <span className="text-xs text-muted-foreground px-2">Cancelled</span>
                      )}
                      
                      {/* Delete button */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteClick(appointment)}
                        title={isSuperAdmin || permissions.can_delete_appointments ? "Delete appointment" : "Request deletion"}
                      >
                        {isSuperAdmin || permissions.can_delete_appointments ? (
                          <Trash2 className="w-4 h-4 text-destructive" />
                        ) : (
                          <Send className="w-4 h-4 text-orange-500" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deletion Request Dialog */}
      <Dialog open={deleteRequestDialog} onOpenChange={setDeleteRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Appointment Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              You don't have permission to delete appointments directly. 
              Your request will be sent to a Super Admin for approval.
            </p>
            {selectedAppointment && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm"><strong>Ref ID:</strong> {selectedAppointment.reference_id || "-"}</p>
                <p className="text-sm"><strong>Customer:</strong> {selectedAppointment.user_name}</p>
                <p className="text-sm"><strong>Date:</strong> {format(new Date(selectedAppointment.appointment_date), "MMM d, yyyy")} at {selectedAppointment.appointment_time}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Reason for deletion</label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Explain why this appointment should be deleted..."
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

export default AdminAppointments;
