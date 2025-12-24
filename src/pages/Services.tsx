import Layout from "@/components/layout/Layout";
import ServiceCard from "@/components/ServiceCard";
import { Monitor, Smartphone, Globe, Shield, Database, Headphones } from "lucide-react";

const services = [
  {
    title: "Web Development",
    description: "Custom websites and web applications built with modern technologies for optimal performance and user experience.",
    icon: Globe,
    features: ["Responsive Design", "SEO Optimized", "Fast Loading", "Secure"]
  },
  {
    title: "Mobile App Development",
    description: "Native and cross-platform mobile applications for iOS and Android devices.",
    icon: Smartphone,
    features: ["iOS & Android", "Cross-Platform", "User-Friendly", "Scalable"]
  },
  {
    title: "Desktop Applications",
    description: "Powerful desktop software solutions for Windows, macOS, and Linux platforms.",
    icon: Monitor,
    features: ["Cross-Platform", "High Performance", "Offline Support", "Custom UI"]
  },
  {
    title: "Cybersecurity",
    description: "Comprehensive security solutions to protect your digital assets and data.",
    icon: Shield,
    features: ["Vulnerability Assessment", "Penetration Testing", "Security Audits", "Compliance"]
  },
  {
    title: "Database Solutions",
    description: "Design, implementation, and optimization of database systems for your business needs.",
    icon: Database,
    features: ["Design & Setup", "Migration", "Optimization", "Backup Solutions"]
  },
  {
    title: "IT Support",
    description: "24/7 technical support and maintenance services to keep your systems running smoothly.",
    icon: Headphones,
    features: ["24/7 Support", "Remote Assistance", "On-Site Service", "Maintenance"]
  }
];

const Services = () => {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <ServiceCard
                  key={index}
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  features={service.features}
                />
              ))}
            </div>
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
