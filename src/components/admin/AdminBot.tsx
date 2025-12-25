import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, Bot, MessageCircle, Calendar, Clock } from "lucide-react";

interface Settings {
  [key: string]: string;
}

const AdminBot = () => {
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
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Bot Settings</h2>
      </div>

      {/* Chatbot Enable/Disable */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Chatbot Widget</h3>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Enable Chatbot</p>
            <p className="text-sm text-muted-foreground">
              Show chatbot widget to customers on all pages
            </p>
          </div>
          <Switch
            checked={settings.chatbot_enabled !== "false"}
            onCheckedChange={(checked) => updateSetting("chatbot_enabled", checked.toString())}
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
                rows={3}
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
            <label className="block text-sm font-medium mb-2">Bot Name</label>
            <div className="flex gap-2">
              <Input
                value={settings.chatbot_name || ""}
                onChange={(e) => handleInputChange("chatbot_name", e.target.value)}
                placeholder="Krishna Assistant"
              />
              <Button 
                onClick={() => updateSetting("chatbot_name", settings.chatbot_name || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bot Avatar URL (optional)</label>
            <div className="flex gap-2">
              <Input
                value={settings.chatbot_avatar || ""}
                onChange={(e) => handleInputChange("chatbot_avatar", e.target.value)}
                placeholder="https://example.com/bot-avatar.png"
              />
              <Button 
                onClick={() => updateSetting("chatbot_avatar", settings.chatbot_avatar || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Time Slot Settings */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Time Slot Settings</h3>
        </div>
        <p className="text-sm text-muted-foreground">Configure appointment time slots duration and working hours</p>
        
        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <label className="block text-sm font-medium mb-2">Slot Duration (minutes)</label>
            <p className="text-xs text-muted-foreground mb-2">Each appointment slot duration (e.g., 60 = 1 hour, 120 = 2 hours, 180 = 3 hours)</p>
            <div className="flex gap-2">
              <Input
                type="number"
                min="30"
                max="480"
                step="30"
                value={settings.slot_duration || "60"}
                onChange={(e) => handleInputChange("slot_duration", e.target.value)}
                placeholder="60"
              />
              <Button 
                onClick={() => updateSetting("slot_duration", settings.slot_duration || "60")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Working Start Time</label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={settings.working_start_time || "09:00"}
                onChange={(e) => handleInputChange("working_start_time", e.target.value)}
              />
              <Button 
                onClick={() => updateSetting("working_start_time", settings.working_start_time || "09:00")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Working End Time</label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={settings.working_end_time || "18:00"}
                onChange={(e) => handleInputChange("working_end_time", e.target.value)}
              />
              <Button 
                onClick={() => updateSetting("working_end_time", settings.working_end_time || "18:00")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Popup Settings */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Booking Popup</h3>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Show Booking Popup</p>
            <p className="text-sm text-muted-foreground">
              Show floating "Book Appointment" button on all pages
            </p>
          </div>
          <Switch
            checked={settings.booking_popup_enabled === "true"}
            onCheckedChange={(checked) => updateSetting("booking_popup_enabled", checked.toString())}
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <label className="block text-sm font-medium mb-2">Popup Button Text</label>
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

          <div>
            <label className="block text-sm font-medium mb-2">Popup Title</label>
            <div className="flex gap-2">
              <Input
                value={settings.booking_popup_title || ""}
                onChange={(e) => handleInputChange("booking_popup_title", e.target.value)}
                placeholder="Book Your Appointment"
              />
              <Button 
                onClick={() => updateSetting("booking_popup_title", settings.booking_popup_title || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Replies / Auto Responses */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Quick Responses</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Response for "Services"</label>
            <div className="flex gap-2">
              <Textarea
                value={settings.bot_response_services || ""}
                onChange={(e) => handleInputChange("bot_response_services", e.target.value)}
                placeholder="We offer various tech services including..."
                rows={2}
              />
              <Button 
                onClick={() => updateSetting("bot_response_services", settings.bot_response_services || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Response for "Contact"</label>
            <div className="flex gap-2">
              <Textarea
                value={settings.bot_response_contact || ""}
                onChange={(e) => handleInputChange("bot_response_contact", e.target.value)}
                placeholder="You can reach us at..."
                rows={2}
              />
              <Button 
                onClick={() => updateSetting("bot_response_contact", settings.bot_response_contact || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Response for "Hours"</label>
            <div className="flex gap-2">
              <Textarea
                value={settings.bot_response_hours || ""}
                onChange={(e) => handleInputChange("bot_response_hours", e.target.value)}
                placeholder="We are open from 9 AM to 8 PM..."
                rows={2}
              />
              <Button 
                onClick={() => updateSetting("bot_response_hours", settings.bot_response_hours || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Default Response (Fallback)</label>
            <div className="flex gap-2">
              <Textarea
                value={settings.bot_response_default || ""}
                onChange={(e) => handleInputChange("bot_response_default", e.target.value)}
                placeholder="Thank you for your message. Our team will get back to you soon!"
                rows={2}
              />
              <Button 
                onClick={() => updateSetting("bot_response_default", settings.bot_response_default || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Fallback */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">WhatsApp Fallback</h3>
        <p className="text-sm text-muted-foreground">When the bot cannot help, show WhatsApp contact option</p>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Enable WhatsApp Fallback</p>
            <p className="text-sm text-muted-foreground">
              Show "Contact on WhatsApp" when bot can't solve the issue
            </p>
          </div>
          <Switch
            checked={settings.bot_whatsapp_fallback === "true"}
            onCheckedChange={(checked) => updateSetting("bot_whatsapp_fallback", checked.toString())}
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp Number</label>
            <div className="flex gap-2">
              <Input
                value={settings.bot_whatsapp_number || ""}
                onChange={(e) => handleInputChange("bot_whatsapp_number", e.target.value)}
                placeholder="+91 7026292525"
              />
              <Button 
                onClick={() => updateSetting("bot_whatsapp_number", settings.bot_whatsapp_number || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp Message Template</label>
            <div className="flex gap-2">
              <Textarea
                value={settings.bot_whatsapp_message || ""}
                onChange={(e) => handleInputChange("bot_whatsapp_message", e.target.value)}
                placeholder="Hi! I need help with..."
                rows={2}
              />
              <Button 
                onClick={() => updateSetting("bot_whatsapp_message", settings.bot_whatsapp_message || "")}
                disabled={saving}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Show Services in Fallback</p>
              <p className="text-sm text-muted-foreground">
                Display available services when bot can't help
              </p>
            </div>
            <Switch
              checked={settings.bot_show_services_fallback === "true"}
              onCheckedChange={(checked) => updateSetting("bot_show_services_fallback", checked.toString())}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBot;