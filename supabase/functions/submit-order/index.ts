import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const orderSchema = z.object({
  order_id: z.string().uuid("Invalid order ID format"),
  order_number: z.string().regex(/^LND\d{8}$/, "Invalid order number format"),
  customer_name: z.string().trim().min(2).max(100),
  customer_phone: z.string().regex(/^\d{10}$/, "Invalid phone number format"),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    name: z.string().max(200),
    serviceType: z.string().max(50),
    quantity: z.number().int().positive().max(100),
    price: z.number().positive().max(100000)
  })).min(1).max(100),
  total_amount: z.number().positive().max(1000000),
  payment_method: z.string().max(50)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Validate input
    const validationResult = orderSchema.safeParse(await req.json());
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const payload = validationResult.data;

    // Verify order belongs to authenticated user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('user_id, total_amount')
      .eq('id', payload.order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (order.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Validate total amount matches database
    if (Math.abs(order.total_amount - payload.total_amount) > 0.01) {
      console.error('Order validation failed', { operation: 'amount_check' });
      return new Response(
        JSON.stringify({ error: 'Order amount mismatch' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate items array
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid items data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Log only minimal info
    console.log('Order processing started', { item_count: payload.items.length });

    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new Error('N8N_WEBHOOK_URL not configured');
    }

    // Send to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: payload.order_id,
        order_number: payload.order_number,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        items: payload.items,
        total_amount: payload.total_amount,
        payment_method: payload.payment_method,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook returned ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));
    console.log('Order processed successfully');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Request processing failed', { error_type: error instanceof Error ? error.name : 'unknown' });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
