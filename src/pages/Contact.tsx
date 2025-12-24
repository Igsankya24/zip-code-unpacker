import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  name: string;
}

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name")
      .eq("is_visible", true)
      .order("display_order");
    if (data) setServices(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Message Sent! ✓",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({ name: "", email: "", phone: "", service: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: ["+91 7026292525"],
    },
    {
      icon: Mail,
      title: "Email",
      details: ["info@krishnatechsolutions.com", "support@krishnatechsolutions.com"],
    },
    {
      icon: MapPin,
      title: "Address",
      details: ["Belgaum, Karnataka", "590014"],
    },
    {
      icon: Clock,
      title: "Working Hours",
      details: ["Monday - Saturday", "9:00 AM - 8:00 PM"],
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="hero-section py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
              Contact Us
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-hero-foreground mb-6">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-base md:text-lg text-hero-foreground/70 max-w-2xl mx-auto px-4">
              Have a question or need our services? We're here to help! Reach out to us and we'll respond within 24
              hours.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Contact Form */}
            <div className="bg-card rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 card-shadow border border-border">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">Send a Message</h2>
                  <p className="text-muted-foreground text-xs md:text-sm">Fill out the form and we'll get back to you</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Your Name</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="h-11 md:h-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 1234567890"
                      required
                      className="h-11 md:h-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    className="h-11 md:h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Service Required</label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    required
                    className="w-full h-11 md:h-12 px-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Your Message</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your issue or requirement..."
                    required
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6 md:space-y-8">
              <div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">Contact Information</h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Reach out to us through any of these channels. We're always happy to help!
                </p>
              </div>

              <div className="grid gap-4 md:gap-6">
                {contactInfo.map((info, idx) => (
                  <div key={idx} className="flex gap-4 md:gap-5 p-4 md:p-6 rounded-xl md:rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">{info.title}</h3>
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-muted-foreground text-xs md:text-sm">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map Placeholder */}
              <div className="rounded-xl md:rounded-2xl overflow-hidden border border-border h-48 md:h-64 bg-muted flex items-center justify-center">
                <div className="text-center px-4">
                  <MapPin className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-2 md:mb-3" />
                  <p className="text-muted-foreground text-sm md:text-base">Belgaum, Karnataka - 590014</p>
                  <a
                    href="https://maps.google.com/?q=Belgaum+Karnataka+590014"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs md:text-sm"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="text-center lg:text-left">
              <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">Need Immediate Assistance?</h3>
              <p className="text-muted-foreground text-sm md:text-base">Call us directly for urgent tech support.</p>
            </div>
            <a href="tel:+917026292525" className="w-full lg:w-auto">
              <Button size="lg" className="w-full lg:w-auto">
                <Phone className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Call: +91 7026292525
              </Button>
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
