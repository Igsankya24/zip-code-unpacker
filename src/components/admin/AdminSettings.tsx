import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, ExternalLink, MessageCircle } from "lucide-react";

interface Settings {
  [key: string]: string;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<Settings>({});
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

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const settingsObj: Settings = {};
      data?.forEach((s) => {
        settingsObj[s.key] = s.value;
      });
      setSettings(settingsObj);
    }
    setLoading(false);
  };

  const updateSetting = async (key: string, value: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${key} updated successfully` });
      setSettings((prev) => ({ ...prev, [key]: value }));
    }
    setSaving(false);
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>

      {/* Maintenance Mode */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Site Status</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Maintenance Mode</p>
            <p className="text-sm text-muted-foreground">
              Enable to show maintenance page to visitors
            </p>
          </div>
          <Switch
            checked={settings.maintenance_mode === "true"}
            onCheckedChange={(checked) => updateSetting("maintenance_mode", checked.toString())}
          />
        </div>
      </div>

      {/* Chatbot Settings */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Chatbot Settings</h3>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Enable Chatbot</p>
            <p className="text-sm text-muted-foreground">
              Show chatbot widget to customers
            </p>
          </div>
          <Switch
            checked={settings.chatbot_enabled !== "false"}
            onCheckedChange={(checked) => updateSetting("chatbot_enabled", checked.toString())}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Show Booking Popup</p>
            <p className="text-sm text-muted-foreground">
              Show floating "Book Appointment" button
            </p>
          </div>
          <Switch
            checked={settings.booking_popup_enabled === "true"}
            onCheckedChange={(checked) => updateSetting("booking_popup_enabled", checked.toString())}
          />
        </div>
        
        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <label className="block text-sm font-medium mb-2">Welcome Message</label>
            <div className="flex gap-2">
              <Textarea
                value={settings.chatbot_welcome || ""}
                onChange={(e) => handleInputChange("chatbot_welcome", e.target.value)}
                placeholder="Hello! 👋 Welcome to Krishna Tech Solutions. How can I help you today?"
                rows={2}
              />
              <Button 
                onClick={() => updateSetting("chatbot_welcome", settings.chatbot_welcome || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Booking Popup Text</label>
            <div className="flex gap-2">
              <Input
                value={settings.booking_popup_text || ""}
                onChange={(e) => handleInputChange("booking_popup_text", e.target.value)}
                placeholder="Book Appointment"
              />
              <Button 
                onClick={() => updateSetting("booking_popup_text", settings.booking_popup_text || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Social Links</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">GitHub Link</label>
            <div className="flex gap-2">
              <Input
                value={settings.github_link || ""}
                onChange={(e) => handleInputChange("github_link", e.target.value)}
                placeholder="https://github.com/your-org"
              />
              <Button 
                onClick={() => updateSetting("github_link", settings.github_link || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
              {settings.github_link && (
                <Button variant="outline" asChild>
                  <a href={settings.github_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Twitter Link</label>
            <div className="flex gap-2">
              <Input
                value={settings.twitter_link || ""}
                onChange={(e) => handleInputChange("twitter_link", e.target.value)}
                placeholder="https://twitter.com/your-handle"
              />
              <Button 
                onClick={() => updateSetting("twitter_link", settings.twitter_link || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn Link</label>
            <div className="flex gap-2">
              <Input
                value={settings.linkedin_link || ""}
                onChange={(e) => handleInputChange("linkedin_link", e.target.value)}
                placeholder="https://linkedin.com/company/your-company"
              />
              <Button 
                onClick={() => updateSetting("linkedin_link", settings.linkedin_link || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Facebook Link</label>
            <div className="flex gap-2">
              <Input
                value={settings.facebook_link || ""}
                onChange={(e) => handleInputChange("facebook_link", e.target.value)}
                placeholder="https://facebook.com/your-page"
              />
              <Button 
                onClick={() => updateSetting("facebook_link", settings.facebook_link || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Primary Email</label>
            <div className="flex gap-2">
              <Input
                value={settings.contact_email || ""}
                onChange={(e) => handleInputChange("contact_email", e.target.value)}
                placeholder="info@company.com"
              />
              <Button 
                onClick={() => updateSetting("contact_email", settings.contact_email || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Secondary Email</label>
            <div className="flex gap-2">
              <Input
                value={settings.contact_email_2 || ""}
                onChange={(e) => handleInputChange("contact_email_2", e.target.value)}
                placeholder="support@company.com"
              />
              <Button 
                onClick={() => updateSetting("contact_email_2", settings.contact_email_2 || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Primary Phone</label>
            <div className="flex gap-2">
              <Input
                value={settings.contact_phone || ""}
                onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                placeholder="+91 12345 67890"
              />
              <Button 
                onClick={() => updateSetting("contact_phone", settings.contact_phone || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Secondary Phone</label>
            <div className="flex gap-2">
              <Input
                value={settings.contact_phone_2 || ""}
                onChange={(e) => handleInputChange("contact_phone_2", e.target.value)}
                placeholder="+91 98765 43210"
              />
              <Button 
                onClick={() => updateSetting("contact_phone_2", settings.contact_phone_2 || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <div className="flex gap-2">
              <Textarea
                value={settings.contact_address || ""}
                onChange={(e) => handleInputChange("contact_address", e.target.value)}
                placeholder="123 Tech Park, City, State, Country"
                rows={2}
              />
              <Button 
                onClick={() => updateSetting("contact_address", settings.contact_address || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Business Hours</label>
            <div className="flex gap-2">
              <Input
                value={settings.business_hours || ""}
                onChange={(e) => handleInputChange("business_hours", e.target.value)}
                placeholder="Mon-Sat: 9AM - 6PM"
              />
              <Button 
                onClick={() => updateSetting("business_hours", settings.business_hours || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Google Maps Embed URL</label>
            <div className="flex gap-2">
              <Input
                value={settings.google_maps_url || ""}
                onChange={(e) => handleInputChange("google_maps_url", e.target.value)}
                placeholder="https://www.google.com/maps/embed?..."
              />
              <Button 
                onClick={() => updateSetting("google_maps_url", settings.google_maps_url || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Company Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <div className="flex gap-2">
              <Input
                value={settings.company_name || ""}
                onChange={(e) => handleInputChange("company_name", e.target.value)}
                placeholder="Krishna Tech Solutions"
              />
              <Button 
                onClick={() => updateSetting("company_name", settings.company_name || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tagline</label>
            <div className="flex gap-2">
              <Input
                value={settings.company_tagline || ""}
                onChange={(e) => handleInputChange("company_tagline", e.target.value)}
                placeholder="Your trusted tech partner"
              />
              <Button 
                onClick={() => updateSetting("company_tagline", settings.company_tagline || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">About Description</label>
            <div className="flex gap-2">
              <Textarea
                value={settings.company_about || ""}
                onChange={(e) => handleInputChange("company_about", e.target.value)}
                placeholder="Brief description about your company..."
                rows={3}
              />
              <Button 
                onClick={() => updateSetting("company_about", settings.company_about || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
