import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface DeletionRequest {
  id: string;
  request_type: string;
  target_id: string;
  requested_by: string;
  reason: string | null;
  status: string;
  created_at: string;
  requester_name?: string;
  target_info?: string;
}

const AdminDeletionRequests = () => {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("deletion_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Get requester info
    const requesterIds = [...new Set(data?.map(r => r.requested_by) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", requesterIds);

    const profilesMap: Record<string, string> = {};
    profiles?.forEach(p => {
      profilesMap[p.user_id] = p.full_name || p.email || "Unknown";
    });

    // Get target info for appointments
    const appointmentIds = data?.filter(r => r.request_type === "appointment").map(r => r.target_id) || [];
    let appointmentsMap: Record<string, string> = {};
    
    if (appointmentIds.length > 0) {
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, reference_id")
        .in("id", appointmentIds);
      
      appointments?.forEach(a => {
        appointmentsMap[a.id] = a.reference_id || a.id.substring(0, 8);
      });
    }

    const enrichedRequests = data?.map(r => ({
      ...r,
      requester_name: profilesMap[r.requested_by],
      target_info: r.request_type === "appointment" ? appointmentsMap[r.target_id] : r.target_id.substring(0, 8),
    })) || [];

    setRequests(enrichedRequests);
    setLoading(false);
  };

  const handleApprove = async (request: DeletionRequest) => {
    if (!isSuperAdmin) {
      toast({ title: "Error", description: "Only super admins can approve deletion requests", variant: "destructive" });
      return;
    }

    // Delete the target
    if (request.request_type === "appointment") {
      const { error: deleteError } = await supabase
        .from("appointments")
        .delete()
        .eq("id", request.target_id);

      if (deleteError) {
        toast({ title: "Error", description: deleteError.message, variant: "destructive" });
        return;
      }
    }

    // Update request status
    const { error } = await supabase
      .from("deletion_requests")
      .update({ 
        status: "approved", 
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", request.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Deletion request approved and item deleted" });
      
      // Create notification for the requester
      await supabase.from("notifications").insert({
        user_id: request.requested_by,
        title: "Deletion Request Approved",
        message: `Your deletion request for ${request.request_type} has been approved.`,
        type: "success"
      });
      
      fetchRequests();
    }
  };

  const handleReject = async (request: DeletionRequest) => {
    if (!isSuperAdmin) {
      toast({ title: "Error", description: "Only super admins can reject deletion requests", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("deletion_requests")
      .update({ 
        status: "rejected", 
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", request.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Deletion request rejected" });
      
      // Create notification for the requester
      await supabase.from("notifications").insert({
        user_id: request.requested_by,
        title: "Deletion Request Rejected",
        message: `Your deletion request for ${request.request_type} has been rejected.`,
        type: "warning"
      });
      
      fetchRequests();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-500";
      case "rejected": return "bg-red-500/10 text-red-500";
      default: return "bg-yellow-500/10 text-yellow-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <Check className="w-4 h-4" />;
      case "rejected": return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trash2 className="w-6 h-6 text-destructive" />
        <h2 className="text-2xl font-bold text-foreground">Deletion Requests</h2>
      </div>

      <p className="text-muted-foreground">
        Review and approve or reject deletion requests from admins.
      </p>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-4 text-left text-sm font-medium">Type</th>
                <th className="p-4 text-left text-sm font-medium">Target</th>
                <th className="p-4 text-left text-sm font-medium">Requested By</th>
                <th className="p-4 text-left text-sm font-medium">Reason</th>
                <th className="p-4 text-left text-sm font-medium">Date</th>
                <th className="p-4 text-left text-sm font-medium">Status</th>
                {isSuperAdmin && <th className="p-4 text-left text-sm font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {request.request_type === "appointment" && <Calendar className="w-4 h-4 text-primary" />}
                      <span className="capitalize">{request.request_type}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {request.target_info}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {request.requester_name}
                  </td>
                  <td className="p-4 text-muted-foreground max-w-xs truncate">
                    {request.reason || "-"}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {format(new Date(request.created_at), "MMM d, yyyy HH:mm")}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="p-4">
                      {request.status === "pending" && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(request)}
                            className="text-green-500 hover:text-green-600"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(request)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="p-8 text-center text-muted-foreground">
                    No deletion requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDeletionRequests;