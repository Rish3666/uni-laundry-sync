import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * AdminProtectedRoute - Server-side verified admin route protection
 * 
 * This component provides defense-in-depth by:
 * 1. Verifying authentication first
 * 2. Querying the database directly to verify admin role
 * 3. Not relying on client-side cached role data
 * 
 * While RLS policies protect the actual data, this prevents
 * admin UI exposure and structure from being visible to non-admins.
 */
const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        // First check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log("AdminProtectedRoute: No authenticated user");
          navigate("/admin/login");
          return;
        }

        // Verify admin role directly from database
        // This is a fresh query, not cached client-side data
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleError) {
          console.error("AdminProtectedRoute: Error checking role:", roleError);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const hasAdminRole = roleData?.role === "admin";
        console.log("AdminProtectedRoute: Admin verification result:", hasAdminRole);
        setIsAdmin(hasAdminRole);
      } catch (error) {
        console.error("AdminProtectedRoute: Unexpected error:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAccess();

    // Re-verify on auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      verifyAdminAccess();
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-8">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the admin dashboard.
          </p>
          <Button onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
