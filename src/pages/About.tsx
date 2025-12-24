import Layout from "@/components/layout/Layout";
import { Users, Target, Award, Clock } from "lucide-react";

const stats = [
  { label: "Years Experience", value: "10+", icon: Clock },
  { label: "Projects Completed", value: "500+", icon: Target },
  { label: "Happy Clients", value: "200+", icon: Users },
  { label: "Awards Won", value: "25+", icon: Award }
];

const team = [
  {
    name: "Krishna Sharma",
    role: "Founder & CEO",
    description: "Visionary leader with 15+ years in technology solutions."
  },
  {
    name: "Priya Patel",
    role: "CTO",
    description: "Expert in software architecture and emerging technologies."
  },
  {
    name: "Rahul Verma",
    role: "Lead Developer",
    description: "Full-stack developer specializing in scalable applications."
  },
  {
    name: "Anita Singh",
    role: "Project Manager",
    description: "Certified PMP with expertise in agile methodologies."
  }
];

const About = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About Krishna Tech Solutions
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empowering businesses with innovative technology solutions since 2014.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
                <p className="text-muted-foreground mb-4">
                  At Krishna Tech Solutions, we are dedicated to delivering cutting-edge technology 
                  solutions that empower businesses to thrive in the digital age. Our mission is to 
                  bridge the gap between complex technology and practical business applications.
                </p>
                <p className="text-muted-foreground">
                  We believe in building long-term partnerships with our clients, understanding their 
                  unique challenges, and providing tailored solutions that drive growth and efficiency.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border">
                <h3 className="text-2xl font-bold text-foreground mb-4">Our Values</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
                    <div>
                      <strong className="text-foreground">Innovation</strong>
                      <p className="text-muted-foreground text-sm">Constantly exploring new technologies and approaches.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
                    <div>
                      <strong className="text-foreground">Quality</strong>
                      <p className="text-muted-foreground text-sm">Delivering excellence in every project we undertake.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
                    <div>
                      <strong className="text-foreground">Integrity</strong>
                      <p className="text-muted-foreground text-sm">Maintaining transparency and honesty in all interactions.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div key={index} className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg transition-shadow">
                  <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{member.name}</h3>
                  <p className="text-primary text-sm mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default About;
