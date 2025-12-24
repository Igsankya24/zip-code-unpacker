import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Clock, User, Mail, Phone, Tag, Briefcase, ExternalLink } from "lucide-react";
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

interface Message {
  type: "bot" | "user";
  text?: string;
  showFallback?: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number | null;
}

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  valid_until: string;
  current_uses: number;
}

interface BotSettings {
  whatsappNumber: string;
  whatsappMessage: string;
  showServicesFallback: boolean;
  whatsappFallbackEnabled: boolean;
}

type BookingStep = "chat" | "date" | "time" | "details" | "confirm";

// 3-hour appointment slots from 9 AM to 8 PM (last slot at 5 PM ends at 8 PM)
const timeSlots = [
  "09:00 AM",
  "12:00 PM",
  "02:00 PM",
  "05:00 PM"
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! 👋 Welcome to Krishna Tech Solutions. How can I help you today?");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<BookingStep>("chat");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [userDetails, setUserDetails] = useState({ name: "", email: "", phone: "" });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    whatsappNumber: "+917026292525",
    whatsappMessage: "Hi! I need help with...",
    showServicesFallback: true,
    whatsappFallbackEnabled: true,
  });
  const { toast } = useToast();

  const quickOptions = ["View Services", "Book Appointment", "Contact Us"];

  useEffect(() => {
    fetchSettings();
    fetchServices();
  }, []);

  useEffect(() => {
    setMessages([{ type: "bot", text: welcomeMessage }]);
  }, [welcomeMessage]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "chatbot_welcome",
        "bot_whatsapp_number",
        "bot_whatsapp_message",
        "bot_show_services_fallback",
        "bot_whatsapp_fallback",
      ]);
    
    if (data) {
      data.forEach((setting) => {
        if (setting.key === "chatbot_welcome" && setting.value) {
          setWelcomeMessage(setting.value);
        }
        if (setting.key === "bot_whatsapp_number" && setting.value) {
          setBotSettings((prev) => ({ ...prev, whatsappNumber: setting.value }));
        }
        if (setting.key === "bot_whatsapp_message" && setting.value) {
          setBotSettings((prev) => ({ ...prev, whatsappMessage: setting.value }));
        }
        if (setting.key === "bot_show_services_fallback") {
          setBotSettings((prev) => ({ ...prev, showServicesFallback: setting.value === "true" }));
        }
        if (setting.key === "bot_whatsapp_fallback") {
          setBotSettings((prev) => ({ ...prev, whatsappFallbackEnabled: setting.value === "true" }));
        }
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

  const validateCoupon = async (code: string) => {
    if (!code.trim()) return null;
    
    setValidatingCoupon(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .gte("valid_until", new Date().toISOString())
      .maybeSingle();

    setValidatingCoupon(false);

    if (error || !data) {
      toast({ title: "Invalid Coupon", description: "This coupon code is invalid or expired.", variant: "destructive" });
      return null;
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      toast({ title: "Coupon Limit Reached", description: "This coupon has reached its usage limit.", variant: "destructive" });
      return null;
    }

    return data as Coupon;
  };

  const handleApplyCoupon = async () => {
    const coupon = await validateCoupon(couponCode.trim());
    if (coupon) {
      setAppliedCoupon(coupon);
      toast({ title: "Coupon Applied!", description: `${coupon.discount_percent}% discount applied.` });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages([...messages, { type: "user", text: input }]);

    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("book") || lowerInput.includes("appointment") || lowerInput.includes("schedule")) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "I'd be happy to help you book an appointment! Each appointment is 3 hours long. Please select a date first:",
          },
        ]);
        setStep("date");
      }, 500);
    } else if (lowerInput.includes("service") || lowerInput.includes("price") || lowerInput.includes("offer")) {
      setTimeout(() => {
        const serviceList = services.map(s => `• ${s.name} - ₹${s.price || 'Contact for price'}`).join('\n');
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `Here are our services:\n\n${serviceList}\n\nWould you like to book an appointment?`,
          },
        ]);
      }, 500);
    } else {
      await supabase.from("contact_messages").insert({
        name: "Chat User",
        email: "chatbot@temp.com",
        message: input,
        source: "chatbot",
      });

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "Thank you for your message! Our team will get back to you shortly.",
            showFallback: true,
          },
        ]);
      }, 1000);
    }

    setInput("");
  };

  const handleQuickOption = (option: string) => {
    setMessages([...messages, { type: "user", text: option }]);

    setTimeout(() => {
      if (option === "Book Appointment") {
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: "Let me help you book an appointment! Each appointment is 3 hours long (9 AM - 8 PM). Please select a date:" },
        ]);
        setStep("date");
      } else if (option === "View Services") {
        const serviceList = services.map(s => `• ${s.name} - ₹${s.price || 'Contact for price'}`).join('\n');
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: `Here are our services:\n\n${serviceList}\n\nWould you like to book an appointment?` },
        ]);
      } else if (option === "Contact Us") {
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: "📞 Phone: +91 7026292525\n📧 Email: krishnatechsolutions2024@gmail.com\n📍 Address: Main Road, Karnataka\n\nOr leave us a message and we'll get back to you!" },
        ]);
      }
    }, 800);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setMessages((prev) => [
      ...prev,
      { type: "user", text: format(date, "PPP") },
      { type: "bot", text: "Please select a time slot (each appointment is 3 hours):" },
    ]);
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setMessages((prev) => [
      ...prev,
      { type: "user", text: time },
      { type: "bot", text: "Now please fill in your details and select a service:" },
    ]);
    setStep("details");
  };

  const getSelectedServiceData = () => {
    return services.find(s => s.id === selectedService);
  };

  const handleBookingSubmit = async () => {
    if (!userDetails.name || !userDetails.email || !userDetails.phone || !selectedService) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const service = getSelectedServiceData();
    const discountText = appliedCoupon ? ` (${appliedCoupon.discount_percent}% off with code: ${appliedCoupon.code})` : "";
    const finalPrice = service?.price 
      ? appliedCoupon 
        ? service.price * (1 - appliedCoupon.discount_percent / 100)
        : service.price
      : null;

    await supabase.from("contact_messages").insert({
      name: userDetails.name,
      email: userDetails.email,
      phone: userDetails.phone,
      subject: `Appointment: ${service?.name}${discountText}`,
      message: `Booking request for ${service?.name} on ${selectedDate ? format(selectedDate, "PPP") : ""} at ${selectedTime} (3-hour appointment)${appliedCoupon ? `. Coupon: ${appliedCoupon.code} (${appliedCoupon.discount_percent}% off)` : ""}`,
      source: "chatbot_booking",
    });

    // Update coupon usage if applied
    if (appliedCoupon) {
      await supabase
        .from("coupons")
        .update({ current_uses: appliedCoupon.current_uses + 1 })
        .eq("id", appliedCoupon.id);
    }

    setMessages((prev) => [
      ...prev,
      { type: "user", text: `Booking: ${service?.name}` },
      {
        type: "bot",
        text: `✅ Booking Request Submitted!\n\n📋 Service: ${service?.name}\n📅 Date: ${selectedDate ? format(selectedDate, "PPP") : ""}\n⏰ Time: ${selectedTime} (3 hours)\n👤 Name: ${userDetails.name}${appliedCoupon ? `\n🎟️ Discount: ${appliedCoupon.discount_percent}% off` : ""}${finalPrice ? `\n💰 Price: ₹${finalPrice.toFixed(0)}` : ""}\n\nWe'll confirm your appointment shortly via email/phone. Thank you!`,
      },
    ]);

    toast({ title: "Success", description: "Booking request submitted!" });
    resetBooking();
  };

  const resetBooking = () => {
    setStep("chat");
    setSelectedService("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setUserDetails({ name: "", email: "", phone: "" });
    setCouponCode("");
    setAppliedCoupon(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 ${
          isOpen ? "hidden" : ""
        }`}
      >
        <MessageCircle className="w-7 h-7 text-primary-foreground" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-primary to-accent p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-primary-foreground">Tech Support</h4>
                <span className="text-xs text-primary-foreground/80">Online • Replies instantly</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.type === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-line ${
                    msg.type === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-card-foreground rounded-bl-md shadow-sm border border-border"
                  }`}
                >
                  {msg.text}
                </div>
                
                {/* WhatsApp & Services Fallback */}
                {msg.showFallback && (botSettings.whatsappFallbackEnabled || botSettings.showServicesFallback) && (
                  <div className="mt-2 max-w-[80%] space-y-2">
                    {botSettings.whatsappFallbackEnabled && (
                      <a
                        href={`https://wa.me/${botSettings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(botSettings.whatsappMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Contact on WhatsApp
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    
                    {botSettings.showServicesFallback && services.length > 0 && (
                      <div className="bg-card border border-border rounded-lg p-3">
                        <p className="text-xs font-medium text-foreground mb-2">Our Services:</p>
                        <div className="space-y-1">
                          {services.slice(0, 4).map((s) => (
                            <div key={s.id} className="text-xs text-muted-foreground flex justify-between">
                              <span>• {s.name}</span>
                              {s.price && <span>₹{s.price}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Date Selection - Step 1 */}
            {step === "date" && (
              <div className="bg-card rounded-lg p-2 border border-border">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-md pointer-events-auto"
                />
              </div>
            )}

            {/* Time Selection - Step 2 */}
            {step === "time" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">Working hours: 9 AM - 8 PM (3hr slots)</p>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className="p-3 bg-card border border-border rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{time}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User Details Form - Step 3 */}
            {step === "details" && (
              <div className="space-y-4 bg-card p-4 rounded-lg border border-border">
                {/* Booking Summary */}
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary">Your Appointment</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d") : ""} at {selectedTime}
                  </p>
                  <button 
                    onClick={() => setStep("date")} 
                    className="text-xs text-primary underline mt-1"
                  >
                    Change Time
                  </button>
                </div>

                {/* Name */}
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

                {/* Email */}
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

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="+91 7026292525"
                      value={userDetails.phone}
                      onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Service Selection */}
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

                {/* Coupon */}
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <Tag className="w-4 h-4" /> Have a coupon?
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="ENTER CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1"
                      disabled={!!appliedCoupon}
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleApplyCoupon} 
                      disabled={validatingCoupon || !!appliedCoupon || !couponCode.trim()}
                      className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      {validatingCoupon ? "..." : appliedCoupon ? "Applied" : "Apply"}
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {appliedCoupon.discount_percent}% discount applied!
                    </p>
                  )}
                </div>

                <Button onClick={handleBookingSubmit} className="w-full bg-primary hover:bg-primary/90">
                  Confirm Booking
                </Button>
              </div>
            )}
          </div>

          {step === "chat" ? (
            <>
              <div className="px-4 py-3 border-t border-border bg-card">
                <div className="flex flex-wrap gap-2">
                  {quickOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleQuickOption(option)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-border bg-card flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="p-4 border-t border-border bg-card">
              <Button variant="outline" onClick={resetBooking} className="w-full">
                Cancel Booking
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
