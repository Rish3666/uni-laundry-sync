import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Phone } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  duration_days: number;
  max_items_per_day: number;
  total_items: number;
  base_price: number;
  description: string;
}

const Subscription = () => {
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

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

  const calculateGST = (basePrice: number) => {
    return basePrice * 0.18;
  };

  const calculateTotal = (basePrice: number) => {
    return basePrice + calculateGST(basePrice);
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowConfirmDialog(true);
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !user) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

    const gstAmount = calculateGST(selectedPlan.base_price);
    const totalAmount = calculateTotal(selectedPlan.base_price);

    const { error } = await supabase.from("user_subscriptions").insert({
      user_id: user.id,
      plan_id: selectedPlan.id,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      base_amount: selectedPlan.base_price,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      status: "active",
      payment_status: "completed",
    });

    if (error) {
      toast.error("Failed to purchase subscription");
      console.error(error);
    } else {
      toast.success("Subscription purchased successfully!");
      setShowConfirmDialog(false);
      navigate("/");
    }
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
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {profile?.student_name || "User"}
          </h1>
        </div>
        <a
          href={`https://wa.me/${profile?.mobile_no || ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"
        >
          <Phone className="w-6 h-6 text-white" />
        </a>
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
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedPlan?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <span>₹</span>
                <span>Net Price</span>
              </span>
              <span className="text-xl font-semibold">
                ₹{selectedPlan?.base_price.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <span>%</span>
                <span>GST 18%</span>
              </span>
              <span className="text-xl font-semibold">
                ₹{selectedPlan ? calculateGST(selectedPlan.base_price).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <span>₹</span>
                <span>Total Payable Amount</span>
              </span>
              <span className="text-xl font-semibold">
                ₹{selectedPlan ? calculateTotal(selectedPlan.base_price).toLocaleString() : 0}
              </span>
            </div>
            <Button
              onClick={handlePurchase}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              Purchase Subscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscription;
