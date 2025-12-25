import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, CheckCircle, XCircle, Calendar, LogOut, Home, RefreshCw, CalendarClock } from "lucide-react";
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

// Generate time slots based on settings
const generateTimeSlots = (startTime: string, endTime: string, durationMinutes: number): string[] => {
  const slots: string[] = [];
  const [startHour] = startTime.split(":").map(Number);
  const [endHour] = endTime.split(":").map(Number);
  
  let currentHour = startHour;
  let currentMinute = 0;
  
  while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
    const slotEndMinutes = currentHour * 60 + currentMinute + durationMinutes;
    const endTimeMinutes = endHour * 60;
    
    if (slotEndMinutes <= endTimeMinutes) {
      const hour12 = currentHour % 12 || 12;
      const ampm = currentHour >= 12 ? "PM" : "AM";
      const minuteStr = currentMinute.toString().padStart(2, "0");
      slots.push(`${hour12.toString().padStart(2, "0")}:${minuteStr} ${ampm}`);
    }
    
    currentMinute += durationMinutes;
    while (currentMinute >= 60) {
      currentMinute -= 60;
      currentHour += 1;
    }
  }
  
  return slots;
};

// Convert 12hr format to 24hr for database
const convertTo24Hr = (time12: string): string => {
  const [time, modifier] = time12.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") hours = modifier === "AM" ? "00" : "12";
  else if (modifier === "PM") hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, "0")}:${minutes}:00`;
};

const UserDashboard = () => {
  const { user, isApproved, isLoading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Reschedule state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleStep, setRescheduleStep] = useState<"date" | "time">("date");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotSettings, setSlotSettings] = useState({ startTime: "09:00", endTime: "18:00", duration: 60 });
  const [rescheduling, setRescheduling] = useState(false);

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
    await fetchSlotSettings();

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

  const fetchSlotSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["working_start_time", "working_end_time", "slot_duration"]);
    
    if (data) {
      const settings: Record<string, string> = {};
      data.forEach(s => { settings[s.key] = s.value; });
      setSlotSettings({
        startTime: settings.working_start_time || "09:00",
        endTime: settings.working_end_time || "18:00",
        duration: parseInt(settings.slot_duration || "60", 10),
      });
    }
  };

  const fetchBookedSlots = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const { data } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("appointment_date", dateStr)
      .in("status", ["pending", "confirmed"]);

    if (data) {
      const booked = data.map(apt => {
        const time24 = apt.appointment_time;
        const [hours, minutes] = time24.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
      });
      setBookedSlots(booked);
    } else {
      setBookedSlots([]);
    }
  };

  const openReschedule = (appointment: Appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleDate(undefined);
    setRescheduleTime("");
    setRescheduleStep("date");
    setBookedSlots([]);
    setRescheduleOpen(true);
  };

  const handleRescheduleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    setRescheduleDate(date);
    await fetchBookedSlots(date);
    setRescheduleStep("time");
  };

  const handleRescheduleTimeSelect = async (time: string) => {
    if (!rescheduleAppointment || !rescheduleDate || !user) return;
    
    setRescheduling(true);
    const oldDate = rescheduleAppointment.appointment_date;
    const oldTime = rescheduleAppointment.appointment_time;
    const newDate = format(rescheduleDate, "yyyy-MM-dd");
    const newTime = convertTo24Hr(time);

    const { error } = await supabase
      .from("appointments")
      .update({
        appointment_date: newDate,
        appointment_time: newTime,
        status: "pending", // Reset to pending after reschedule
      })
      .eq("id", rescheduleAppointment.id);

    if (error) {
      toast.error("Failed to reschedule appointment");
    } else {
      // Create notification for rescheduled appointment
      await supabase.from("notifications").insert({
        title: "Appointment Rescheduled",
        message: `Appointment ${rescheduleAppointment.reference_id || ""} rescheduled from ${oldDate} ${oldTime} to ${newDate} ${time}`,
        type: "info",
        user_id: null, // Visible to admins
      });

      // Also notify the user
      await supabase.from("notifications").insert({
        title: "Appointment Rescheduled",
        message: `Your appointment has been rescheduled to ${format(rescheduleDate, "PPP")} at ${time}. It is now pending confirmation.`,
        type: "info",
        user_id: user.id,
      });

      toast.success("Appointment rescheduled successfully");
      setRescheduleOpen(false);
      fetchUserData();
    }
    setRescheduling(false);
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
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-primary hover:bg-primary/10"
                                onClick={() => openReschedule(appointment)}
                                disabled={updatingId === appointment.id}
                              >
                                <CalendarClock className="w-4 h-4 mr-1" />
                                Reschedule
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

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Reschedule Appointment
            </DialogTitle>
          </DialogHeader>

          {rescheduleAppointment && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium">{rescheduleAppointment.service_name}</p>
                <p className="text-xs text-muted-foreground">
                  Current: {format(new Date(rescheduleAppointment.appointment_date), "PPP")} at {rescheduleAppointment.appointment_time}
                </p>
              </div>

              {rescheduleStep === "date" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Select a new date:</p>
                  <CalendarComponent
                    mode="single"
                    selected={rescheduleDate}
                    onSelect={handleRescheduleDateSelect}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    className="rounded-md border pointer-events-auto"
                  />
                </div>
              )}

              {rescheduleStep === "time" && (
                <div className="space-y-3">
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-sm font-medium">{rescheduleDate ? format(rescheduleDate, "EEEE, MMMM d, yyyy") : ""}</p>
                    <button onClick={() => setRescheduleStep("date")} className="text-xs text-primary underline">
                      Change date
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">Select a time slot:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {generateTimeSlots(slotSettings.startTime, slotSettings.endTime, slotSettings.duration).map((time) => {
                      const isBooked = bookedSlots.some(booked => {
                        const normalizedBooked = booked.replace(/^0/, "");
                        const normalizedTime = time.replace(/^0/, "");
                        return normalizedBooked === normalizedTime || booked === time;
                      });
                      return (
                        <button
                          key={time}
                          onClick={() => !isBooked && handleRescheduleTimeSelect(time)}
                          disabled={isBooked || rescheduling}
                          className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-colors ${
                            isBooked
                              ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
                              : "bg-card border-border hover:bg-primary hover:text-primary-foreground"
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          <span>{time}</span>
                          {isBooked && <span className="text-xs">(Booked)</span>}
                        </button>
                      );
                    })}
                  </div>
                  {rescheduling && (
                    <p className="text-sm text-muted-foreground text-center">Rescheduling...</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;
