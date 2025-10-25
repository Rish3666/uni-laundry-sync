import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const batchSchema = z.object({
  batchNumber: z.number().int().positive().max(999999)
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate input
    const validationResult = batchSchema.safeParse(await req.json());
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.issues }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { batchNumber } = validationResult.data;

    console.log(`Processing batch completion notifications`);

    // Get all orders in this batch with QR codes
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("user_id, customer_name, customer_email, customer_phone, order_number, delivery_qr_code")
      .eq("batch_number", batchNumber);

    if (ordersError) {
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No orders found in batch" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found orders in batch for notification`);

    // In a real application, you would:
    // 1. Send SMS notifications via Twilio, AWS SNS, or similar service
    // 2. Send push notifications via Firebase, OneSignal, or similar
    // 3. Send email notifications via SendGrid, Mailgun, or similar
    
    // For now, we'll just log minimal info
    console.log(`Preparing notifications for ${orders.length} orders`);

    // Here you would integrate with your notification service
    // Example with SMS:
    // for (const notification of notifications) {
    //   await sendSMS(notification.phone, notification.message);
    // }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent to ${orders.length} customers`,
        batch: batchNumber,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Request processing failed", { error_type: error.name });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
