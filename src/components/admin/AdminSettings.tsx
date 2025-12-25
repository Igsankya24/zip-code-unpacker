import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

      {/* Appointment Slot Settings */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Appointment Slots</h3>
        <p className="text-sm text-muted-foreground">Configure time slots for bookings. Only one appointment is allowed per slot.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Working Start Time</label>
            <div className="flex gap-2">
              <Select
                value={settings.working_start_time || "09:00"}
                onValueChange={(value) => updateSetting("working_start_time", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 13 }, (_, i) => i + 6).map((hour) => (
                    <SelectItem key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                      {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? "12:00 PM" : `${hour}:00 AM`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Working End Time</label>
            <div className="flex gap-2">
              <Select
                value={settings.working_end_time || "18:00"}
                onValueChange={(value) => updateSetting("working_end_time", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 13 }, (_, i) => i + 12).map((hour) => (
                    <SelectItem key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                      {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? "12:00 PM" : `${hour}:00 AM`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slot Duration</label>
            <div className="flex gap-2">
              <Select
                value={settings.slot_duration || "60"}
                onValueChange={(value) => updateSetting("slot_duration", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Session & Security Settings */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Session & Security</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">Auto Logout (Idle Timeout)</label>
          <p className="text-sm text-muted-foreground mb-3">
            Automatically log out users after being idle for this duration. Applies to all users (User, Admin, Super Admin).
          </p>
          <div className="flex gap-2 items-center">
            <Select
              value={settings.idle_timeout_minutes || "15"}
              onValueChange={(value) => updateSetting("idle_timeout_minutes", value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select timeout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">of inactivity</span>
          </div>
        </div>
      </div>

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


      {/* Social Links */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Social Links</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp Number</label>
            <div className="flex gap-2">
              <Input
                value={settings.whatsapp_number || ""}
                onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
                placeholder="+91 7026292525"
              />
              <Button 
                onClick={() => updateSetting("whatsapp_number", settings.whatsapp_number || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
              {settings.whatsapp_number && (
                <Button variant="outline" asChild>
                  <a href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
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

          <div>
            <label className="block text-sm font-medium mb-2">Copyright Text</label>
            <div className="flex gap-2">
              <Input
                value={settings.copyright_text || ""}
                onChange={(e) => handleInputChange("copyright_text", e.target.value)}
                placeholder="© 2024 Krishna Tech Solutions. All rights reserved."
              />
              <Button 
                onClick={() => updateSetting("copyright_text", settings.copyright_text || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Homepage Stats */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Homepage Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Stat 1 Value</label>
            <div className="flex gap-2">
              <Input
                value={settings.stat_1_value || ""}
                onChange={(e) => handleInputChange("stat_1_value", e.target.value)}
                placeholder="10K+"
              />
              <Button 
                onClick={() => updateSetting("stat_1_value", settings.stat_1_value || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Stat 1 Label</label>
            <div className="flex gap-2">
              <Input
                value={settings.stat_1_label || ""}
                onChange={(e) => handleInputChange("stat_1_label", e.target.value)}
                placeholder="Happy Customers"
              />
              <Button 
                onClick={() => updateSetting("stat_1_label", settings.stat_1_label || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stat 2 Value</label>
            <div className="flex gap-2">
              <Input
                value={settings.stat_2_value || ""}
                onChange={(e) => handleInputChange("stat_2_value", e.target.value)}
                placeholder="95%"
              />
              <Button 
                onClick={() => updateSetting("stat_2_value", settings.stat_2_value || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Stat 2 Label</label>
            <div className="flex gap-2">
              <Input
                value={settings.stat_2_label || ""}
                onChange={(e) => handleInputChange("stat_2_label", e.target.value)}
                placeholder="Recovery Rate"
              />
              <Button 
                onClick={() => updateSetting("stat_2_label", settings.stat_2_label || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stat 3 Value</label>
            <div className="flex gap-2">
              <Input
                value={settings.stat_3_value || ""}
                onChange={(e) => handleInputChange("stat_3_value", e.target.value)}
                placeholder="5+"
              />
              <Button 
                onClick={() => updateSetting("stat_3_value", settings.stat_3_value || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Stat 3 Label</label>
            <div className="flex gap-2">
              <Input
                value={settings.stat_3_label || ""}
                onChange={(e) => handleInputChange("stat_3_label", e.target.value)}
                placeholder="Years Experience"
              />
              <Button 
                onClick={() => updateSetting("stat_3_label", settings.stat_3_label || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stat 4 Value</label>
            <div className="flex gap-2">
              <Input
                value={settings.stat_4_value || ""}
                onChange={(e) => handleInputChange("stat_4_value", e.target.value)}
                placeholder="24/7"
              />
              <Button 
                onClick={() => updateSetting("stat_4_value", settings.stat_4_value || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Stat 4 Label</label>
            <div className="flex gap-2">
              <Input
                value={settings.stat_4_label || ""}
                onChange={(e) => handleInputChange("stat_4_label", e.target.value)}
                placeholder="Support Available"
              />
              <Button 
                onClick={() => updateSetting("stat_4_label", settings.stat_4_label || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Footer Content</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Footer Description</label>
            <div className="flex gap-2">
              <Textarea
                value={settings.footer_description || ""}
                onChange={(e) => handleInputChange("footer_description", e.target.value)}
                placeholder="Professional tech solutions for data recovery..."
                rows={2}
              />
              <Button 
                onClick={() => updateSetting("footer_description", settings.footer_description || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Privacy Policy URL</label>
            <div className="flex gap-2">
              <Input
                value={settings.privacy_policy_url || ""}
                onChange={(e) => handleInputChange("privacy_policy_url", e.target.value)}
                placeholder="/privacy-policy or https://..."
              />
              <Button 
                onClick={() => updateSetting("privacy_policy_url", settings.privacy_policy_url || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Terms of Service URL</label>
            <div className="flex gap-2">
              <Input
                value={settings.terms_of_service_url || ""}
                onChange={(e) => handleInputChange("terms_of_service_url", e.target.value)}
                placeholder="/terms-of-service or https://..."
              />
              <Button 
                onClick={() => updateSetting("terms_of_service_url", settings.terms_of_service_url || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Instagram Link</label>
            <div className="flex gap-2">
              <Input
                value={settings.instagram_link || ""}
                onChange={(e) => handleInputChange("instagram_link", e.target.value)}
                placeholder="https://instagram.com/your-page"
              />
              <Button 
                onClick={() => updateSetting("instagram_link", settings.instagram_link || "")}
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
