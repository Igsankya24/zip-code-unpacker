import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Clock,
  Users,
  Award,
  MessageSquare,
  Phone,
  ChevronRight,
} from "lucide-react";

interface SiteSettings {
  [key: string]: string;
}

const Lander = () => {
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const s: SiteSettings = {};
        data.forEach((item) => (s[item.key] = item.value));
        setSettings(s);
      }
    };
    fetchSettings();
  }, []);

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Quick turnaround on all tech solutions with same-day service available.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your data and devices are protected with enterprise-grade security.",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Round-the-clock assistance for all your technical emergencies.",
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Certified professionals with years of industry experience.",
    },
    {
      icon: Award,
      title: "Quality Guaranteed",
      description: "100% satisfaction guarantee on all our services.",
    },
    {
      icon: MessageSquare,
      title: "Easy Communication",
      description: "Stay updated with real-time progress tracking and support.",
    },
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Business Owner",
      content: "Outstanding service! They fixed my entire office network in just a few hours. Highly recommend their professional team.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Startup Founder",
      content: "The web development team created exactly what I envisioned. Fast, responsive, and great communication throughout.",
      rating: 5,
    },
    {
      name: "Amit Patel",
      role: "IT Manager",
      content: "Reliable IT support that truly understands business needs. They've been our trusted partner for over 2 years now.",
      rating: 5,
    },
  ];

  const stats = [
    { value: settings.stat_1_value || "3K+", label: "Happy Customers" },
    { value: settings.stat_2_value || "95%", label: "Satisfaction Rate" },
    { value: settings.stat_3_value || "3+", label: "Years Experience" },
    { value: settings.stat_4_value || "24/7", label: "Support Available" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              {settings.hero_badge || "Trusted Tech Solutions Since 2022"}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transform Your Business with{" "}
              <span className="text-primary">Expert Tech Solutions</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              From web development to IT support, we provide comprehensive technology services 
              that help your business grow and succeed in the digital age.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8">
                <Link to="/services">
                  Explore Services <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link to="/contact">
                  Get Free Consultation
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Your Tech Success
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We combine expertise, reliability, and innovation to deliver solutions that exceed expectations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Clients Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our satisfied customers have to say.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple and straightforward process to get your tech solutions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Contact Us", desc: "Reach out via form, call, or chat" },
              { step: "02", title: "Consultation", desc: "We assess your needs and requirements" },
              { step: "03", title: "Solution", desc: "We implement the perfect solution" },
              { step: "04", title: "Support", desc: "Ongoing support and maintenance" },
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
                {index < 3 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 h-8 w-8 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl mb-10 text-primary-foreground/90">
              Get started today with a free consultation. Our experts are ready to help you achieve your technology goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-lg px-8">
                <Link to="/contact">
                  Schedule Consultation <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <a href={`tel:${settings.contact_phone || "+91 7026292525"}`}>
                  <Phone className="mr-2 h-5 w-5" />
                  Call Now
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>100% Satisfaction Guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Certified Professionals</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Secure & Confidential</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Affordable Pricing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer for Lander */}
      <footer className="py-8 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Krishna Tech Solutions. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors">
              Services
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Lander;
