import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Key, ExternalLink, AlertTriangle, Copy, Eye, EyeOff, Database, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

// This component now provides guidance on secure secret management
// Actual API keys should be stored as Supabase Edge Function secrets (environment variables)
// NOT in database tables accessible via the client SDK

interface AdminApiKeysProps {
  isSuperAdmin?: boolean;
}

const AdminApiKeys = ({ isSuperAdmin = false }: AdminApiKeysProps) => {
  const { toast } = useToast();
  const [showProjectUrl, setShowProjectUrl] = useState(false);
  const [showAnonKey, setShowAnonKey] = useState(false);

  // Supabase credentials from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";

  const suggestedApiKeys = [
    {
      name: "RESEND_API_KEY",
      description: "For sending emails to customers and technicians",
      provider: "Resend",
      url: "https://resend.com/api-keys",
      icon: "📧",
      docsUrl: "https://resend.com/docs"
    },
    {
      name: "TWILIO_ACCOUNT_SID",
      description: "Twilio Account SID for SMS notifications",
      provider: "Twilio",
      url: "https://console.twilio.com/",
      icon: "📱",
      docsUrl: "https://www.twilio.com/docs/sms"
    },
    {
      name: "TWILIO_AUTH_TOKEN",
      description: "Twilio Auth Token for SMS authentication",
      provider: "Twilio",
      url: "https://console.twilio.com/",
      icon: "🔐",
      docsUrl: "https://www.twilio.com/docs/sms"
    },
    {
      name: "TWILIO_PHONE_NUMBER",
      description: "Twilio phone number to send SMS from",
      provider: "Twilio",
      url: "https://console.twilio.com/",
      icon: "📞",
      docsUrl: "https://www.twilio.com/docs/sms"
    },
    {
      name: "MSG91_AUTH_KEY",
      description: "MSG91 API key for SMS in India",
      provider: "MSG91",
      url: "https://msg91.com/",
      icon: "💬",
      docsUrl: "https://docs.msg91.com/"
    },
    {
      name: "WHATSAPP_API_KEY",
      description: "WhatsApp Business API key for messaging",
      provider: "WhatsApp Business",
      url: "https://developers.facebook.com/",
      icon: "📲",
      docsUrl: "https://developers.facebook.com/docs/whatsapp"
    }
  ];

  const handleCopySecretName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast({ 
      title: "Copied!", 
      description: `Secret name "${name}" copied to clipboard` 
    });
  };

  const handleCopyValue = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast({ 
      title: "Copied!", 
      description: `${label} copied to clipboard` 
    });
  };

  const maskValue = (value: string) => {
    if (value.length <= 12) return "••••••••••••";
    return value.substring(0, 8) + "••••••••••••" + value.substring(value.length - 4);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">API Keys & Secrets</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Secure management of API keys for email, messaging, and other integrations
          </p>
        </div>
      </div>

      {/* Supabase Credentials - Super Admin Only */}
      {isSuperAdmin && (
        <div className="bg-card rounded-xl border border-primary/20 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Lovable Cloud Credentials</h3>
            <Badge variant="outline" className="ml-2 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Super Admin Only
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            These are your project's backend credentials. Keep them secure and never share them publicly.
          </p>
          
          <div className="space-y-3">
            {/* Project ID */}
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Project ID</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {supabaseProjectId || "Not configured"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyValue(supabaseProjectId, "Project ID")}
                  disabled={!supabaseProjectId}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Project URL */}
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Project URL</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {showProjectUrl ? supabaseUrl : maskValue(supabaseUrl)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProjectUrl(!showProjectUrl)}
                  >
                    {showProjectUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyValue(supabaseUrl, "Project URL")}
                    disabled={!supabaseUrl}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Anon Key (Publishable) */}
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">Anon Key</p>
                    <Badge variant="secondary" className="text-[10px]">Publishable</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {showAnonKey ? supabaseAnonKey : maskValue(supabaseAnonKey)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnonKey(!showAnonKey)}
                  >
                    {showAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyValue(supabaseAnonKey, "Anon Key")}
                    disabled={!supabaseAnonKey}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Service Role Key - Note */}
            <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Service Role Key</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The Service Role Key is stored securely in Cloud secrets and is only accessible in Edge Functions. 
                    It bypasses RLS and should never be exposed client-side.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Information */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Secure Secret Management</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-2">
            For security, API keys and secrets are managed through <strong>Lovable Cloud secrets</strong>, 
            not stored in the database. This ensures sensitive credentials never leave the server environment.
          </p>
          <p className="text-sm text-muted-foreground">
            To add or update secrets, go to <strong>Settings → Cloud → Secrets</strong> in your Lovable project settings, 
            or use the secrets management feature when prompted by the AI assistant.
          </p>
        </AlertDescription>
      </Alert>

      {/* Recommended Services */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h3 className="font-semibold text-foreground">Recommended Integrations</h3>
        <p className="text-sm text-muted-foreground">
          These services are recommended for sending emails and SMS to customers and technicians.
          Click on a service to get your API key, then add it as a secret in your project settings.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {suggestedApiKeys.map((suggested) => (
            <div
              key={suggested.name}
              className="p-3 rounded-lg border border-border bg-muted/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xl">{suggested.icon}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{suggested.name}</p>
                    <p className="text-xs text-muted-foreground">{suggested.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySecretName(suggested.name)}
                  title="Copy secret name"
                >
                  <Key className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <a
                  href={suggested.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  Get from {suggested.provider}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-muted-foreground">•</span>
                <a
                  href={suggested.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
                >
                  Docs
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Add Secrets */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h3 className="font-semibold text-foreground">How to Add Secrets</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Get your API key from the service provider (links above)</li>
          <li>In Lovable, go to <strong>Settings → Cloud → Secrets</strong></li>
          <li>Add a new secret with the name shown above (e.g., RESEND_API_KEY)</li>
          <li>Paste your API key value and save</li>
          <li>The secret will be available to Edge Functions automatically</li>
        </ol>
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Why this approach?</strong> Storing secrets in the database exposes them to client-side code, 
            making them vulnerable to interception. Environment variables in Edge Functions are never transmitted 
            to the browser, keeping your credentials secure.
          </p>
        </div>
      </div>

      {/* No keys message */}
      <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-border">
        <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Secrets are managed securely in project settings</p>
        <p className="text-sm mt-1">
          Add your API keys via <strong>Settings → Cloud → Secrets</strong> to use them in Edge Functions.
        </p>
      </div>
    </div>
  );
};

export default AdminApiKeys;