import { useState, useEffect } from "react";
import { CreditCard, Key, Eye, EyeOff, Copy, Check, AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  color: string;
  dashboardUrl: string;
  keyIdLabel: string;
  keyIdPlaceholder: string;
  secretKeyName: string;
  instructions: string[];
  paymentMethods: string[];
}

const paymentGateways: PaymentGateway[] = [
  {
    id: "razorpay",
    name: "Razorpay",
    description: "Most popular payment gateway in India with UPI, Cards, Net Banking & more",
    color: "bg-blue-500",
    dashboardUrl: "https://dashboard.razorpay.com/app/keys",
    keyIdLabel: "Razorpay Key ID",
    keyIdPlaceholder: "rzp_test_xxxxxxxxxxxx",
    secretKeyName: "RAZORPAY_KEY_SECRET",
    instructions: [
      "Log in to your Razorpay Dashboard",
      "Go to Settings → API Keys",
      "Generate a new key pair (or use existing ones)",
      "Copy the Key ID and paste it here",
      "Store the Key Secret in Lovable Cloud secrets",
    ],
    paymentMethods: ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallets", "EMI", "Pay Later"],
  },
  {
    id: "payu",
    name: "PayU",
    description: "Enterprise payment gateway with advanced fraud protection & analytics",
    color: "bg-green-600",
    dashboardUrl: "https://onboarding.payu.in/app/account/api-integration",
    keyIdLabel: "PayU Merchant Key",
    keyIdPlaceholder: "gtKFFx",
    secretKeyName: "PAYU_MERCHANT_SALT",
    instructions: [
      "Log in to your PayU Dashboard",
      "Go to Manage Account → API Integration",
      "Copy the Merchant Key and paste it here",
      "Store the Merchant Salt in Lovable Cloud secrets",
    ],
    paymentMethods: ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallets", "EMI"],
  },
  {
    id: "paytm",
    name: "Paytm Business",
    description: "India's largest digital payments platform with Paytm Wallet integration",
    color: "bg-sky-500",
    dashboardUrl: "https://business.paytm.com/",
    keyIdLabel: "Paytm Merchant ID",
    keyIdPlaceholder: "MERCHANT_ID_HERE",
    secretKeyName: "PAYTM_MERCHANT_KEY",
    instructions: [
      "Log in to Paytm Business Dashboard",
      "Go to Developer Settings → API Keys",
      "Copy the Merchant ID and paste it here",
      "Store the Merchant Key in Lovable Cloud secrets",
    ],
    paymentMethods: ["UPI", "Paytm Wallet", "Credit Card", "Debit Card", "Net Banking", "EMI"],
  },
  {
    id: "cashfree",
    name: "Cashfree",
    description: "Modern payment gateway with instant settlements & advanced APIs",
    color: "bg-purple-600",
    dashboardUrl: "https://merchant.cashfree.com/merchants/pg-dashboard",
    keyIdLabel: "Cashfree App ID",
    keyIdPlaceholder: "CF_APP_ID_HERE",
    secretKeyName: "CASHFREE_SECRET_KEY",
    instructions: [
      "Log in to Cashfree Merchant Dashboard",
      "Go to Payment Gateway → Credentials",
      "Copy the App ID and paste it here",
      "Store the Secret Key in Lovable Cloud secrets",
    ],
    paymentMethods: ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallets", "Pay Later"],
  },
  {
    id: "ccavenue",
    name: "CCAvenue",
    description: "One of India's oldest payment gateways with 200+ payment options",
    color: "bg-orange-600",
    dashboardUrl: "https://dashboard.ccavenue.com/",
    keyIdLabel: "CCAvenue Merchant ID",
    keyIdPlaceholder: "MERCHANT_ID",
    secretKeyName: "CCAVENUE_WORKING_KEY",
    instructions: [
      "Log in to CCAvenue Merchant Dashboard",
      "Go to Settings → API Keys",
      "Copy the Merchant ID and Access Code",
      "Store the Working Key in Lovable Cloud secrets",
    ],
    paymentMethods: ["Credit Card", "Debit Card", "Net Banking", "Wallets", "EMI", "International Cards"],
  },
  {
    id: "instamojo",
    name: "Instamojo",
    description: "Simple payment gateway ideal for small businesses & freelancers",
    color: "bg-teal-600",
    dashboardUrl: "https://www.instamojo.com/integrations/",
    keyIdLabel: "Instamojo API Key",
    keyIdPlaceholder: "test_xxxxxxxxxxxx",
    secretKeyName: "INSTAMOJO_AUTH_TOKEN",
    instructions: [
      "Log in to your Instamojo Dashboard",
      "Go to Developers → API & Plugins",
      "Generate API credentials",
      "Copy the API Key and paste it here",
      "Store the Auth Token in Lovable Cloud secrets",
    ],
    paymentMethods: ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallets", "EMI"],
  },
  {
    id: "phonepe",
    name: "PhonePe Business",
    description: "Popular UPI-first payment gateway with deep UPI integrations",
    color: "bg-indigo-600",
    dashboardUrl: "https://business.phonepe.com/",
    keyIdLabel: "PhonePe Merchant ID",
    keyIdPlaceholder: "MERCHANT_ID_HERE",
    secretKeyName: "PHONEPE_SALT_KEY",
    instructions: [
      "Log in to PhonePe Business Dashboard",
      "Go to Developer Settings → API Keys",
      "Copy the Merchant ID and paste it here",
      "Store the Salt Key in Lovable Cloud secrets",
    ],
    paymentMethods: ["UPI", "Credit Card", "Debit Card", "Net Banking"],
  },
  {
    id: "billdesk",
    name: "BillDesk",
    description: "Enterprise-grade payment gateway used by banks & government",
    color: "bg-red-600",
    dashboardUrl: "https://www.billdesk.com/",
    keyIdLabel: "BillDesk Merchant ID",
    keyIdPlaceholder: "MERCHANT_ID",
    secretKeyName: "BILLDESK_SECRET_KEY",
    instructions: [
      "Contact BillDesk for merchant onboarding",
      "Once approved, access the merchant portal",
      "Copy the Merchant ID and paste it here",
      "Store the Secret Key in Lovable Cloud secrets",
    ],
    paymentMethods: ["UPI", "Credit Card", "Debit Card", "Net Banking", "NEFT/RTGS"],
  },
];

