import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Save, Globe, Palette, Phone, Mail, MapPin, Clock, Type, Home, Info, FileText, Navigation, LayoutGrid, Upload, Image, Loader2 } from "lucide-react";

const AdminCustomization = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
      setSettings(settingsMap);
    }
    setLoading(false);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveAllSettings = async () => {
    setSaving(true);
    const upsertData = Object.entries(settings).map(([key, value]) => ({ key, value }));
    for (const item of upsertData) {
      await supabase.from("site_settings").upsert({ key: item.key, value: item.value }, { onConflict: "key" });
    }
    toast({ title: "Success", description: "All settings saved successfully" });
    setSaving(false);
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/x-icon", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, JPG, ICO, SVG, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingFavicon(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("site-icons")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("site-icons")
        .getPublicUrl(fileName);

      updateSetting("favicon_url", publicUrl.publicUrl);
      toast({ title: "Success", description: "Favicon uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload favicon",
        variant: "destructive",
      });
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) {
        faviconInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Website Customization</h2>
          <p className="text-muted-foreground">Customize your website appearance and content</p>
        </div>
        <Button onClick={saveAllSettings} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      <Tabs defaultValue="homepage" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="homepage"><Home className="w-4 h-4 mr-1" />Home</TabsTrigger>
          <TabsTrigger value="about"><Info className="w-4 h-4 mr-1" />About</TabsTrigger>
          <TabsTrigger value="contact"><Phone className="w-4 h-4 mr-1" />Contact</TabsTrigger>
          <TabsTrigger value="navbar"><Navigation className="w-4 h-4 mr-1" />Navbar</TabsTrigger>
          <TabsTrigger value="footer"><LayoutGrid className="w-4 h-4 mr-1" />Footer</TabsTrigger>
          <TabsTrigger value="general"><Globe className="w-4 h-4 mr-1" />General</TabsTrigger>
        </TabsList>

        {/* Homepage Sections */}
        <TabsContent value="homepage" className="space-y-4">
          <Accordion type="multiple" defaultValue={["hero", "stats", "services", "whyus", "cta"]} className="space-y-4">
            {/* Hero Section */}
            <AccordionItem value="hero" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Hero Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Hero Badge Text</Label>
                  <Input
                    value={settings.hero_badge || "Trusted Tech Solutions Since 2022"}
                    onChange={(e) => updateSetting("hero_badge", e.target.value)}
                    placeholder="Trusted Tech Solutions Since 2022"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title (Line 1)</Label>
                  <Input
                    value={settings.hero_title_1 || "Your Data is"}
                    onChange={(e) => updateSetting("hero_title_1", e.target.value)}
                    placeholder="Your Data is"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title (Highlighted Text)</Label>
                  <Input
                    value={settings.hero_title_highlight || "Precious"}
                    onChange={(e) => updateSetting("hero_title_highlight", e.target.value)}
                    placeholder="Precious"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title (Line 2)</Label>
                  <Input
                    value={settings.hero_title_2 || "We Recover It"}
                    onChange={(e) => updateSetting("hero_title_2", e.target.value)}
                    placeholder="We Recover It"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Description</Label>
                  <Textarea
                    value={settings.hero_description || "Professional data recovery, Windows services, and computer repairs. Expert solutions with no data loss guarantee."}
                    onChange={(e) => updateSetting("hero_description", e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Button Text</Label>
                    <Input
                      value={settings.hero_btn1_text || "Get Free Consultation"}
                      onChange={(e) => updateSetting("hero_btn1_text", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Button Link</Label>
                    <Input
                      value={settings.hero_btn1_link || "/contact"}
                      onChange={(e) => updateSetting("hero_btn1_link", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Button Text</Label>
                    <Input
                      value={settings.hero_btn2_text || "View Services"}
                      onChange={(e) => updateSetting("hero_btn2_text", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Button Link</Label>
                    <Input
                      value={settings.hero_btn2_link || "/services"}
                      onChange={(e) => updateSetting("hero_btn2_link", e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Stats Section */}
            <AccordionItem value="stats" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Statistics Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Stat 1 Value</Label>
                    <Input value={settings.stat_1_value || "10K+"} onChange={(e) => updateSetting("stat_1_value", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stat 1 Label</Label>
                    <Input value={settings.stat_1_label || "Happy Customers"} onChange={(e) => updateSetting("stat_1_label", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stat 2 Value</Label>
                    <Input value={settings.stat_2_value || "95%"} onChange={(e) => updateSetting("stat_2_value", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stat 2 Label</Label>
                    <Input value={settings.stat_2_label || "Recovery Rate"} onChange={(e) => updateSetting("stat_2_label", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stat 3 Value</Label>
                    <Input value={settings.stat_3_value || "5+"} onChange={(e) => updateSetting("stat_3_value", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stat 3 Label</Label>
                    <Input value={settings.stat_3_label || "Years Experience"} onChange={(e) => updateSetting("stat_3_label", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stat 4 Value</Label>
                    <Input value={settings.stat_4_value || "24/7"} onChange={(e) => updateSetting("stat_4_value", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stat 4 Label</Label>
                    <Input value={settings.stat_4_label || "Support Available"} onChange={(e) => updateSetting("stat_4_label", e.target.value)} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Services Section */}
            <AccordionItem value="services" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Services Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Section Badge</Label>
                  <Input value={settings.home_services_badge || "Our Services"} onChange={(e) => updateSetting("home_services_badge", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={settings.home_services_title || "What We Offer"} onChange={(e) => updateSetting("home_services_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Section Description</Label>
                  <Textarea
                    value={settings.home_services_desc || "Comprehensive tech solutions for all your computer needs. From data recovery to system upgrades, we've got you covered."}
                    onChange={(e) => updateSetting("home_services_desc", e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>View All Button Text</Label>
                  <Input value={settings.home_services_btn || "View All Services"} onChange={(e) => updateSetting("home_services_btn", e.target.value)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Why Choose Us Section */}
            <AccordionItem value="whyus" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Why Choose Us Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Section Badge</Label>
                  <Input value={settings.whyus_badge || "Why Choose Us"} onChange={(e) => updateSetting("whyus_badge", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={settings.whyus_title || "Trusted by Thousands of Customers"} onChange={(e) => updateSetting("whyus_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Section Description</Label>
                  <Textarea
                    value={settings.whyus_description || "At Krishna Tech Solutions, we combine expertise with cutting-edge technology to deliver exceptional results. Your satisfaction is our mission."}
                    onChange={(e) => updateSetting("whyus_description", e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Feature 1</Label>
                    <Input value={settings.whyus_feature1_title || "100% Data Safety"} onChange={(e) => updateSetting("whyus_feature1_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.whyus_feature1_desc || "Your data security is our top priority. We follow strict protocols."} onChange={(e) => updateSetting("whyus_feature1_desc", e.target.value)} placeholder="Description" />
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Feature 2</Label>
                    <Input value={settings.whyus_feature2_title || "Fast Turnaround"} onChange={(e) => updateSetting("whyus_feature2_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.whyus_feature2_desc || "Most services completed within 24-48 hours."} onChange={(e) => updateSetting("whyus_feature2_desc", e.target.value)} placeholder="Description" />
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Feature 3</Label>
                    <Input value={settings.whyus_feature3_title || "Expert Technicians"} onChange={(e) => updateSetting("whyus_feature3_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.whyus_feature3_desc || "Certified professionals with years of experience."} onChange={(e) => updateSetting("whyus_feature3_desc", e.target.value)} placeholder="Description" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Quick Contact Title</Label>
                  <Input value={settings.whyus_contact_title || "Quick Contact"} onChange={(e) => updateSetting("whyus_contact_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Working Hours Text</Label>
                  <Input value={settings.whyus_working_hours || "Mon-Sat: 9AM - 8PM"} onChange={(e) => updateSetting("whyus_working_hours", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Book Appointment Button Text</Label>
                  <Input value={settings.whyus_btn_text || "Book Appointment"} onChange={(e) => updateSetting("whyus_btn_text", e.target.value)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* CTA Section */}
            <AccordionItem value="cta" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">CTA Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>CTA Title (Line 1)</Label>
                  <Input value={settings.cta_title_1 || "Lost Your Data?"} onChange={(e) => updateSetting("cta_title_1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Title (Highlighted)</Label>
                  <Input value={settings.cta_title_highlight || "We Can Help!"} onChange={(e) => updateSetting("cta_title_highlight", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Description</Label>
                  <Textarea
                    value={settings.cta_description || "Don't panic! Contact us immediately for a free consultation. Our experts are ready to recover your valuable data."}
                    onChange={(e) => updateSetting("cta_description", e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>CTA Button Text</Label>
                    <Input value={settings.cta_btn_text || "Contact Us Now"} onChange={(e) => updateSetting("cta_btn_text", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Button Link</Label>
                    <Input value={settings.cta_btn_link || "/contact"} onChange={(e) => updateSetting("cta_btn_link", e.target.value)} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* About Page Sections */}
        <TabsContent value="about" className="space-y-4">
          <Accordion type="multiple" defaultValue={["about-hero", "about-story", "about-values", "about-timeline", "about-cta"]} className="space-y-4">
            {/* About Hero */}
            <AccordionItem value="about-hero" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Hero Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Badge Text</Label>
                  <Input value={settings.about_hero_badge || "About Us"} onChange={(e) => updateSetting("about_hero_badge", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Title (Line 1)</Label>
                  <Input value={settings.about_hero_title1 || "Your Trusted"} onChange={(e) => updateSetting("about_hero_title1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Title (Highlighted)</Label>
                  <Input value={settings.about_hero_highlight || "Tech Partner"} onChange={(e) => updateSetting("about_hero_highlight", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={settings.about_hero_desc || "Krishna Tech Solutions has been providing reliable tech services since 2022. We're passionate about solving technology problems."}
                    onChange={(e) => updateSetting("about_hero_desc", e.target.value)}
                    rows={2}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Our Story */}
            <AccordionItem value="about-story" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Our Story Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Section Badge</Label>
                  <Input value={settings.about_story_badge || "Our Story"} onChange={(e) => updateSetting("about_story_badge", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={settings.about_story_title || "From Passion to Profession"} onChange={(e) => updateSetting("about_story_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Story Paragraph 1</Label>
                  <Textarea value={settings.about_story_p1 || "Krishna Tech Solutions was founded in 2019 with a simple mission: to provide honest, reliable, and affordable tech solutions to individuals and small businesses."} onChange={(e) => updateSetting("about_story_p1", e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Story Paragraph 2</Label>
                  <Textarea value={settings.about_story_p2 || "What started as a small data recovery service has grown into a comprehensive tech solutions provider. Our founder's passion for helping people recover their precious data led to the creation of this company."} onChange={(e) => updateSetting("about_story_p2", e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Story Paragraph 3</Label>
                  <Textarea value={settings.about_story_p3 || "Today, we serve over 10,000 satisfied customers and continue to expand our services to meet the evolving needs of our community."} onChange={(e) => updateSetting("about_story_p3", e.target.value)} rows={2} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Story Stat 1 Value</Label>
                    <Input value={settings.about_stat1_value || "10K+"} onChange={(e) => updateSetting("about_stat1_value", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Story Stat 1 Label</Label>
                    <Input value={settings.about_stat1_label || "Happy Customers"} onChange={(e) => updateSetting("about_stat1_label", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Story Stat 2 Value</Label>
                    <Input value={settings.about_stat2_value || "95%"} onChange={(e) => updateSetting("about_stat2_value", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Story Stat 2 Label</Label>
                    <Input value={settings.about_stat2_label || "Recovery Rate"} onChange={(e) => updateSetting("about_stat2_label", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Story Stat 3 Value</Label>
                    <Input value={settings.about_stat3_value || "5+"} onChange={(e) => updateSetting("about_stat3_value", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Story Stat 3 Label</Label>
                    <Input value={settings.about_stat3_label || "Years Experience"} onChange={(e) => updateSetting("about_stat3_label", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Story Stat 4 Value</Label>
                    <Input value={settings.about_stat4_value || "50+"} onChange={(e) => updateSetting("about_stat4_value", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Story Stat 4 Label</Label>
                    <Input value={settings.about_stat4_label || "Services Offered"} onChange={(e) => updateSetting("about_stat4_label", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mission Title</Label>
                  <Input value={settings.about_mission_title || "Our Mission"} onChange={(e) => updateSetting("about_mission_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Mission Description</Label>
                  <Textarea value={settings.about_mission_desc || "To provide accessible, affordable, and reliable tech solutions that empower our customers to make the most of their technology without the fear of data loss or system failures."} onChange={(e) => updateSetting("about_mission_desc", e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Mission Points (comma separated)</Label>
                  <Textarea value={settings.about_mission_points || "Recover data that others say is lost forever,Upgrade systems without losing a single file,Provide transparent pricing with no hidden costs,Deliver exceptional customer service always"} onChange={(e) => updateSetting("about_mission_points", e.target.value)} rows={3} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Values */}
            <AccordionItem value="about-values" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Values Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Section Badge</Label>
                  <Input value={settings.about_values_badge || "Our Values"} onChange={(e) => updateSetting("about_values_badge", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={settings.about_values_title || "What Drives Us"} onChange={(e) => updateSetting("about_values_title", e.target.value)} />
                </div>
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Value 1</Label>
                    <Input value={settings.about_value1_title || "Customer First"} onChange={(e) => updateSetting("about_value1_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.about_value1_desc || "Your satisfaction is our priority. We go above and beyond to exceed expectations."} onChange={(e) => updateSetting("about_value1_desc", e.target.value)} placeholder="Description" />
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Value 2</Label>
                    <Input value={settings.about_value2_title || "Excellence"} onChange={(e) => updateSetting("about_value2_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.about_value2_desc || "We maintain the highest standards in every service we provide."} onChange={(e) => updateSetting("about_value2_desc", e.target.value)} placeholder="Description" />
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Value 3</Label>
                    <Input value={settings.about_value3_title || "Expertise"} onChange={(e) => updateSetting("about_value3_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.about_value3_desc || "Our team consists of certified professionals with years of experience."} onChange={(e) => updateSetting("about_value3_desc", e.target.value)} placeholder="Description" />
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Value 4</Label>
                    <Input value={settings.about_value4_title || "Integrity"} onChange={(e) => updateSetting("about_value4_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.about_value4_desc || "We operate with complete transparency and honesty in all dealings."} onChange={(e) => updateSetting("about_value4_desc", e.target.value)} placeholder="Description" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Timeline */}
            <AccordionItem value="about-timeline" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Timeline Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Section Badge</Label>
                  <Input value={settings.about_timeline_badge || "Our Journey"} onChange={(e) => updateSetting("about_timeline_badge", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={settings.about_timeline_title || "Key Milestones"} onChange={(e) => updateSetting("about_timeline_title", e.target.value)} />
                </div>
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Milestone 1</Label>
                    <Input value={settings.about_milestone1_year || "2019"} onChange={(e) => updateSetting("about_milestone1_year", e.target.value)} placeholder="Year" />
                    <Input value={settings.about_milestone1_title || "Founded"} onChange={(e) => updateSetting("about_milestone1_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.about_milestone1_desc || "Started our journey in tech solutions"} onChange={(e) => updateSetting("about_milestone1_desc", e.target.value)} placeholder="Description" />
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Milestone 2</Label>
                    <Input value={settings.about_milestone2_year || "2020"} onChange={(e) => updateSetting("about_milestone2_year", e.target.value)} placeholder="Year" />
                    <Input value={settings.about_milestone2_title || "1000+ Customers"} onChange={(e) => updateSetting("about_milestone2_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.about_milestone2_desc || "Reached our first major milestone"} onChange={(e) => updateSetting("about_milestone2_desc", e.target.value)} placeholder="Description" />
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Milestone 3</Label>
                    <Input value={settings.about_milestone3_year || "2022"} onChange={(e) => updateSetting("about_milestone3_year", e.target.value)} placeholder="Year" />
                    <Input value={settings.about_milestone3_title || "Expanded Services"} onChange={(e) => updateSetting("about_milestone3_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.about_milestone3_desc || "Added new service categories"} onChange={(e) => updateSetting("about_milestone3_desc", e.target.value)} placeholder="Description" />
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label className="font-semibold">Milestone 4</Label>
                    <Input value={settings.about_milestone4_year || "2024"} onChange={(e) => updateSetting("about_milestone4_year", e.target.value)} placeholder="Year" />
                    <Input value={settings.about_milestone4_title || "10000+ Customers"} onChange={(e) => updateSetting("about_milestone4_title", e.target.value)} placeholder="Title" />
                    <Input value={settings.about_milestone4_desc || "Trusted by thousands"} onChange={(e) => updateSetting("about_milestone4_desc", e.target.value)} placeholder="Description" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* About CTA */}
            <AccordionItem value="about-cta" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">CTA Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>CTA Title</Label>
                  <Input value={settings.about_cta_title || "Ready to Work With Us?"} onChange={(e) => updateSetting("about_cta_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Description</Label>
                  <Input value={settings.about_cta_desc || "Let's solve your tech challenges together. Contact us today!"} onChange={(e) => updateSetting("about_cta_desc", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input value={settings.about_cta_btn || "Get in Touch"} onChange={(e) => updateSetting("about_cta_btn", e.target.value)} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* Contact Page */}
        <TabsContent value="contact" className="space-y-4">
          <Accordion type="multiple" defaultValue={["contact-hero", "contact-info", "contact-form", "contact-cta"]} className="space-y-4">
            {/* Contact Hero */}
            <AccordionItem value="contact-hero" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Hero Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Badge Text</Label>
                  <Input value={settings.contact_hero_badge || "Contact Us"} onChange={(e) => updateSetting("contact_hero_badge", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Title (Line 1)</Label>
                  <Input value={settings.contact_hero_title1 || "Get in"} onChange={(e) => updateSetting("contact_hero_title1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Title (Highlighted)</Label>
                  <Input value={settings.contact_hero_highlight || "Touch"} onChange={(e) => updateSetting("contact_hero_highlight", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={settings.contact_hero_desc || "Have a question or need our services? We're here to help! Reach out to us and we'll respond within 24 hours."}
                    onChange={(e) => updateSetting("contact_hero_desc", e.target.value)}
                    rows={2}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Contact Info */}
            <AccordionItem value="contact-info" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Contact Information</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label><Phone className="w-4 h-4 inline mr-2" />Primary Phone</Label>
                    <Input value={settings.contact_phone || ""} onChange={(e) => updateSetting("contact_phone", e.target.value)} placeholder="+91 7026292525" />
                  </div>
                  <div className="space-y-2">
                    <Label><Phone className="w-4 h-4 inline mr-2" />Secondary Phone</Label>
                    <Input value={settings.contact_phone_2 || ""} onChange={(e) => updateSetting("contact_phone_2", e.target.value)} placeholder="+91 9876543210" />
                  </div>
                  <div className="space-y-2">
                    <Label><Mail className="w-4 h-4 inline mr-2" />Primary Email</Label>
                    <Input value={settings.contact_email || ""} onChange={(e) => updateSetting("contact_email", e.target.value)} placeholder="info@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label><Mail className="w-4 h-4 inline mr-2" />Secondary Email</Label>
                    <Input value={settings.contact_email_2 || ""} onChange={(e) => updateSetting("contact_email_2", e.target.value)} placeholder="support@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label><MapPin className="w-4 h-4 inline mr-2" />Address</Label>
                  <Textarea value={settings.contact_address || ""} onChange={(e) => updateSetting("contact_address", e.target.value)} placeholder="Your business address" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label><Clock className="w-4 h-4 inline mr-2" />Business Hours</Label>
                  <Input value={settings.business_hours || ""} onChange={(e) => updateSetting("business_hours", e.target.value)} placeholder="Monday - Saturday, 9:00 AM - 8:00 PM" />
                </div>
                <div className="space-y-2">
                  <Label>Google Maps Embed URL</Label>
                  <Input value={settings.google_maps_url || ""} onChange={(e) => updateSetting("google_maps_url", e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Contact Form */}
            <AccordionItem value="contact-form" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">Contact Form</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Form Title</Label>
                  <Input value={settings.contact_form_title || "Send a Message"} onChange={(e) => updateSetting("contact_form_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Form Subtitle</Label>
                  <Input value={settings.contact_form_subtitle || "Fill out the form and we'll get back to you"} onChange={(e) => updateSetting("contact_form_subtitle", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Submit Button Text</Label>
                  <Input value={settings.contact_form_btn || "Send Message"} onChange={(e) => updateSetting("contact_form_btn", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Info Title</Label>
                  <Input value={settings.contact_info_title || "Contact Information"} onChange={(e) => updateSetting("contact_info_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Info Subtitle</Label>
                  <Input value={settings.contact_info_subtitle || "Reach out to us through any of these channels. We're always happy to help!"} onChange={(e) => updateSetting("contact_info_subtitle", e.target.value)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Contact CTA */}
            <AccordionItem value="contact-cta" className="border rounded-lg px-4">
              <AccordionTrigger className="text-lg font-semibold">CTA Section</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>CTA Title</Label>
                  <Input value={settings.contact_cta_title || "Need Immediate Assistance?"} onChange={(e) => updateSetting("contact_cta_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Subtitle</Label>
                  <Input value={settings.contact_cta_subtitle || "Call us directly for urgent tech support."} onChange={(e) => updateSetting("contact_cta_subtitle", e.target.value)} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input value={settings.facebook_link || ""} onChange={(e) => updateSetting("facebook_link", e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input value={settings.instagram_link || ""} onChange={(e) => updateSetting("instagram_link", e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Twitter/X</Label>
                <Input value={settings.twitter_link || ""} onChange={(e) => updateSetting("twitter_link", e.target.value)} placeholder="https://twitter.com/..." />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input value={settings.linkedin_link || ""} onChange={(e) => updateSetting("linkedin_link", e.target.value)} placeholder="https://linkedin.com/..." />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input value={settings.bot_whatsapp_number || ""} onChange={(e) => updateSetting("bot_whatsapp_number", e.target.value)} placeholder="+91 7026292525" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navbar */}
        <TabsContent value="navbar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Navbar Settings</CardTitle>
              <CardDescription>Customize the navigation bar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={settings.navbar_company_name || "Krishna Tech"} onChange={(e) => updateSetting("navbar_company_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company Tagline</Label>
                  <Input value={settings.navbar_company_tagline || "Solutions"} onChange={(e) => updateSetting("navbar_company_tagline", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input value={settings.navbar_cta_text || "Get Support"} onChange={(e) => updateSetting("navbar_cta_text", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button Link</Label>
                  <Input value={settings.navbar_cta_link || "/contact"} onChange={(e) => updateSetting("navbar_cta_link", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Theme Toggle</Label>
                  <p className="text-sm text-muted-foreground">Display dark/light mode toggle</p>
                </div>
                <Switch
                  checked={settings.navbar_show_theme !== "false"}
                  onCheckedChange={(checked) => updateSetting("navbar_show_theme", checked ? "true" : "false")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer */}
        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Footer Settings</CardTitle>
              <CardDescription>Customize the footer content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={settings.company_name || "Krishna Tech"} onChange={(e) => updateSetting("company_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company Tagline</Label>
                  <Input value={settings.company_tagline || "Solutions"} onChange={(e) => updateSetting("company_tagline", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Footer Description</Label>
                <Textarea value={settings.footer_description || "Professional tech solutions for data recovery, Windows services, and computer repairs. Your trusted IT partner."} onChange={(e) => updateSetting("footer_description", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Copyright Text</Label>
                <Input value={settings.copyright_text || ""} onChange={(e) => updateSetting("copyright_text", e.target.value)} placeholder="© 2024 Company Name. All rights reserved." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Privacy Policy URL</Label>
                  <Input value={settings.privacy_policy_url || ""} onChange={(e) => updateSetting("privacy_policy_url", e.target.value)} placeholder="/privacy" />
                </div>
                <div className="space-y-2">
                  <Label>Terms of Service URL</Label>
                  <Input value={settings.terms_of_service_url || ""} onChange={(e) => updateSetting("terms_of_service_url", e.target.value)} placeholder="/terms" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          {/* Website Title & Icon Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Website Title & Icon
              </CardTitle>
              <CardDescription>Configure the browser tab title and favicon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Website Title</Label>
                <Input
                  value={settings.site_title || "Krishna Tech Solutions"}
                  onChange={(e) => updateSetting("site_title", e.target.value)}
                  placeholder="Enter website title"
                />
                <p className="text-xs text-muted-foreground">This appears in the browser tab and search results</p>
              </div>
              
              <div className="space-y-3">
                <Label>Favicon (Site Icon)</Label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                    {settings.favicon_url ? (
                      <img
                        src={settings.favicon_url}
                        alt="Current favicon"
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Image className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => faviconInputRef.current?.click()}
                        disabled={uploadingFavicon}
                      >
                        {uploadingFavicon ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/x-icon,image/svg+xml,image/webp"
                        onChange={handleFaviconUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended: 32x32 or 64x64 pixels. Supports PNG, JPG, ICO, SVG, WebP (max 2MB)
                    </p>
                    <div className="space-y-1">
                      <Label className="text-xs">Or enter URL directly</Label>
                      <Input
                        value={settings.favicon_url || ""}
                        onChange={(e) => updateSetting("favicon_url", e.target.value)}
                        placeholder="https://example.com/favicon.ico"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                SEO Settings
              </CardTitle>
              <CardDescription>Configure search engine optimization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Site Name (SEO)</Label>
                  <Input value={settings.site_name || "Krishna Tech Solutions"} onChange={(e) => updateSetting("site_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Site Tagline (SEO)</Label>
                  <Input value={settings.site_tagline || ""} onChange={(e) => updateSetting("site_tagline", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Site Description (SEO)</Label>
                <Textarea value={settings.site_description || ""} onChange={(e) => updateSetting("site_description", e.target.value)} placeholder="Brief description for search engines" rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input value={settings.logo_url || ""} onChange={(e) => updateSetting("logo_url", e.target.value)} placeholder="https://example.com/logo.png" />
                </div>
                <div className="space-y-2">
                  <Label>Auth Page Logo URL</Label>
                  <Input value={settings.auth_logo_url || ""} onChange={(e) => updateSetting("auth_logo_url", e.target.value)} placeholder="https://example.com/logo.png" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>GST Number (for Invoices)</Label>
                <Input value={settings.gst_number || ""} onChange={(e) => updateSetting("gst_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Currency Symbol</Label>
                <Input value={settings.currency_symbol || "₹"} onChange={(e) => updateSetting("currency_symbol", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custom CSS</Label>
                <Textarea value={settings.custom_css || ""} onChange={(e) => updateSetting("custom_css", e.target.value)} placeholder="/* Add custom CSS here */" rows={4} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Head Scripts (Analytics, etc.)</Label>
                <Textarea value={settings.head_scripts || ""} onChange={(e) => updateSetting("head_scripts", e.target.value)} placeholder="<!-- Google Analytics, etc. -->" rows={4} className="font-mono text-sm" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCustomization;
