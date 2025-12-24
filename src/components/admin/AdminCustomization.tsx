import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Globe, Palette, Phone, Mail, MapPin, Clock, Image, Type, FileText, Plus, Trash2 } from "lucide-react";

interface SiteSetting {
  key: string;
  value: string;
}

const AdminCustomization = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");

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

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      toast({ title: "Error", description: "Failed to save setting", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${key} updated successfully` });
    }
    setSaving(false);
  };

  const saveAllSettings = async () => {
    setSaving(true);
    const upsertData = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
    }));

    for (const item of upsertData) {
      await supabase
        .from("site_settings")
        .upsert({ key: item.key, value: item.value }, { onConflict: "key" });
    }

    toast({ title: "Success", description: "All settings saved successfully" });
    setSaving(false);
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

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>Configure basic website information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Site Name</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name || "Krishna Tech Solutions"}
                    onChange={(e) => updateSetting("site_name", e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_tagline">Tagline</Label>
                  <Input
                    id="site_tagline"
                    value={settings.site_tagline || ""}
                    onChange={(e) => updateSetting("site_tagline", e.target.value)}
                    placeholder="Your catchy tagline"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_description">Site Description (SEO)</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description || ""}
                  onChange={(e) => updateSetting("site_description", e.target.value)}
                  placeholder="Brief description for search engines"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Show maintenance page to visitors</p>
                </div>
                <Switch
                  checked={settings.maintenance_mode === "true"}
                  onCheckedChange={(checked) => updateSetting("maintenance_mode", checked ? "true" : "false")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Branding & Colors
              </CardTitle>
              <CardDescription>Customize your brand appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={settings.logo_url || ""}
                    onChange={(e) => updateSetting("logo_url", e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon_url">Favicon URL</Label>
                  <Input
                    id="favicon_url"
                    value={settings.favicon_url || ""}
                    onChange={(e) => updateSetting("favicon_url", e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings.primary_color || "#6366f1"}
                      onChange={(e) => updateSetting("primary_color", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.primary_color || "#6366f1"}
                      onChange={(e) => updateSetting("primary_color", e.target.value)}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={settings.accent_color || "#8b5cf6"}
                      onChange={(e) => updateSetting("accent_color", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.accent_color || "#8b5cf6"}
                      onChange={(e) => updateSetting("accent_color", e.target.value)}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={settings.background_color || "#0a0a0a"}
                      onChange={(e) => updateSetting("background_color", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.background_color || "#0a0a0a"}
                      onChange={(e) => updateSetting("background_color", e.target.value)}
                      placeholder="#0a0a0a"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </CardTitle>
              <CardDescription>Update your business contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email || ""}
                    onChange={(e) => updateSetting("contact_email", e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="contact_phone"
                    value={settings.contact_phone || ""}
                    onChange={(e) => updateSetting("contact_phone", e.target.value)}
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_address">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Business Address
                </Label>
                <Textarea
                  id="contact_address"
                  value={settings.contact_address || ""}
                  onChange={(e) => updateSetting("contact_address", e.target.value)}
                  placeholder="123 Main Street, City, State, ZIP"
                  rows={2}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                  <Input
                    id="whatsapp_number"
                    value={settings.bot_whatsapp_number || ""}
                    onChange={(e) => updateSetting("bot_whatsapp_number", e.target.value)}
                    placeholder="+91 1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_hours">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Business Hours
                  </Label>
                  <Input
                    id="business_hours"
                    value={settings.business_hours || ""}
                    onChange={(e) => updateSetting("business_hours", e.target.value)}
                    placeholder="Mon-Sat: 9 AM - 8 PM"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Add your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="social_facebook">Facebook URL</Label>
                  <Input
                    id="social_facebook"
                    value={settings.social_facebook || ""}
                    onChange={(e) => updateSetting("social_facebook", e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_instagram">Instagram URL</Label>
                  <Input
                    id="social_instagram"
                    value={settings.social_instagram || ""}
                    onChange={(e) => updateSetting("social_instagram", e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_twitter">Twitter/X URL</Label>
                  <Input
                    id="social_twitter"
                    value={settings.social_twitter || ""}
                    onChange={(e) => updateSetting("social_twitter", e.target.value)}
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_linkedin">LinkedIn URL</Label>
                  <Input
                    id="social_linkedin"
                    value={settings.social_linkedin || ""}
                    onChange={(e) => updateSetting("social_linkedin", e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_youtube">YouTube URL</Label>
                  <Input
                    id="social_youtube"
                    value={settings.social_youtube || ""}
                    onChange={(e) => updateSetting("social_youtube", e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homepage */}
        <TabsContent value="homepage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Hero Section
              </CardTitle>
              <CardDescription>Customize the main hero section on homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero_title">Hero Title</Label>
                <Input
                  id="hero_title"
                  value={settings.hero_title || ""}
                  onChange={(e) => updateSetting("hero_title", e.target.value)}
                  placeholder="Your Amazing Headline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                <Textarea
                  id="hero_subtitle"
                  value={settings.hero_subtitle || ""}
                  onChange={(e) => updateSetting("hero_subtitle", e.target.value)}
                  placeholder="A compelling description of your services"
                  rows={2}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hero_button_text">Button Text</Label>
                  <Input
                    id="hero_button_text"
                    value={settings.hero_button_text || "Get Started"}
                    onChange={(e) => updateSetting("hero_button_text", e.target.value)}
                    placeholder="Get Started"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_button_link">Button Link</Label>
                  <Input
                    id="hero_button_link"
                    value={settings.hero_button_link || "/services"}
                    onChange={(e) => updateSetting("hero_button_link", e.target.value)}
                    placeholder="/services"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_image">Hero Background Image URL</Label>
                <Input
                  id="hero_image"
                  value={settings.hero_image || ""}
                  onChange={(e) => updateSetting("hero_image", e.target.value)}
                  placeholder="https://example.com/hero-bg.jpg"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                About Section
              </CardTitle>
              <CardDescription>Customize the about section on homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="about_title">Section Title</Label>
                <Input
                  id="about_title"
                  value={settings.about_title || "About Us"}
                  onChange={(e) => updateSetting("about_title", e.target.value)}
                  placeholder="About Us"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about_content">About Content</Label>
                <Textarea
                  id="about_content"
                  value={settings.about_content || ""}
                  onChange={(e) => updateSetting("about_content", e.target.value)}
                  placeholder="Tell your story..."
                  rows={5}
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
              <CardDescription>Customize the website footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footer_text">Footer Copyright Text</Label>
                <Input
                  id="footer_text"
                  value={settings.footer_text || "© 2024 Krishna Tech Solutions. All rights reserved."}
                  onChange={(e) => updateSetting("footer_text", e.target.value)}
                  placeholder="© 2024 Your Company. All rights reserved."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer_description">Footer Description</Label>
                <Textarea
                  id="footer_description"
                  value={settings.footer_description || ""}
                  onChange={(e) => updateSetting("footer_description", e.target.value)}
                  placeholder="A brief description about your company"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Newsletter Signup</Label>
                  <p className="text-sm text-muted-foreground">Display newsletter form in footer</p>
                </div>
                <Switch
                  checked={settings.show_newsletter === "true"}
                  onCheckedChange={(checked) => updateSetting("show_newsletter", checked ? "true" : "false")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCustomization;
