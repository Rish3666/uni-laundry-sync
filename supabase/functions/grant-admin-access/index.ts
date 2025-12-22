import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");

const grantAdminSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  adminPassword: z.string().min(8).max(100),
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

    // Extract IP address for logging
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
               req.headers.get("x-real-ip") || 
               "unknown";

    // Validate input
    const body = await req.json();
    const validationResult = grantAdminSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log("Validation failed", { issues: validationResult.error.issues });
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.issues }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { userId, adminPassword } = validationResult.data;

    console.log("Admin access request initiated", { ip, userId });

    // Verify admin password
    if (!ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD environment variable not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (adminPassword !== ADMIN_PASSWORD) {
      console.warn("Invalid admin password attempt", { ip, userId });
      return new Response(
        JSON.stringify({ error: "Invalid admin password" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already has admin role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingRole?.role === "admin") {
      console.log("User already has admin role", { userId });
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User already has admin role" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Grant admin role using service role (bypasses RLS)
    // First delete any existing role for this user
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Failed to delete existing role", { error: deleteError.message });
    }

    // Insert new admin role
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin",
      });

    if (insertError) {
      console.error("Failed to insert admin role", { error: insertError.message });
      return new Response(
        JSON.stringify({ error: "Failed to grant admin role" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Admin role granted successfully", { userId });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin access granted successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Request processing failed", { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
