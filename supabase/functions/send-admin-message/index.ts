import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminMessageRequest {
  userName: string;
  userEmail: string;
  message: string;
}

// Escape HTML to prevent XSS/injection attacks
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userEmail, message }: AdminMessageRequest = await req.json();

    // Sanitize all user inputs before embedding in HTML
    const safeUserName = escapeHtml(userName || '');
    const safeUserEmail = escapeHtml(userEmail || '');
    const safeMessage = escapeHtml(message || '');

    const emailResponse = await resend.emails.send({
      from: "SmartWash <onboarding@resend.dev>",
      to: ["admin@example.com"], // Replace with actual admin email
      subject: `Message from ${safeUserName}`,
      html: `
        <h2>New message from customer</h2>
        <p><strong>From:</strong> ${safeUserName}</p>
        <p><strong>Email:</strong> ${safeUserEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-admin-message function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
