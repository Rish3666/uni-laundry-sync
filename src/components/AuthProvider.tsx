import { useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { data: user } = useAuth();

  useEffect(() => {
    // Prefetch profile when user is authenticated
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: ["profile", user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          return data;
        },
      });

      // Prefetch user role
      queryClient.prefetchQuery({
        queryKey: ["userRole"],
        queryFn: async () => {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();
          return data?.role || "customer";
        },
      });
    }
  }, [user?.id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Invalidate auth queries on auth state change
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["userRole"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
};