const AdminPaymentGateway = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedGateway, setExpandedGateway] = useState<string | null>("razorpay");
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const allKeys = paymentGateways.flatMap(g => [
      `${g.id}_enabled`,
      `${g.id}_key_id`,
      `${g.id}_test_mode`,
    ]);

    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", allKeys);

    if (data) {
      const settingsObj: Record<string, string> = {};
      data.forEach((item) => {
        settingsObj[item.key] = item.value;
      });
      setSettings(settingsObj);
    }
    setLoading(false);
  };

  const saveSetting = async (key: string, value: string) => {
    setSaving(key);
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
      setSettings(prev => ({ ...prev, [key]: value }));
    }
    setSaving(null);
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

  const getGatewayValue = (gatewayId: string, field: string): string => {
    return settings[`${gatewayId}_${field}`] || "";
  };

  const setGatewayValue = (gatewayId: string, field: string, value: string) => {
    setSettings(prev => ({ ...prev, [`${gatewayId}_${field}`]: value }));
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
          Payment Gateways
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure payment gateways for accepting UPI, debit card, credit card & more
        </p>
      </div>

      {/* Payment Gateway Cards */}
      <div className="space-y-4">
        {paymentGateways.map((gateway) => {
          const isEnabled = getGatewayValue(gateway.id, "enabled") === "true";
          const isTestMode = getGatewayValue(gateway.id, "test_mode") !== "false";
          const keyId = getGatewayValue(gateway.id, "key_id");
          const isExpanded = expandedGateway === gateway.id;

          return (
            <Card key={gateway.id} className={isEnabled ? "border-primary/50" : ""}>
              <Collapsible open={isExpanded} onOpenChange={(open) => setExpandedGateway(open ? gateway.id : null)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 text-left">
                      <div className={`p-2 ${gateway.color}/10 rounded-lg`}>
                        <div className={`h-5 w-5 ${gateway.color} rounded`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{gateway.name}</CardTitle>
                          {isEnabled && (
                            <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-600 rounded-full">
                              Active
                            </span>
                          )}
                          {isEnabled && isTestMode && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-600 rounded-full">
                              Test Mode
                            </span>
                          )}
                        </div>
                        <CardDescription className="text-sm mt-0.5">
                          {gateway.description}
                        </CardDescription>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2 ml-4">
                      <Label htmlFor={`${gateway.id}-enabled`} className="text-sm text-muted-foreground sr-only">
                        {isEnabled ? "Enabled" : "Disabled"}
                      </Label>
                      <Switch
                        id={`${gateway.id}-enabled`}
                        checked={isEnabled}
                        onCheckedChange={(checked) => {
                          const value = checked ? "true" : "false";
                          saveSetting(`${gateway.id}_enabled`, value);
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-6 pt-0">
                    {/* Test Mode Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Test Mode</p>
                        <p className="text-sm text-muted-foreground">
                          Use test credentials for development (no real payments)
                        </p>
                      </div>
                      <Switch
                        checked={isTestMode}
                        onCheckedChange={(checked) => {
                          const value = checked ? "true" : "false";
                          saveSetting(`${gateway.id}_test_mode`, value);
                        }}
                      />
                    </div>

                    {/* Key ID */}
                    <div className="space-y-2">
                      <Label htmlFor={`${gateway.id}-key-id`} className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        {gateway.keyIdLabel} (Publishable)
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={`${gateway.id}-key-id`}
                            type={showKeys[gateway.id] ? "text" : "password"}
                            value={keyId}
                            onChange={(e) => setGatewayValue(gateway.id, "key_id", e.target.value)}
                            placeholder={gateway.keyIdPlaceholder}
                            className="pr-20"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setShowKeys(prev => ({ ...prev, [gateway.id]: !prev[gateway.id] }))}
                            >
                              {showKeys[gateway.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            {keyId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleCopy(keyId, `${gateway.name} Key`)}
                              >
                                {copied === `${gateway.name} Key` ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => saveSetting(`${gateway.id}_key_id`, keyId)}
                          disabled={saving === `${gateway.id}_key_id`}
                        >
                          {saving === `${gateway.id}_key_id` ? "Saving..." : "Save"}
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
                          The {gateway.name} Secret Key is a sensitive credential and should be stored securely.
                          Please add it as a secret in Lovable Cloud settings.
                        </p>
                        <p className="text-sm font-medium">
                          Secret name to use: <code className="bg-muted px-2 py-1 rounded">{gateway.secretKeyName}</code>
                        </p>
                      </AlertDescription>
                    </Alert>

                    {/* Supported Payment Methods */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Supported Payment Methods:</p>
                      <div className="flex flex-wrap gap-2">
                        {gateway.paymentMethods.map((method) => (
                          <span
                            key={method}
                            className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                      <h4 className="font-medium text-foreground">How to get your {gateway.name} API Keys:</h4>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        {gateway.instructions.map((instruction, idx) => (
                          <li key={idx}>{instruction}</li>
                        ))}
                      </ol>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={gateway.dashboardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open {gateway.name} Dashboard
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* All Supported Payment Methods Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Supported Payment Methods</CardTitle>
          <CardDescription>
            Once configured, your customers can pay using these methods across gateways
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
