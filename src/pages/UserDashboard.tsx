import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Calendar, LogOut, Home, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface UserAccess {
  can_book_appointments: boolean;
  can_apply_coupons: boolean;
  can_use_chatbot: boolean;
  can_view_services: boolean;
  can_contact_support: boolean;
}

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
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);

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

    // Fetch profile
    await fetchProfile();

    // Fetch user access permissions
    const { data: accessData } = await supabase
      .from("user_access")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (accessData) {
      setUserAccess({
        can_book_appointments: accessData.can_book_appointments ?? false,
        can_apply_coupons: accessData.can_apply_coupons ?? false,
        can_use_chatbot: accessData.can_use_chatbot ?? false,
        can_view_services: accessData.can_view_services ?? false,
        can_contact_support: accessData.can_contact_support ?? false,
      });
    }

    // Fetch user appointments - both directly linked and via chatbot
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-yellow-500/10 text-yellow-500";
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

  // Not approved - show pending message
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
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">User Dashboard</h1>
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
        {/* Access Permissions */}
        {userAccess && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Your Access Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className={`p-3 rounded-lg text-center ${userAccess.can_view_services ? "bg-green-500/10" : "bg-muted"}`}>
                  <p className="text-sm font-medium">View Services</p>
                  <p className={`text-xs ${userAccess.can_view_services ? "text-green-500" : "text-muted-foreground"}`}>
                    {userAccess.can_view_services ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div className={`p-3 rounded-lg text-center ${userAccess.can_book_appointments ? "bg-green-500/10" : "bg-muted"}`}>
                  <p className="text-sm font-medium">Book Appointments</p>
                  <p className={`text-xs ${userAccess.can_book_appointments ? "text-green-500" : "text-muted-foreground"}`}>
                    {userAccess.can_book_appointments ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div className={`p-3 rounded-lg text-center ${userAccess.can_apply_coupons ? "bg-green-500/10" : "bg-muted"}`}>
                  <p className="text-sm font-medium">Apply Coupons</p>
                  <p className={`text-xs ${userAccess.can_apply_coupons ? "text-green-500" : "text-muted-foreground"}`}>
                    {userAccess.can_apply_coupons ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div className={`p-3 rounded-lg text-center ${userAccess.can_use_chatbot ? "bg-green-500/10" : "bg-muted"}`}>
                  <p className="text-sm font-medium">Use Chatbot</p>
                  <p className={`text-xs ${userAccess.can_use_chatbot ? "text-green-500" : "text-muted-foreground"}`}>
                    {userAccess.can_use_chatbot ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div className={`p-3 rounded-lg text-center ${userAccess.can_contact_support ? "bg-green-500/10" : "bg-muted"}`}>
                  <p className="text-sm font-medium">Contact Support</p>
                  <p className={`text-xs ${userAccess.can_contact_support ? "text-green-500" : "text-muted-foreground"}`}>
                    {userAccess.can_contact_support ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointments */}
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
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(appointment.status)}
                      <div>
                        <p className="font-medium text-foreground">
                          {appointment.service_name || "Service"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.appointment_date), "PPP")} at{" "}
                          {appointment.appointment_time}
                        </p>
                        <div className="flex items-center gap-2">
                          {appointment.reference_id && (
                            <span className="text-xs text-muted-foreground font-mono">
                              Ref: {appointment.reference_id}
                            </span>
                          )}
                          {appointment.source === "chatbot" && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              via Chatbot
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;
