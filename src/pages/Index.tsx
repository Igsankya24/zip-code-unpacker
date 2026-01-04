import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import ServiceCard from "@/components/ServiceCard";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  HardDrive, RefreshCw, KeyRound, Wrench, Shield, Zap, ArrowRight, Phone, Clock, Award,
  Globe, Laptop, Database, Settings, Wifi, LucideIcon, Star, Quote,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  content: string;
  rating: number;
  avatar_url: string | null;
}

const iconMap: Record<string, LucideIcon> = {
  HardDrive, RefreshCw, KeyRound, Wrench, Shield, Zap, Globe, Laptop, Database, Settings, Wifi,
};

const Index = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings: s } = useSiteSettings();

  useEffect(() => {
    fetchServices();
    fetchTestimonials();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, description, icon")
      .eq("is_visible", true)
      .order("display_order", { ascending: true })
      .limit(4);
    if (data) setServices(data);
    setLoading(false);
  };

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("id, name, role, company, content, rating, avatar_url")
      .eq("is_visible", true)
      .order("display_order", { ascending: true })
      .limit(6);
    if (data) setTestimonials(data);
  };

  const stats = [
    { value: s.stat_1_value || "10K+", label: s.stat_1_label || "Happy Customers" },
    { value: s.stat_2_value || "95%", label: s.stat_2_label || "Recovery Rate" },
    { value: s.stat_3_value || "5+", label: s.stat_3_label || "Years Experience" },
    { value: s.stat_4_value || "24/7", label: s.stat_4_label || "Support Available" },
  ];

  const whyUs = [
    { icon: Shield, title: s.whyus_feature1_title || "100% Data Safety", description: s.whyus_feature1_desc || "Your data security is our top priority. We follow strict protocols." },
    { icon: Zap, title: s.whyus_feature2_title || "Fast Turnaround", description: s.whyus_feature2_desc || "Most services completed within 24-48 hours." },
    { icon: Award, title: s.whyus_feature3_title || "Expert Technicians", description: s.whyus_feature3_desc || "Certified professionals with years of experience." },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-section min-h-[80vh] md:min-h-[90vh] flex items-center relative overflow-hidden py-12 md:py-0">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-48 md:w-72 h-48 md:h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 md:w-96 h-64 md:h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in">
              <span className="inline-block px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/20 text-primary text-xs md:text-sm font-medium mb-6 md:mb-8">
                {s.hero_badge || "Trusted Tech Solutions Since 2022"}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-hero-foreground mb-4 md:mb-6">
              {s.hero_title_1 || "Your Data is"} <span className="gradient-text">{s.hero_title_highlight || "Precious"}</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>{s.hero_title_2 || "We Recover It"}
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-hero-foreground/70 max-w-2xl mx-auto mb-8 md:mb-10 px-4">
              {s.hero_description || "Professional data recovery, Windows services, and computer repairs. Expert solutions with no data loss guarantee."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <Link to={s.hero_btn1_link || "/contact"} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  {s.hero_btn1_text || "Get Free Consultation"}
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                </Button>
              </Link>
              <Link to={s.hero_btn2_link || "/services"} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  {s.hero_btn2_text || "View Services"}
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-hero-foreground/10">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-hero-foreground/60 text-xs md:text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-12 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <span className="text-primary font-medium text-sm md:text-base">{s.home_services_badge || "Our Services"}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2">{s.home_services_title || "What We Offer"}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-3 md:mt-4 text-sm md:text-base px-4">
              {s.home_services_desc || "Comprehensive tech solutions for all your computer needs."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
            {loading ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">Loading services...</div>
            ) : services.length > 0 ? (
              services.map((service) => (
                <ServiceCard key={service.id} icon={iconMap[service.icon || "Globe"] || Globe} title={service.name} description={service.description || ""} />
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">No services available</div>
            )}
          </div>

          <div className="text-center mt-8 md:mt-12">
            <Link to="/services">
              <Button variant="outline" size="lg">{s.home_services_btn || "View All Services"}<ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-12 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-16">
              <span className="text-primary font-medium text-sm md:text-base">{s.testimonials_badge || "Testimonials"}</span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2">{s.testimonials_title || "What Our Customers Say"}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-card rounded-2xl p-6 border border-border relative">
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= t.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-4">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {t.avatar_url ? <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" /> : <span className="text-muted-foreground">{t.name.charAt(0)}</span>}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role && t.company ? `${t.role}, ${t.company}` : t.role || t.company || "Customer"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-12 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <span className="text-primary font-medium text-sm md:text-base">{s.whyus_badge || "Why Choose Us"}</span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4 md:mb-6">{s.whyus_title || "Trusted by Thousands of Customers"}</h2>
              <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">{s.whyus_description || "We combine expertise with cutting-edge technology."}</p>
              <div className="space-y-4 md:space-y-6">
                {whyUs.map((item, idx) => (
                  <div key={idx} className="flex gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" /></div>
                    <div><h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">{item.title}</h3><p className="text-muted-foreground text-xs md:text-sm">{item.description}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-2xl md:rounded-3xl p-6 md:p-8 card-shadow border border-border">
              <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">{s.whyus_contact_title || "Quick Contact"}</h3>
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-muted/50"><Phone className="w-6 h-6 md:w-8 md:h-8 text-primary" /><div><p className="text-xs md:text-sm text-muted-foreground">Call Us Now</p><p className="font-semibold text-foreground text-sm md:text-base">{s.contact_phone || "+91 7026292525"}</p></div></div>
                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-muted/50"><Clock className="w-6 h-6 md:w-8 md:h-8 text-primary" /><div><p className="text-xs md:text-sm text-muted-foreground">Working Hours</p><p className="font-semibold text-foreground text-sm md:text-base">{s.whyus_working_hours || "Mon-Sat: 9AM - 8PM"}</p></div></div>
              </div>
              <Link to="/contact" className="block mt-4 md:mt-6"><Button className="w-full" size="lg">{s.whyus_btn_text || "Book Appointment"}</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 hero-section relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"><div className="absolute top-10 right-20 w-48 md:w-64 h-48 md:h-64 bg-primary/30 rounded-full blur-3xl" /><div className="absolute bottom-10 left-20 w-56 md:w-80 h-56 md:h-80 bg-accent/30 rounded-full blur-3xl" /></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-hero-foreground mb-4 md:mb-6">{s.cta_title_1 || "Lost Your Data?"}<br /><span className="gradient-text">{s.cta_title_highlight || "We Can Help!"}</span></h2>
            <p className="text-hero-foreground/70 text-sm md:text-lg mb-8 md:mb-10 max-w-xl mx-auto px-4">{s.cta_description || "Contact us for a free consultation."}</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <Link to={s.cta_btn_link || "/contact"} className="w-full sm:w-auto"><Button size="lg" className="w-full sm:w-auto">{s.cta_btn_text || "Contact Us Now"}<ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" /></Button></Link>
              <a href={`tel:${s.contact_phone || "+917026292525"}`} className="w-full sm:w-auto"><Button variant="outline" size="lg" className="w-full sm:w-auto"><Phone className="w-4 h-4 md:w-5 md:h-5 mr-2" />Call: {s.contact_phone || "+91 7026292525"}</Button></a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;