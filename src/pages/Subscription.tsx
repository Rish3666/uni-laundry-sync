import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, CheckCircle2 } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  duration_days: number;
  max_items_per_day: number;
  total_items: number;
  base_price: number;
  description: string;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  items_used_today: number;
  total_items_used: number;
  subscription_plans: {
    name: string;
    max_items_per_day: number;
    total_items: number;
  };
}

const Subscription = () => {
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchActiveSubscription();
    }
  }, [user]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      toast.error("Failed to load subscription plans");
      console.error(error);
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const fetchActiveSubscription = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_plans (
          name,
          max_items_per_day,
          total_items
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .gte("end_date", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
    } else {
      setActiveSubscription(data);
    }
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    navigate(`/subscription/payment?planId=${plan.id}`);
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {profile?.student_name || "User"}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        <button
          onClick={() => navigate("/")}
          className="flex-1 py-4 text-center text-muted-foreground"
        >
          Home
        </button>
        <button className="flex-1 py-4 text-center text-foreground font-semibold border-b-2 border-primary">
          Subscription
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {activeSubscription ? (
          <>
            {/* Active Subscription Card */}
            <Card className="p-6 space-y-4 bg-primary/5 border-primary">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Active Subscription</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-semibold text-foreground">
                    {activeSubscription.subscription_plans.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Days Remaining
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {calculateDaysRemaining(activeSubscription.end_date)} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Items Used Today</span>
                  <span className="font-medium text-foreground">
                    {activeSubscription.items_used_today} / {activeSubscription.subscription_plans.max_items_per_day}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Items Used</span>
                  <span className="font-medium text-foreground">
                    {activeSubscription.total_items_used} / {activeSubscription.subscription_plans.total_items}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Valid Until</span>
                  <span className="font-medium text-foreground">
                    {new Date(activeSubscription.end_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You can purchase a new subscription after this one expires
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-center text-foreground">
              Choose subscription plan
            </h2>

            {plans.map((plan) => (
              <Card key={plan.id} className="p-6 space-y-4 bg-card border-border">
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    {plan.duration_days} days, with maximum of {plan.max_items_per_day} items per day
                  </p>
                  <p>Total {plan.total_items} items per subscription</p>
                  <p>{plan.description}</p>
                </div>
                <Button
                  onClick={() => handleSubscribe(plan)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  Subscribe plan for ₹{plan.base_price.toLocaleString()}
                </Button>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Subscription;
