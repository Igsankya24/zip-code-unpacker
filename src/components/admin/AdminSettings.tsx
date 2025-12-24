import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, ExternalLink } from "lucide-react";

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

      {/* Company Info */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Company Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="flex gap-2">
              <Input
                value={settings.company_email || ""}
                onChange={(e) => handleInputChange("company_email", e.target.value)}
                placeholder="info@company.com"
              />
              <Button 
                onClick={() => updateSetting("company_email", settings.company_email || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <div className="flex gap-2">
              <Input
                value={settings.company_phone || ""}
                onChange={(e) => handleInputChange("company_phone", e.target.value)}
                placeholder="+91 12345 67890"
              />
              <Button 
                onClick={() => updateSetting("company_phone", settings.company_phone || "")}
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
                value={settings.company_address || ""}
                onChange={(e) => handleInputChange("company_address", e.target.value)}
                placeholder="123 Tech Park, City, State, Country"
                rows={2}
              />
              <Button 
                onClick={() => updateSetting("company_address", settings.company_address || "")}
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
