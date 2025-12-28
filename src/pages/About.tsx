import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, Target, Award, Heart, CheckCircle2, ArrowRight } from "lucide-react";

interface Settings {
  [key: string]: string;
}

const About = () => {
  const [s, setS] = useState<Settings>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const settingsObj: Settings = {};
        data.forEach((item) => { settingsObj[item.key] = item.value; });
        setS(settingsObj);
      }
    };
    fetchSettings();
  }, []);

  const values = [
    { icon: Users, title: s.about_value1_title || "Customer First", description: s.about_value1_desc || "Your satisfaction is our priority. We go above and beyond to exceed expectations." },
    { icon: Target, title: s.about_value2_title || "Excellence", description: s.about_value2_desc || "We maintain the highest standards in every service we provide." },
    { icon: Award, title: s.about_value3_title || "Expertise", description: s.about_value3_desc || "Our team consists of certified professionals with years of experience." },
    { icon: Heart, title: s.about_value4_title || "Integrity", description: s.about_value4_desc || "We operate with complete transparency and honesty in all dealings." },
  ];

  const milestones = [
    { year: s.about_milestone1_year || "2019", title: s.about_milestone1_title || "Founded", desc: s.about_milestone1_desc || "Started our journey in tech solutions" },
    { year: s.about_milestone2_year || "2020", title: s.about_milestone2_title || "1000+ Customers", desc: s.about_milestone2_desc || "Reached our first major milestone" },
    { year: s.about_milestone3_year || "2022", title: s.about_milestone3_title || "Expanded Services", desc: s.about_milestone3_desc || "Added new service categories" },
    { year: s.about_milestone4_year || "2024", title: s.about_milestone4_title || "10000+ Customers", desc: s.about_milestone4_desc || "Trusted by thousands" },
  ];

  const storyStats = [
    { value: s.about_stat1_value || "10K+", label: s.about_stat1_label || "Happy Customers" },
    { value: s.about_stat2_value || "95%", label: s.about_stat2_label || "Recovery Rate" },
    { value: s.about_stat3_value || "5+", label: s.about_stat3_label || "Years Experience" },
    { value: s.about_stat4_value || "50+", label: s.about_stat4_label || "Services Offered" },
  ];

  const missionPoints = (s.about_mission_points || "Recover data that others say is lost forever,Upgrade systems without losing a single file,Provide transparent pricing with no hidden costs,Deliver exceptional customer service always").split(",");

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
              {s.about_hero_badge || "About Us"}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-hero-foreground mb-6">
              {s.about_hero_title1 || "Your Trusted"}{" "}
              <span className="gradient-text">{s.about_hero_highlight || "Tech Partner"}</span>
            </h1>
            <p className="text-base md:text-lg text-hero-foreground/70 max-w-2xl mx-auto px-4">
              {s.about_hero_desc || "Krishna Tech Solutions has been providing reliable tech services since 2019. We're passionate about solving technology problems."}
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <span className="text-primary font-medium text-sm md:text-base">{s.about_story_badge || "Our Story"}</span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4 md:mb-6">
                {s.about_story_title || "From Passion to Profession"}
              </h2>
              <div className="space-y-3 md:space-y-4 text-muted-foreground text-sm md:text-base">
                <p>{s.about_story_p1 || "Krishna Tech Solutions was founded in 2019 with a simple mission: to provide honest, reliable, and affordable tech solutions to individuals and small businesses."}</p>
                <p>{s.about_story_p2 || "What started as a small data recovery service has grown into a comprehensive tech solutions provider. Our founder's passion for helping people recover their precious data led to the creation of this company."}</p>
                <p>{s.about_story_p3 || "Today, we serve over 10,000 satisfied customers and continue to expand our services to meet the evolving needs of our community."}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-6 mt-6 md:mt-8">
                {storyStats.map((stat, idx) => (
                  <div key={idx} className="p-3 md:p-4 rounded-lg md:rounded-xl bg-muted/50">
                    <p className="font-display text-xl md:text-2xl font-bold gradient-text">{stat.value}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12">
              <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
                {s.about_mission_title || "Our Mission"}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8">
                {s.about_mission_desc || "To provide accessible, affordable, and reliable tech solutions that empower our customers to make the most of their technology without the fear of data loss or system failures."}
              </p>
              <div className="space-y-3 md:space-y-4">
                {missionPoints.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm md:text-base">{item.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <span className="text-primary font-medium text-sm md:text-base">{s.about_values_badge || "Our Values"}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2">
              {s.about_values_title || "What Drives Us"}
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {values.map((value, idx) => (
              <div key={idx} className="bg-card rounded-xl md:rounded-2xl p-4 md:p-8 text-center card-shadow border border-border/50">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-3 md:mb-6">
                  <value.icon className="w-5 h-5 md:w-7 md:h-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm md:text-lg text-foreground mb-2 md:mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-xs md:text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <span className="text-primary font-medium text-sm md:text-base">{s.about_timeline_badge || "Our Journey"}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2">
              {s.about_timeline_title || "Key Milestones"}
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="flex gap-4 md:gap-8 mb-6 md:mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs md:text-sm">
                    {milestone.year}
                  </div>
                  {idx < milestones.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-primary to-transparent mt-3 md:mt-4" />
                  )}
                </div>
                <div className="pb-6 md:pb-8">
                  <h3 className="font-display font-bold text-base md:text-lg text-foreground">{milestone.title}</h3>
                  <p className="text-muted-foreground text-sm md:text-base">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 hero-section">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-hero-foreground mb-4 md:mb-6">
              {s.about_cta_title || "Ready to Work With Us?"}
            </h2>
            <p className="text-hero-foreground/70 mb-6 md:mb-10 text-sm md:text-base px-4">
              {s.about_cta_desc || "Let's solve your tech challenges together. Contact us today!"}
            </p>
            <Link to="/contact">
              <Button size="lg">
                {s.about_cta_btn || "Get in Touch"}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
