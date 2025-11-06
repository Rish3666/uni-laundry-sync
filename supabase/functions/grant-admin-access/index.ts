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

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitData {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const kv = await Deno.openKv();
  const key = ["rate_limit", "admin_grant", ip];
  
  const entry = await kv.get<RateLimitData>(key);
  const now = Date.now();
  
  if (!entry.value) {
    // First attempt
    await kv.set(key, { attempts: 1, firstAttempt: now }, { expireIn: ATTEMPT_WINDOW_MS });
    return { allowed: true };
  }
  
  const data = entry.value;
  
  // Check if locked out
  if (data.lockedUntil && data.lockedUntil > now) {
    const retryAfter = Math.ceil((data.lockedUntil - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Reset if window has passed
  if (now - data.firstAttempt > ATTEMPT_WINDOW_MS) {
    await kv.set(key, { attempts: 1, firstAttempt: now }, { expireIn: ATTEMPT_WINDOW_MS });
    return { allowed: true };
  }
  
  // Check if max attempts reached
  if (data.attempts >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION_MS;
    await kv.set(key, { ...data, lockedUntil }, { expireIn: LOCKOUT_DURATION_MS });
    const retryAfter = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Increment attempts
  await kv.set(key, { ...data, attempts: data.attempts + 1 }, { expireIn: ATTEMPT_WINDOW_MS });
  return { allowed: true };
}

async function recordFailedAttempt(supabase: any, ip: string, userId: string) {
  // Log failed attempt for security monitoring
  console.warn("Failed admin grant attempt", { 
    ip, 
    userId, 
    timestamp: new Date().toISOString() 
  });
  
  // Store in database for audit trail
  await supabase.from("admin_access_attempts").insert({
    ip_address: ip,
    user_id: userId,
    success: false,
    attempted_at: new Date().toISOString(),
  }).catch(() => {
    // Table might not exist yet, just log
    console.log("Admin access attempts logging skipped (table not found)");
  });
}

async function recordSuccessfulAttempt(supabase: any, ip: string, userId: string) {
  console.log("Successful admin grant", { 
    ip, 
    userId, 
    timestamp: new Date().toISOString() 
  });
  
  await supabase.from("admin_access_attempts").insert({
    ip_address: ip,
    user_id: userId,
    success: true,
    attempted_at: new Date().toISOString(),
  }).catch(() => {
    console.log("Admin access attempts logging skipped (table not found)");
  });
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

    // Extract IP address for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
               req.headers.get("x-real-ip") || 
               "unknown";

    // Check rate limit
    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.allowed) {
      console.warn("Rate limit exceeded", { ip, retryAfter: rateLimit.retryAfter });
      return new Response(
        JSON.stringify({ 
          error: "Too many attempts. Please try again later.",
          retryAfter: rateLimit.retryAfter 
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter || 900),
          },
        }
      );
    }

    // Validate input
    const validationResult = grantAdminSchema.safeParse(await req.json());
    if (!validationResult.success) {
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
    if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
      await recordFailedAttempt(supabase, ip, userId);
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
      console.error("Database operation failed", { operation: "delete_role" });
    }

    // Insert new admin role
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin",
      });

    if (insertError) {
      console.error("Database operation failed", { operation: "insert_role" });
      return new Response(
        JSON.stringify({ error: "Failed to grant admin role" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await recordSuccessfulAttempt(supabase, ip, userId);
    console.log("Admin role granted successfully");

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
