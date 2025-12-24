import { useState, useEffect } from "react";
import { Calendar, X, Clock, User, Mail, Phone, Tag, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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

const timeSlots = ["09:00 AM", "12:00 PM", "02:00 PM", "05:00 PM"];

const BookingPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [buttonText, setButtonText] = useState("Book Appointment");
  const [step, setStep] = useState<"date" | "time" | "details">("date");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [userDetails, setUserDetails] = useState({ name: "", email: "", phone: "" });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchServices();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["booking_popup_enabled", "booking_popup_text"]);
    
    if (data) {
      const settings: Record<string, string> = {};
      data.forEach((s) => { settings[s.key] = s.value; });
      setEnabled(settings.booking_popup_enabled === "true");
      if (settings.booking_popup_text) setButtonText(settings.booking_popup_text);
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
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("details");
  };

  const getSelectedServiceData = () => services.find(s => s.id === selectedService);

  const handleSubmit = async () => {
    if (!userDetails.name || !userDetails.email || !userDetails.phone || !selectedService) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const service = getSelectedServiceData();
    const finalPrice = service?.price 
      ? appliedCoupon 
        ? service.price * (1 - appliedCoupon.discount_percent / 100)
        : service.price
      : null;

    await supabase.from("contact_messages").insert({
      name: userDetails.name,
      email: userDetails.email,
      phone: userDetails.phone,
      subject: `Appointment: ${service?.name}${appliedCoupon ? ` (${appliedCoupon.discount_percent}% off)` : ""}`,
      message: `Booking for ${service?.name} on ${selectedDate ? format(selectedDate, "PPP") : ""} at ${selectedTime} (3hr)${appliedCoupon ? `. Coupon: ${appliedCoupon.code}` : ""}`,
      source: "booking_popup",
    });

    if (appliedCoupon) {
      await supabase
        .from("coupons")
        .update({ current_uses: appliedCoupon.current_uses + 1 })
        .eq("id", appliedCoupon.id);
    }

    toast({ title: "Booking Submitted!", description: "We'll confirm your appointment shortly." });
    setSubmitting(false);
    resetForm();
    setIsOpen(false);
  };

  const resetForm = () => {
    setStep("date");
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedService("");
    setUserDetails({ name: "", email: "", phone: "" });
    setCouponCode("");
    setAppliedCoupon(null);
  };

  if (!enabled) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center gap-2 hover:scale-105 transition-all duration-300"
      >
        <Calendar className="w-5 h-5" />
        <span className="font-medium">{buttonText}</span>
      </button>

      {/* Booking Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              <p className="text-sm text-muted-foreground">Select a time slot (3-hour appointments):</p>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className="p-3 bg-card border border-border rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{time}</span>
                  </button>
                ))}
              </div>
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

              <div>
                <label className="text-sm font-medium mb-1 block">Name *</label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Your full name"
                    value={userDetails.name}
                    onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Email *</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={userDetails.email}
                    onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Phone *</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="+91 7026292525"
                    value={userDetails.phone}
                    onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                  />
                </div>
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

              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Confirm Booking"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingPopup;
