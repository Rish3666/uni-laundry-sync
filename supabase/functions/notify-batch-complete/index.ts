import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  batchNumber: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batchNumber }: NotificationRequest = await req.json();

    console.log(`Processing batch ${batchNumber} completion notifications`);

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

    console.log(`Found ${orders.length} orders in batch ${batchNumber}`);

    // In a real application, you would:
    // 1. Send SMS notifications via Twilio, AWS SNS, or similar service
    // 2. Send push notifications via Firebase, OneSignal, or similar
    // 3. Send email notifications via SendGrid, Mailgun, or similar
    
    // For now, we'll just log the notifications that would be sent
    const notifications = orders.map((order) => ({
      customer: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
      orderNumber: order.order_number,
      qrCode: order.delivery_qr_code,
      message: `Your laundry is ready for pickup! Order: ${order.order_number}. Show your QR code (${order.delivery_qr_code}) when collecting. - Batch ${batchNumber}`,
    }));

    console.log("Notifications with QR codes to send:", notifications);

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
        notifications,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-batch-complete function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
