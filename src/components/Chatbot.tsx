import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Calendar, Clock, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Message {
  type: "bot" | "user";
  text?: string;
}

interface Service {
  id: string;
  name: string;
  price: number | null;
}

type BookingStep = "chat" | "service" | "date" | "time" | "details" | "confirm";

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      text: "Hello! 👋 Welcome to Krishna Tech Solutions. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<BookingStep>("chat");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [userDetails, setUserDetails] = useState({ name: "", email: "", phone: "" });
  const { toast } = useToast();

  const quickOptions = ["Data Recovery", "Windows Upgrade", "Computer Repair", "Book Appointment"];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, price")
      .eq("is_visible", true)
      .eq("is_active", true);
    if (data) setServices(data);
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
            text: "I'd be happy to help you book an appointment! Let me guide you through the process. Please select a service:",
          },
        ]);
        setStep("service");
      }, 500);
    } else {
      // Save message to database
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
            text: "Thank you for your message! Our team will get back to you shortly. For immediate assistance, please call us at +91 7026292525.",
          },
        ]);
      }, 1000);
    }

    setInput("");
  };

  const handleQuickOption = (option: string) => {
    setMessages([...messages, { type: "user", text: option }]);

    setTimeout(() => {
      let response = "";
      if (option === "Book Appointment") {
        response = "Let me help you book an appointment. Please select a service:";
        setStep("service");
      } else if (option === "Data Recovery") {
        response = "We offer professional data recovery from HDDs, SSDs, USB drives, and memory cards with 95%+ success rate. Starting from ₹999. Would you like to book an appointment?";
      } else if (option === "Windows Upgrade") {
        response = "Seamless Windows upgrades while keeping all your files and settings intact. Starting from ₹999. Would you like to book an appointment?";
      } else {
        response = "Expert hardware and software repairs for all brands. Starting from ₹299. Would you like to book an appointment?";
      }

      setMessages((prev) => [...prev, { type: "bot", text: response }]);
    }, 800);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setMessages((prev) => [
      ...prev,
      { type: "user", text: service.name },
      { type: "bot", text: `Great choice! Now please select a date for your ${service.name} appointment:` },
    ]);
    setStep("date");
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setMessages((prev) => [
      ...prev,
      { type: "user", text: format(date, "PPP") },
      { type: "bot", text: "Please select a time slot:" },
    ]);
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setMessages((prev) => [
      ...prev,
      { type: "user", text: time },
      { type: "bot", text: "Please enter your details to confirm the booking:" },
    ]);
    setStep("details");
  };

  const handleBookingSubmit = async () => {
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    // Save contact message
    await supabase.from("contact_messages").insert({
      name: userDetails.name,
      email: userDetails.email,
      phone: userDetails.phone,
      subject: `Appointment: ${selectedService?.name}`,
      message: `Booking request for ${selectedService?.name} on ${selectedDate ? format(selectedDate, "PPP") : ""} at ${selectedTime}`,
      source: "chatbot_booking",
    });

    setMessages((prev) => [
      ...prev,
      { type: "user", text: `Name: ${userDetails.name}, Email: ${userDetails.email}` },
      {
        type: "bot",
        text: `✅ Booking Request Submitted!\n\n📋 Service: ${selectedService?.name}\n📅 Date: ${selectedDate ? format(selectedDate, "PPP") : ""}\n⏰ Time: ${selectedTime}\n👤 Name: ${userDetails.name}\n\nWe'll confirm your appointment shortly via email/phone. Thank you!`,
      },
    ]);

    toast({ title: "Success", description: "Booking request submitted!" });
    setStep("chat");
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setUserDetails({ name: "", email: "", phone: "" });
  };

  const resetBooking = () => {
    setStep("chat");
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setUserDetails({ name: "", email: "", phone: "" });
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

          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-line ${
                    msg.type === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-card-foreground rounded-bl-md shadow-sm border border-border"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Service Selection */}
            {step === "service" && (
              <div className="space-y-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full p-3 bg-card border border-border rounded-lg text-left hover:bg-muted transition-colors"
                  >
                    <p className="font-medium text-foreground">{service.name}</p>
                    {service.price && <p className="text-sm text-muted-foreground">₹{service.price}</p>}
                  </button>
                ))}
              </div>
            )}

            {/* Date Selection */}
            {step === "date" && (
              <div className="bg-card rounded-lg p-2 border border-border">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-md"
                />
              </div>
            )}

            {/* Time Selection */}
            {step === "time" && (
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{time}</span>
                  </button>
                ))}
              </div>
            )}

            {/* User Details Form */}
            {step === "details" && (
              <div className="space-y-3 bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Your Name"
                    value={userDetails.name}
                    onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={userDetails.email}
                    onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Your Phone"
                    value={userDetails.phone}
                    onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                  />
                </div>
                <Button onClick={handleBookingSubmit} className="w-full">
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
