import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch Razorpay Key ID from site_settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["razorpay_key_id", "razorpay_enabled"]);
    
    const settings: Record<string, string> = {};
    settingsData?.forEach((item: { key: string; value: string }) => {
      settings[item.key] = item.value;
    });
    
    const razorpayKeyId = settings.razorpay_key_id;
    const razorpayEnabled = settings.razorpay_enabled === "true";

    if (!razorpayEnabled) {
      return new Response(
        JSON.stringify({ success: false, error: "Razorpay is not enabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Razorpay credentials not configured. Please add RAZORPAY_KEY_SECRET in Cloud secrets." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...payload } = await req.json();

    // CREATE ORDER
    if (action === "create-order") {
      const { amount, currency = "INR", receipt, notes } = payload;

      if (!amount || amount <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create order via Razorpay API
      const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to paise
          currency,
          receipt: receipt || `receipt_${Date.now()}`,
          notes: notes || {},
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error("Razorpay order creation failed:", errorData);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to create order", details: errorData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const order = await orderResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: razorpayKeyId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // VERIFY PAYMENT
    if (action === "verify-payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointment_id } = payload;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing payment details" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify signature using HMAC SHA256
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(razorpayKeySecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const message = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(message)
      );

      const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (generatedSignature !== razorpay_signature) {
        return new Response(
          JSON.stringify({ success: false, error: "Payment verification failed - invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Payment verified! Update appointment status if provided
      if (appointment_id) {
        // Get existing notes first
        const { data: appointment } = await supabase
          .from("appointments")
          .select("notes")
          .eq("id", appointment_id)
          .single();

        const existingNotes = appointment?.notes || "";
        const amountPaid = payload.amount_paid ? payload.amount_paid / 100 : 0;
        const paymentNote = `Payment: ₹${amountPaid} | ID: ${razorpay_payment_id}`;
        const updatedNotes = existingNotes ? `${existingNotes} | ${paymentNote}` : paymentNote;

        const { error: updateError } = await supabase
          .from("appointments")
          .update({ notes: updatedNotes, status: "confirmed" })
          .eq("id", appointment_id);

        if (updateError) {
          console.error("Failed to update appointment:", updateError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment verified successfully",
          payment_id: razorpay_payment_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET PAYMENT STATUS
    if (action === "get-payment") {
      const { payment_id } = payload;

      if (!payment_id) {
        return new Response(
          JSON.stringify({ success: false, error: "Payment ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}`, {
        headers: { Authorization: `Basic ${auth}` },
      });

      if (!paymentResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, error: "Failed to fetch payment details" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payment = await paymentResponse.json();
      return new Response(
        JSON.stringify({ success: true, payment }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
