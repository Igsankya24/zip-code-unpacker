import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Calendar, LogOut, Home, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Appointment {
  id: string;
  reference_id: string | null;
  service_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  service_name?: string;
  source?: string;
}

const UserDashboard = () => {
  const { user, isApproved, isLoading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
    if (!isLoading && isAdmin) {
      navigate("/admin");
    }
  }, [user, isLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isApproved) {
      fetchUserData();
    } else if (user && !isApproved) {
      fetchProfile();
      setLoadingData(false);
    }
  }, [user, isApproved]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile(data);
  };

  const fetchUserData = async () => {
    if (!user) return;
    setLoadingData(true);

    await fetchProfile();

    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id, reference_id, service_id, appointment_date, appointment_time, status, notes")
      .eq("user_id", user.id)
      .order("appointment_date", { ascending: false });

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
    }

    if (appointmentsData && appointmentsData.length > 0) {
      const serviceIds = [...new Set(appointmentsData.filter(a => a.service_id).map(a => a.service_id))] as string[];
      const { data: servicesData } = await supabase
        .from("services")
        .select("id, name")
        .in("id", serviceIds);

      const servicesMap: Record<string, string> = {};
      servicesData?.forEach(s => {
        servicesMap[s.id] = s.name;
      });

      setAppointments(
        appointmentsData.map(a => ({
          ...a,
          service_name: a.service_id ? servicesMap[a.service_id] : undefined,
          source: a.notes?.toLowerCase().includes("chatbot") ? "chatbot" : "booking",
        }))
      );
    } else {
      setAppointments([]);
    }

    setLoadingData(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update appointment status");
    } else {
      toast.success(`Appointment ${newStatus}`);
      fetchUserData();
    }
    setUpdatingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Pending</Badge>;
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Hi {profile?.full_name || "there"}! Your account is pending approval from an administrator.
            </p>
            <p className="text-sm text-muted-foreground">
              You'll receive full access once your account is approved. Please check back later.
            </p>
            <div className="pt-4 space-y-2">
              <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button variant="ghost" className="w-full" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">My Appointments</h1>
            <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name || profile?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Your Appointments
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchUserData} disabled={loadingData}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingData ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                You haven't booked any appointments yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-mono text-sm">
                          {appointment.reference_id || "-"}
                        </TableCell>
                        <TableCell>{appointment.service_name || "Service"}</TableCell>
                        <TableCell>
                          {format(new Date(appointment.appointment_date), "PPP")}
                        </TableCell>
                        <TableCell>{appointment.appointment_time}</TableCell>
                        <TableCell>
                          {appointment.source === "chatbot" ? (
                            <Badge variant="outline" className="text-xs">Chatbot</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Booking</Badge>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell className="text-right">
                          {appointment.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-500/10"
                                onClick={() => handleUpdateStatus(appointment.id, "confirmed")}
                                disabled={updatingId === appointment.id}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-500/10"
                                onClick={() => handleUpdateStatus(appointment.id, "cancelled")}
                                disabled={updatingId === appointment.id}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          )}
                          {appointment.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-500/10"
                              onClick={() => handleUpdateStatus(appointment.id, "cancelled")}
                              disabled={updatingId === appointment.id}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                          {(appointment.status === "cancelled" || appointment.status === "completed") && (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;
