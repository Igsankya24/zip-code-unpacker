import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import ServiceCard from "@/components/ServiceCard";
import { supabase } from "@/integrations/supabase/client";
import { Monitor, Smartphone, Globe, Shield, Database, Headphones, Code, Server, Cloud, Lock, Zap, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  features: string[];
  is_visible: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Globe,
  Smartphone,
  Monitor,
  Shield,
  Database,
  Headphones,
  Code,
  Server,
  Cloud,
  Lock,
  Zap,
  Settings,
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_visible", true)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Our Services
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive technology solutions tailored to meet your business needs and drive digital transformation.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    title={service.name}
                    description={service.description || ""}
                    icon={iconMap[service.icon] || Globe}
                    features={service.features || []}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No services available at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Contact us today to discuss your project requirements and get a free consultation.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Services;
