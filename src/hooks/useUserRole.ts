import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export type UserRole = "admin" | "customer" | null;

export const useUserRole = () => {
  const { data: role, isLoading: loading, refetch } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return "customer" as UserRole;
      }
      
      return (data?.role as UserRole) || "customer";
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refetch();
    });

    return () => subscription.unsubscribe();
  }, [refetch]);

  return { 
    role: role ?? null, 
    loading, 
    isAdmin: role === "admin", 
    isCustomer: role === "customer" 
  };
};
