import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Key, ExternalLink, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// This component now provides guidance on secure secret management
// Actual API keys should be stored as Supabase Edge Function secrets (environment variables)
// NOT in database tables accessible via the client SDK

const AdminApiKeys = () => {
  const { toast } = useToast();

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