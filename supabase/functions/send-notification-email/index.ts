import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "contact_message" | "new_appointment";
  data: Record<string, any>;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    const { type, data }: EmailRequest = await req.json();

    // Get admin email from site settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: adminEmailSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "notification_email")
      .maybeSingle();

    const adminEmail = adminEmailSetting?.value || Deno.env.get("ADMIN_EMAIL") || "admin@example.com";

    let emailContent = {
      from: "Notifications <onboarding@resend.dev>",
      to: [adminEmail],
      subject: "",
      html: "",
    };

    if (type === "contact_message") {
      emailContent.subject = `New Contact Message from ${data.name}`;
      emailContent.html = `
        <h1>New Contact Message</h1>
        <p><strong>From:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
        ${data.subject ? `<p><strong>Subject:</strong> ${data.subject}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
        <hr>
        <p><small>Received at: ${new Date().toLocaleString()}</small></p>
      `;
    } else if (type === "new_appointment") {
      emailContent.subject = `New Appointment Booking - ${data.reference_id}`;
      emailContent.html = `
        <h1>New Appointment Booked</h1>
        <p><strong>Reference ID:</strong> ${data.reference_id}</p>
        <p><strong>Customer:</strong> ${data.customer_name || "Guest"}</p>
        ${data.customer_email ? `<p><strong>Email:</strong> ${data.customer_email}</p>` : ""}
        ${data.customer_phone ? `<p><strong>Phone:</strong> ${data.customer_phone}</p>` : ""}
        <p><strong>Service:</strong> ${data.service_name || "Not specified"}</p>
        <p><strong>Date:</strong> ${data.appointment_date}</p>
        <p><strong>Time:</strong> ${data.appointment_time}</p>
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}
        <hr>
        <p><small>Booked at: ${new Date().toLocaleString()}</small></p>
      `;
    }

    const emailResponse = await resend.emails.send(emailContent);
    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});