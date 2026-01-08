import { useState, useEffect } from "react";
import { CreditCard, Key, Eye, EyeOff, Copy, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminPaymentGateway = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeyId, setShowKeyId] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    razorpay_enabled: "false",
    razorpay_key_id: "",
    razorpay_test_mode: "true",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["razorpay_enabled", "razorpay_key_id", "razorpay_test_mode"]);

    if (data) {
      const settingsObj: Record<string, string> = {};
      data.forEach((item) => {
        settingsObj[item.key] = item.value;
      });
      setSettings((prev) => ({ ...prev, ...settingsObj }));
    }
    setLoading(false);
  };

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save setting",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved",
        description: "Setting updated successfully",
      });
    }
    setSaving(false);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const maskValue = (value: string) => {
    if (!value || value.length < 8) return "••••••••";
    return value.slice(0, 4) + "••••" + value.slice(-4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Payment Gateway
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure Razorpay for accepting UPI, debit card, and credit card payments
        </p>
      </div>

      {/* Razorpay Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Razorpay</CardTitle>
                <CardDescription>
                  Accept payments via UPI, Debit Cards, Credit Cards, Net Banking & more
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="razorpay-enabled" className="text-sm text-muted-foreground">
                {settings.razorpay_enabled === "true" ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                id="razorpay-enabled"
                checked={settings.razorpay_enabled === "true"}
                onCheckedChange={(checked) => {
                  const value = checked ? "true" : "false";
                  setSettings((prev) => ({ ...prev, razorpay_enabled: value }));
                  saveSetting("razorpay_enabled", value);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Test Mode</p>
              <p className="text-sm text-muted-foreground">
                Use test credentials for development (no real payments)
              </p>
            </div>
            <Switch
              checked={settings.razorpay_test_mode === "true"}
              onCheckedChange={(checked) => {
                const value = checked ? "true" : "false";
                setSettings((prev) => ({ ...prev, razorpay_test_mode: value }));
                saveSetting("razorpay_test_mode", value);
              }}
            />
          </div>

          {/* Key ID */}
          <div className="space-y-2">
            <Label htmlFor="razorpay-key-id" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Razorpay Key ID (Publishable)
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="razorpay-key-id"
                  type={showKeyId ? "text" : "password"}
                  value={settings.razorpay_key_id}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, razorpay_key_id: e.target.value }))
                  }
                  placeholder="rzp_test_xxxxxxxxxxxx"
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowKeyId(!showKeyId)}
                  >
                    {showKeyId ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  {settings.razorpay_key_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(settings.razorpay_key_id, "Key ID")}
                    >
                      {copied === "Key ID" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <Button
                onClick={() => saveSetting("razorpay_key_id", settings.razorpay_key_id)}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This is your public key that can be safely used in frontend code
            </p>
          </div>

          {/* Secret Key Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Secret Key Required</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                The Razorpay Secret Key is a sensitive credential and should be stored securely.
                Please add it as a secret in Lovable Cloud settings.
              </p>
              <p className="text-sm font-medium">
                Secret name to use: <code className="bg-muted px-2 py-1 rounded">RAZORPAY_KEY_SECRET</code>
              </p>
            </AlertDescription>
          </Alert>

          {/* How to get keys */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <h4 className="font-medium text-foreground">How to get your Razorpay API Keys:</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Log in to your Razorpay Dashboard</li>
              <li>Go to Settings → API Keys</li>
              <li>Generate a new key pair (or use existing ones)</li>
              <li>Copy the Key ID and paste it above</li>
              <li>Store the Key Secret in Lovable Cloud secrets</li>
            </ol>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://dashboard.razorpay.com/app/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Razorpay Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Supported Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supported Payment Methods</CardTitle>
          <CardDescription>
            Once configured, your customers can pay using these methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "UPI", icon: "📱" },
              { name: "Credit Card", icon: "💳" },
              { name: "Debit Card", icon: "💳" },
              { name: "Net Banking", icon: "🏦" },
              { name: "Wallets", icon: "👛" },
              { name: "EMI", icon: "📅" },
              { name: "Pay Later", icon: "⏰" },
              { name: "International", icon: "🌍" },
            ].map((method) => (
              <div
                key={method.name}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
              >
                <span className="text-xl">{method.icon}</span>
                <span className="text-sm font-medium text-foreground">{method.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentGateway;
