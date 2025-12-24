import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Monitor, Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, Github } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Settings {
  [key: string]: string;
}

const Footer = () => {
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const settingsObj: Settings = {};
      data.forEach((s) => {
        settingsObj[s.key] = s.value;
      });
      setSettings(settingsObj);
    }
  };

  const socialLinks = [
    { icon: Facebook, url: settings.facebook_link, name: "Facebook" },
    { icon: Twitter, url: settings.twitter_link, name: "Twitter" },
    { icon: Instagram, url: "", name: "Instagram" },
    { icon: Linkedin, url: settings.linkedin_link, name: "LinkedIn" },
    { icon: Github, url: settings.github_link, name: "GitHub" },
  ].filter(link => link.url);

  return (
    <footer className="bg-hero text-hero-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Monitor className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg leading-tight">Krishna Tech</span>
                <span className="text-xs text-hero-foreground/60 -mt-0.5">Solutions</span>
              </div>
            </div>
            <p className="text-hero-foreground/70 text-sm leading-relaxed">
              Professional tech solutions for data recovery, Windows services, and computer repairs. Your trusted IT
              partner.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: "Home", path: "/" },
                { name: "Services", path: "/services" },
                { name: "About Us", path: "/about" },
                { name: "Contact", path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-hero-foreground/70 hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Our Services</h4>
            <ul className="space-y-3">
              {["Data Recovery", "Windows Upgrade", "Password Recovery", "Computer Repair", "Virus Removal"].map(
                (service) => (
                  <li key={service}>
                    <span className="text-hero-foreground/70">{service}</span>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-hero-foreground/70">
                  {settings.company_phone || "+91 7026292525"}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-hero-foreground/70">
                  {settings.company_email || "info@krishnatechsolutions.com"}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-hero-foreground/70">
                  {settings.company_address || "Belgaum, Karnataka - 590014"}
                </span>
              </li>
            </ul>

            <div className="flex gap-4 mt-6">
              {socialLinks.length > 0 ? (
                socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-hero-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    aria-label={social.name}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))
              ) : (
                [Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-10 h-10 rounded-lg bg-hero-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-hero-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-hero-foreground/60 text-sm">© 2024 Krishna Tech Solutions. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
