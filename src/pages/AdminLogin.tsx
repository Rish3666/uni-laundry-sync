import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Shield } from "lucide-react";

// Admin password is securely stored in backend secrets

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    adminPassword: "",
  });

  useEffect(() => {
    // Check if user is already logged in as admin
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        if (roleData?.role === "admin") {
          navigate("/admin/batches");
        }
      }
    });
  }, [navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.adminPassword) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);

    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (signInError) {
      setLoading(false);
      toast.error(signInError.message);
      return;
    }

    // Grant admin role via edge function (validates password server-side)
    const { data: grantData, error: grantError } = await supabase.functions.invoke(
      "grant-admin-access",
      {
        body: {
          userId: signInData.user.id,
          adminPassword: formData.adminPassword,
        },
      }
    );

    setLoading(false);

    if (grantError || !grantData?.success) {
      console.error("Grant error:", grantError || grantData);
      toast.error(grantData?.error || "Failed to grant admin access");
      return;
    }

    toast.success("Admin access granted! Welcome!");
    navigate("/admin/batches");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Admin Login</h1>
          <p className="text-muted-foreground">
            Sign in with admin credentials
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11 pl-10"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-11 pl-10"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Admin Access Code</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                className="h-11 pl-10"
                placeholder="Enter admin access code"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Contact system administrator for the access code
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-gradient-primary" 
            disabled={loading}
          >
            {loading ? "Verifying..." : "Login as Admin"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-primary hover:underline"
          >
            ← Back to student login
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
