import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Calendar, Send, Check, X, CheckCircle, Receipt, Search, Eye, User, Wrench, Clock, Phone, Mail, MapPin, FileTextIcon } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { exportToExcel, exportToPDF, exportToWord } from "@/lib/exportUtils";
import { Badge } from "@/components/ui/badge";
import ExportDateRange from "./ExportDateRange";

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
  user_phone?: string;
  user_address?: string;
  service_name?: string;
  service_description?: string;
  service_price?: number;
  service_duration?: number;
  technician_name?: string;
  // Guest booking fields (from guest_bookings table)
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
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
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [viewAppointment, setViewAppointment] = useState<Appointment | null>(null);
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
    const appointmentIds = appointmentsData?.map(a => a.id) || [];

    const [profilesRes, servicesRes, techniciansRes, guestBookingsRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("user_id, email, full_name, phone, address").in("user_id", userIds)
        : { data: [] as any[] },
      serviceIds.length > 0 ? supabase.from("services").select("id, name, description, price, duration_minutes").in("id", serviceIds) : { data: [] },
      technicianIds.length > 0 ? supabase.from("technicians").select("id, name").in("id", technicianIds) : { data: [] },
      // Fetch guest bookings for appointments without user_id
      appointmentIds.length > 0 
        ? supabase.from("guest_bookings").select("appointment_id, guest_name, guest_email, guest_phone").in("appointment_id", appointmentIds)
        : { data: [] as any[] },
    ]);

    const profilesMap: Record<string, { email: string; name: string; phone?: string; address?: string }> = {};
    profilesRes.data?.forEach(p => {
      profilesMap[p.user_id] = { 
        email: p.email || "", 
        name: p.full_name || "",
        phone: p.phone || undefined,
        address: p.address || undefined
      };
    });

    const servicesMap: Record<string, { name: string; description?: string; price?: number; duration?: number }> = {};
    servicesRes.data?.forEach(s => {
      servicesMap[s.id] = { 
        name: s.name, 
        description: s.description || undefined,
        price: s.price || undefined,
        duration: s.duration_minutes || undefined
      };
    });

    const techniciansMap: Record<string, string> = {};
    techniciansRes.data?.forEach(t => {
      techniciansMap[t.id] = t.name;
    });

    // Map guest bookings by appointment ID
    const guestBookingsMap: Record<string, { name: string; email: string; phone: string }> = {};
    guestBookingsRes.data?.forEach(g => {
      guestBookingsMap[g.appointment_id] = {
        name: g.guest_name,
        email: g.guest_email,
        phone: g.guest_phone
      };
    });

    const enrichedAppointments = appointmentsData?.map(a => {
      const guestData = guestBookingsMap[a.id];
      return {
        ...a,
        user_email: a.user_id ? profilesMap[a.user_id]?.email : undefined,
        user_name: a.user_id ? profilesMap[a.user_id]?.name : undefined,
        user_phone: a.user_id ? profilesMap[a.user_id]?.phone : undefined,
        user_address: a.user_id ? profilesMap[a.user_id]?.address : undefined,
        service_name: a.service_id ? servicesMap[a.service_id]?.name : undefined,
        service_description: a.service_id ? servicesMap[a.service_id]?.description : undefined,
        service_price: a.service_id ? servicesMap[a.service_id]?.price : undefined,
        service_duration: a.service_id ? servicesMap[a.service_id]?.duration : undefined,
        technician_name: a.technician_id ? techniciansMap[a.technician_id] : undefined,
        // Guest booking data (for appointments without user_id)
        guest_name: guestData?.name,
        guest_email: guestData?.email,
        guest_phone: guestData?.phone,
      };
    }) || [];

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

  const handleExport = (type: 'excel' | 'pdf' | 'word', fromDate: string | null, toDate: string | null) => {
    let dataToExport = filteredAppointments;

    // Filter by date range if provided
    if (fromDate && toDate) {
      dataToExport = dataToExport.filter(a => {
        const appointmentDate = parseISO(a.appointment_date);
        return isWithinInterval(appointmentDate, {
          start: parseISO(fromDate),
          end: parseISO(toDate)
        });
      });
    }

    const exportData = dataToExport.map(a => ({
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

    const dateRangeStr = fromDate && toDate 
      ? `_${fromDate}_to_${toDate}` 
      : '';
    const filename = `appointments${dateRangeStr}_${format(new Date(), 'yyyy-MM-dd')}`;
    
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
    
    toast({ title: "Success", description: `Exported ${exportData.length} records to ${type.toUpperCase()}` });
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
          <ExportDateRange onExport={handleExport} />
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
                      <p className="font-medium text-foreground">
                        {appointment.user_name || appointment.guest_name || (appointment.user_id ? "Unknown" : "Guest Booking")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.user_email || appointment.guest_email || "No email"}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div>
                      <p className="font-medium text-foreground">{appointment.service_name || "Not specified"}</p>
                      {appointment.service_price && (
                        <p className="text-xs text-muted-foreground">₹{appointment.service_price}</p>
                      )}
                    </div>
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
                      {/* View Details Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setViewAppointment(appointment);
                          setViewDetailsDialog(true);
                        }}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                        title="View appointment details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
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

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialog} onOpenChange={setViewDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Appointment Details
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              View complete appointment information and take actions
            </p>
          </DialogHeader>
          {viewAppointment && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reference ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {viewAppointment.reference_id || "-"}
                  </span>
                  <Badge className={getStatusColor(viewAppointment.status)}>
                    {viewAppointment.status.charAt(0).toUpperCase() + viewAppointment.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                  <User className="w-4 h-4" />
                  Customer Information
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">
                      {viewAppointment.user_name || viewAppointment.guest_name || (viewAppointment.user_id ? "Unknown" : "Guest Booking")}
                    </span>
                  </div>
                  {(viewAppointment.user_email || viewAppointment.guest_email) && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span>{viewAppointment.user_email || viewAppointment.guest_email}</span>
                    </div>
                  )}
                  {(viewAppointment.user_phone || viewAppointment.guest_phone) && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span>{viewAppointment.user_phone || viewAppointment.guest_phone}</span>
                    </div>
                  )}
                  {viewAppointment.user_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span>{viewAppointment.user_address}</span>
                    </div>
                  )}
                  {!viewAppointment.user_id && viewAppointment.guest_name && (
                    <Badge variant="outline" className="w-fit mt-1">Guest Booking</Badge>
                  )}
                </div>
              </div>

              {/* Service Information */}
              <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                  <Wrench className="w-4 h-4" />
                  Service Requested
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium text-primary">
                      {viewAppointment.service_name || "Not specified"}
                    </span>
                  </div>
                  {viewAppointment.service_description && (
                    <p className="text-muted-foreground text-xs">
                      {viewAppointment.service_description}
                    </p>
                  )}
                  {viewAppointment.service_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">₹{viewAppointment.service_price}</span>
                    </div>
                  )}
                  {viewAppointment.service_duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{viewAppointment.service_duration} minutes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Schedule */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4" />
                  Schedule
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">
                      {format(new Date(viewAppointment.appointment_date), "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{viewAppointment.appointment_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Technician:</span>
                    <span className="font-medium">
                      {viewAppointment.technician_name || "Not assigned"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewAppointment.notes && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-foreground">
                    <FileTextIcon className="w-4 h-4" />
                    Notes
                  </h4>
                  <p className="text-sm text-muted-foreground">{viewAppointment.notes}</p>
                </div>
              )}

              {/* Created At */}
              <div className="text-xs text-muted-foreground text-right">
                <Clock className="w-3 h-3 inline mr-1" />
                Created: {format(new Date(viewAppointment.created_at), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          {viewAppointment && (
            <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
              {/* Pending Actions */}
              {viewAppointment.status === "pending" && (
                <>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      updateStatus(viewAppointment.id, "confirmed");
                      setViewDetailsDialog(false);
                    }}
                    disabled={!permissions.can_confirm_appointments && !isSuperAdmin}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateStatus(viewAppointment.id, "cancelled");
                      setViewDetailsDialog(false);
                    }}
                    disabled={!permissions.can_confirm_appointments && !isSuperAdmin}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              
              {/* Confirmed Actions */}
              {viewAppointment.status === "confirmed" && (
                <>
                  <Button
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      updateStatus(viewAppointment.id, "completed");
                      setViewDetailsDialog(false);
                    }}
                    disabled={!permissions.can_confirm_appointments && !isSuperAdmin}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Completed
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateStatus(viewAppointment.id, "cancelled");
                      setViewDetailsDialog(false);
                    }}
                    disabled={!permissions.can_confirm_appointments && !isSuperAdmin}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              
              {/* Completed Actions */}
              {viewAppointment.status === "completed" && onNavigateToInvoice && (
                <Button
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    onNavigateToInvoice(viewAppointment.id);
                    setViewDetailsDialog(false);
                  }}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
              )}
              
              {/* Cancelled Status */}
              {viewAppointment.status === "cancelled" && (
                <span className="text-sm text-muted-foreground px-4 py-2">
                  This appointment has been cancelled
                </span>
              )}
              
              {/* Delete/Request Deletion */}
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => {
                  setViewDetailsDialog(false);
                  handleDeleteClick(viewAppointment);
                }}
              >
                {isSuperAdmin || permissions.can_delete_appointments ? (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Request Deletion
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAppointments;
