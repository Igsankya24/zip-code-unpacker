import { useState, useEffect } from "react";
import { Calendar, Clock, User, Mail, Phone, Tag, Briefcase, ShieldAlert, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRazorpay } from "@/hooks/useRazorpay";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Service {
  id: string;
  name: string;
  price: number | null;
}

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  current_uses: number;
}

interface BookingPopupProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  preSelectedServiceId?: string | null;
}

// Convert 12hr format to 24hr for database
const convertTo24Hr = (time12: string): string => {
  const [time, modifier] = time12.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") hours = modifier === "AM" ? "00" : "12";
  else if (modifier === "PM") hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, "0")}:${minutes}:00`;
};

// Generate time slots based on settings
const generateTimeSlots = (startTime: string, endTime: string, durationMinutes: number): string[] => {
  const slots: string[] = [];
  const [startHour] = startTime.split(":").map(Number);
  const [endHour] = endTime.split(":").map(Number);
  
  let currentHour = startHour;
  let currentMinute = 0;
  
  while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
    // Check if slot would end before or at end time
    const slotEndMinutes = currentHour * 60 + currentMinute + durationMinutes;
    const endTimeMinutes = endHour * 60;
    
    if (slotEndMinutes <= endTimeMinutes) {
      const hour12 = currentHour % 12 || 12;
      const ampm = currentHour >= 12 ? "PM" : "AM";
      const minuteStr = currentMinute.toString().padStart(2, "0");
      slots.push(`${hour12.toString().padStart(2, "0")}:${minuteStr} ${ampm}`);
    }
    
    // Move to next slot
    currentMinute += durationMinutes;
    while (currentMinute >= 60) {
      currentMinute -= 60;
      currentHour += 1;
    }
  }
  
  return slots;
};

const BookingPopup = ({ isOpen: externalIsOpen, onOpenChange, preSelectedServiceId }: BookingPopupProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [buttonText, setButtonText] = useState("Book Appointment");
  const [step, setStep] = useState<"date" | "time" | "details">("date");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [guestDetails, setGuestDetails] = useState({ name: "", email: "", phone: "" });
  const [slotSettings, setSlotSettings] = useState({ 
    startTime: "09:00", 
    endTime: "18:00", 
    duration: 60 
  });
  const [accessDeniedOpen, setAccessDeniedOpen] = useState(false);
  const [deniedFeature, setDeniedFeature] = useState("");
  const { toast } = useToast();
  const { user, userAccess } = useAuth();
  const { initiatePayment, isConfigured: isPaymentConfigured, loading: paymentLoading } = useRazorpay();
  const navigate = useNavigate();

  // Check if user has access to a feature
  const checkAccess = (feature: keyof typeof userAccess, featureName: string): boolean => {
    // Guest users can always book (access is checked for logged-in users only)
    if (!user) return true;
    if (!userAccess[feature]) {
      setDeniedFeature(featureName);
      setAccessDeniedOpen(true);
      return false;
    }
    return true;
  };

  // Generate time slots based on settings
  const timeSlots = generateTimeSlots(slotSettings.startTime, slotSettings.endTime, slotSettings.duration);

  // Handle controlled vs uncontrolled state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  useEffect(() => {
    fetchSettings();
    fetchServices();
  }, []);

  // Handle pre-selected service
  useEffect(() => {
    if (preSelectedServiceId && services.length > 0) {
      const service = services.find(s => s.id === preSelectedServiceId);
      if (service) {
        setSelectedService(preSelectedServiceId);
      }
    }
  }, [preSelectedServiceId, services]);

  // Fetch booked slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["booking_popup_enabled", "booking_popup_text", "working_start_time", "working_end_time", "slot_duration"]);
    
    if (data) {
      const settings: Record<string, string> = {};
      data.forEach((s) => { settings[s.key] = s.value; });
      setEnabled(settings.booking_popup_enabled === "true");
      if (settings.booking_popup_text) setButtonText(settings.booking_popup_text);
      setSlotSettings({
        startTime: settings.working_start_time || "09:00",
        endTime: settings.working_end_time || "18:00",
        duration: parseInt(settings.slot_duration || "60", 10),
      });
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, price")
      .eq("is_visible", true)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (data) setServices(data);
  };

  const fetchBookedSlots = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const { data } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("appointment_date", dateStr)
      .in("status", ["pending", "confirmed"]);

    if (data) {
      // Convert booked times to 12hr format for comparison
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

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .gte("valid_until", new Date().toISOString())
      .maybeSingle();

    setValidatingCoupon(false);

    if (error || !data) {
      toast({ title: "Invalid Coupon", description: "This coupon is invalid or expired.", variant: "destructive" });
      return;
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      toast({ title: "Coupon Limit", description: "This coupon has reached its limit.", variant: "destructive" });
      return;
    }

    setAppliedCoupon(data as Coupon);
    toast({ title: "Coupon Applied!", description: `${data.discount_percent}% discount applied.` });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("details");
  };

  const getSelectedServiceData = () => services.find(s => s.id === selectedService);

  const isSlotBooked = (time: string): boolean => {
    // Normalize time format for comparison
    const normalizedTime = time.replace(/^0/, "");
    return bookedSlots.some(booked => {
      const normalizedBooked = booked.replace(/^0/, "");
      return normalizedBooked === normalizedTime || booked === time;
    });
  };

  const handleSubmit = async (withPayment: boolean = false) => {
    // Check access for logged-in users
    if (user && !checkAccess("can_book_appointments", "book appointments")) {
      return;
    }

    if (!selectedService || !selectedDate || !selectedTime) {
      toast({ title: "Error", description: "Please complete all steps", variant: "destructive" });
      return;
    }

    // Get fresh user state from supabase auth
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;

    // If not logged in, allow a guest booking but store it as an appointment
    if (!currentUser) {
      if (!guestDetails.name || !guestDetails.email || !guestDetails.phone) {
        toast({ title: "Missing details", description: "Please enter your name, email and phone", variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);

    // Get service details for payment
    const serviceData = getSelectedServiceData();
    const servicePrice = serviceData?.price || 0;
    
    // Calculate final price with discount
    let finalPrice = servicePrice;
    if (appliedCoupon) {
      finalPrice = servicePrice - (servicePrice * appliedCoupon.discount_percent / 100);
    }

    // Build notes with coupon info only (no PII)
    const noteParts: string[] = [];
    if (appliedCoupon) {
      noteParts.push(`Coupon: ${appliedCoupon.code} (${appliedCoupon.discount_percent}% off)`);
    }

    const insertData = {
      user_id: currentUser ? currentUser.id : null,
      service_id: selectedService,
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      appointment_time: convertTo24Hr(selectedTime),
      status: withPayment ? "pending_payment" : "pending",
      notes: noteParts.length ? noteParts.join(" | ") : null,
    };

    const { error, data } = await supabase
      .from("appointments")
      .insert(insertData)
      .select("id, reference_id")
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Store guest details in dedicated table for proper data management
    if (!currentUser && data?.id) {
      const { error: guestError } = await supabase
        .from("guest_bookings")
        .insert({
          appointment_id: data.id,
          guest_name: guestDetails.name,
          guest_email: guestDetails.email,
          guest_phone: guestDetails.phone,
        });

      if (guestError) {
        console.error("Error storing guest details:", guestError);
      }
    }

    // Handle payment if requested and amount > 0
    if (withPayment && finalPrice > 0 && isPaymentConfigured) {
      const paymentResult = await initiatePayment({
        amount: finalPrice,
        description: `Booking: ${serviceData?.name || "Service"}`,
        appointmentId: data?.id,
        customerName: currentUser ? undefined : guestDetails.name,
        customerEmail: currentUser?.email || guestDetails.email,
        customerPhone: currentUser ? undefined : guestDetails.phone,
        notes: {
          service: serviceData?.name || "",
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
        },
      });

      if (!paymentResult.success) {
        // Payment failed or cancelled - update status
        await supabase
          .from("appointments")
          .update({ status: "payment_failed" })
          .eq("id", data.id);
        
        setSubmitting(false);
        return;
      }

      // Payment successful - appointment already updated by edge function
      toast({
        title: "Booking Confirmed!",
        description: data?.reference_id
          ? `Payment successful. Reference: ${data.reference_id}`
          : "Your appointment has been confirmed with payment.",
      });
    } else {
      // No payment flow
      if (appliedCoupon) {
        await supabase
          .from("coupons")
          .update({ current_uses: appliedCoupon.current_uses + 1 })
          .eq("id", appliedCoupon.id);
      }

      toast({
        title: "Booking Submitted!",
        description: data?.reference_id
          ? `Your request was received. Reference: ${data.reference_id}`
          : "Your appointment request has been received. We'll confirm it shortly.",
      });
    }

    setSubmitting(false);
    resetForm();
    setIsOpen(false);
  };

  const resetForm = () => {
    setStep("date");
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedService("");
    setCouponCode("");
    setAppliedCoupon(null);
    setBookedSlots([]);
    setGuestDetails({ name: "", email: "", phone: "" });
  };

  // Only show floating button if enabled and not externally controlled
  const showFloatingButton = enabled && externalIsOpen === undefined;

  return (
    <>
      {/* Floating Button - only show if not externally controlled */}
      {showFloatingButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center gap-2 hover:scale-105 transition-all duration-300"
        >
          <Calendar className="w-5 h-5" />
          <span className="font-medium">{buttonText}</span>
        </button>
      )}

      {/* Booking Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Book Appointment
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Date */}
          {step === "date" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select a date for your appointment:</p>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="rounded-md border pointer-events-auto"
              />
            </div>
          )}

          {/* Step 2: Time */}
          {step === "time" && (
            <div className="space-y-4">
              <div className="bg-primary/5 p-3 rounded-lg">
                <p className="text-sm font-medium">{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}</p>
                <button onClick={() => setStep("date")} className="text-xs text-primary underline">Change date</button>
              </div>
              <p className="text-sm text-muted-foreground">Select a time slot ({slotSettings.duration >= 60 ? `${slotSettings.duration / 60} hour${slotSettings.duration > 60 ? 's' : ''}` : `${slotSettings.duration} min`} appointments):</p>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => {
                  const booked = isSlotBooked(time);
                  return (
                    <button
                      key={time}
                      onClick={() => !booked && handleTimeSelect(time)}
                      disabled={booked}
                      className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-colors ${
                        booked
                          ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
                          : "bg-card border-border hover:bg-primary hover:text-primary-foreground"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{time}</span>
                      {booked && <span className="text-xs">(Booked)</span>}
                    </button>
                  );
                })}
              </div>
              {bookedSlots.length === timeSlots.length && (
                <p className="text-sm text-destructive text-center">All slots are booked for this date. Please select another date.</p>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {step === "details" && (
            <div className="space-y-4">
              <div className="bg-primary/5 p-3 rounded-lg">
                <p className="text-sm font-medium">
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d") : ""} at {selectedTime}
                </p>
                <button onClick={() => setStep("date")} className="text-xs text-primary underline">Change</button>
              </div>

              {!user && (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-foreground">Booking as Guest</p>
                    <p className="text-xs text-muted-foreground">
                      Enter your details so we can confirm your appointment.
                    </p>
                  </div>

                  {/* Service Selection for Guest */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Service *</label>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} {service.price ? `- ₹${service.price}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Name *</label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Your full name"
                        value={guestDetails.name}
                        onChange={(e) => setGuestDetails((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Email *</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={guestDetails.email}
                        onChange={(e) => setGuestDetails((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone *</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="+91 7026292525"
                        value={guestDetails.phone}
                        onChange={(e) => setGuestDetails((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Tip: Login gives you access to your full booking history.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setIsOpen(false);
                        navigate("/auth");
                      }}
                    >
                      Login / Sign Up
                    </Button>
                  </div>

                  {/* Guest booking buttons */}
                  <div className="space-y-2">
                    {isPaymentConfigured && getSelectedServiceData()?.price ? (
                      <>
                        <Button 
                          onClick={() => handleSubmit(true)} 
                          disabled={submitting || paymentLoading || !selectedService} 
                          className="w-full"
                        >
                          {submitting || paymentLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pay ₹{(() => {
                                const price = getSelectedServiceData()?.price || 0;
                                return appliedCoupon 
                                  ? Math.round(price - (price * appliedCoupon.discount_percent / 100))
                                  : price;
                              })()} & Book
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleSubmit(false)} 
                          disabled={submitting || !selectedService} 
                          className="w-full"
                        >
                          {submitting ? "Submitting..." : "Book Without Payment"}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => handleSubmit(false)} disabled={submitting || !selectedService} className="w-full">
                        {submitting ? "Submitting..." : "Confirm Booking"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {user && (
                <>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Booking as:</p>
                    <p className="font-medium">{user.email}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Service *</label>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} {service.price ? `- ₹${service.price}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                      <Tag className="w-4 h-4" /> Have a coupon?
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="ENTER CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon}
                      />
                      <Button
                        variant="outline"
                        onClick={validateCoupon}
                        disabled={validatingCoupon || !!appliedCoupon || !couponCode.trim()}
                        className="text-primary border-primary"
                      >
                        {appliedCoupon ? "Applied" : "Apply"}
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <p className="text-xs text-green-600 mt-1">✓ {appliedCoupon.discount_percent}% off!</p>
                    )}
                  </div>

                  {/* Logged-in user booking buttons */}
                  <div className="space-y-2">
                    {isPaymentConfigured && getSelectedServiceData()?.price ? (
                      <>
                        <Button 
                          onClick={() => handleSubmit(true)} 
                          disabled={submitting || paymentLoading || !selectedService} 
                          className="w-full"
                        >
                          {submitting || paymentLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pay ₹{(() => {
                                const price = getSelectedServiceData()?.price || 0;
                                return appliedCoupon 
                                  ? Math.round(price - (price * appliedCoupon.discount_percent / 100))
                                  : price;
                              })()} & Book
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleSubmit(false)} 
                          disabled={submitting || !selectedService} 
                          className="w-full"
                        >
                          {submitting ? "Submitting..." : "Book Without Payment"}
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => handleSubmit(false)} 
                        disabled={submitting || !selectedService} 
                        className="w-full"
                      >
                        {submitting ? "Submitting..." : "Confirm Booking"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Access Denied Dialog */}
      <AlertDialog open={accessDeniedOpen} onOpenChange={setAccessDeniedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Access Restricted</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You don't have permission to {deniedFeature}. Please contact your administrator to request access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={() => {
              setAccessDeniedOpen(false);
              setIsOpen(false);
              navigate("/dashboard");
            }}>
              Go to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BookingPopup;
