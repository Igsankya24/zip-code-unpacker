import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

interface PaymentDetails {
  amount: number;
  currency?: string;
  description?: string;
  appointmentId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: Record<string, string>;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
}

export const useRazorpay = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [keyId, setKeyId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("Payment");

  // Load Razorpay script
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // Check if Razorpay is enabled and get settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["razorpay_enabled", "razorpay_key_id", "site_name"]);

      if (data) {
        const settings: Record<string, string> = {};
        data.forEach((item) => {
          settings[item.key] = item.value;
        });

        setIsEnabled(settings.razorpay_enabled === "true");
        setKeyId(settings.razorpay_key_id || null);
        if (settings.site_name) {
          setBusinessName(settings.site_name);
        }
      }
    };

    fetchSettings();
  }, []);

  // Create order and initiate payment
  const initiatePayment = useCallback(
    async (details: PaymentDetails): Promise<PaymentResult> => {
      if (!isEnabled) {
        return { success: false, error: "Payment gateway not enabled" };
      }

      if (!keyId) {
        return { success: false, error: "Payment gateway not configured" };
      }

      setLoading(true);

      try {
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Failed to load payment gateway");
        }

        // Create order via edge function
        const { data: orderData, error: orderError } = await supabase.functions.invoke(
          "razorpay-payment",
          {
            body: {
              action: "create-order",
              amount: details.amount,
              currency: details.currency || "INR",
              receipt: details.appointmentId ? `apt_${details.appointmentId}` : undefined,
              notes: {
                appointment_id: details.appointmentId || "",
                ...details.notes,
              },
            },
          }
        );

        if (orderError || !orderData?.success) {
          throw new Error(orderData?.error || orderError?.message || "Failed to create order");
        }

        // Open Razorpay checkout
        return new Promise((resolve) => {
          const options: RazorpayOptions = {
            key: keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: businessName,
            description: details.description || "Service Booking",
            order_id: orderData.order_id,
            handler: async (response) => {
              // Verify payment
              try {
                const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
                  "razorpay-payment",
                  {
                    body: {
                      action: "verify-payment",
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      appointment_id: details.appointmentId,
                      amount_paid: orderData.amount,
                    },
                  }
                );

                if (verifyError || !verifyData?.success) {
                  toast({
                    title: "Payment Verification Failed",
                    description: "Please contact support with your payment ID",
                    variant: "destructive",
                  });
                  resolve({
                    success: false,
                    paymentId: response.razorpay_payment_id,
                    error: "Verification failed",
                  });
                  return;
                }

                toast({
                  title: "Payment Successful!",
                  description: `Payment ID: ${response.razorpay_payment_id}`,
                });

                resolve({
                  success: true,
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                });
              } catch (err) {
                console.error("Verification error:", err);
                resolve({
                  success: false,
                  paymentId: response.razorpay_payment_id,
                  error: "Verification error",
                });
              }
            },
            prefill: {
              name: details.customerName,
              email: details.customerEmail,
              contact: details.customerPhone,
            },
            notes: {
              appointment_id: details.appointmentId || "",
            },
            theme: {
              color: "#3B82F6",
            },
            modal: {
              ondismiss: () => {
                toast({
                  title: "Payment Cancelled",
                  description: "You cancelled the payment process",
                  variant: "destructive",
                });
                resolve({ success: false, error: "Payment cancelled" });
              },
            },
          };

          const razorpay = new window.Razorpay(options);
          razorpay.open();
        });
      } catch (error: any) {
        console.error("Payment error:", error);
        toast({
          title: "Payment Error",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [isEnabled, keyId, businessName, loadRazorpayScript, toast]
  );

  return {
    initiatePayment,
    loading,
    isEnabled,
    isConfigured: isEnabled && !!keyId,
  };
};
