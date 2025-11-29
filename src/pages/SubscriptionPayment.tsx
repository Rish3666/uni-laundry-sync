import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, CreditCard } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SubscriptionPlan {
  id: string;
  name: string;
  duration_days: number;
  base_price: number;
}

const SubscriptionPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: user } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");

  const planId = searchParams.get("planId");

  useEffect(() => {
    if (planId) {
      fetchPlan();
    }
  }, [planId]);

  const fetchPlan = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (error) {
      toast.error("Failed to load plan details");
      navigate("/subscription");
    } else {
      setPlan(data);
    }
    setLoading(false);
  };

  const calculateGST = (basePrice: number) => {
    return basePrice * 0.18;
  };

  const calculateTotal = (basePrice: number) => {
    return basePrice + calculateGST(basePrice);
  };

  const handlePayment = async () => {
    if (!plan || !user) return;

    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    const gstAmount = calculateGST(plan.base_price);
    const totalAmount = calculateTotal(plan.base_price);

    const { error } = await supabase.from("user_subscriptions").insert({
      user_id: user.id,
      plan_id: plan.id,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      base_amount: plan.base_price,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      status: "active",
      payment_status: "completed",
    });

    if (error) {
      toast.error("Payment failed. Please try again.");
      console.error(error);
    } else {
      toast.success("Payment successful! Subscription activated.");
      navigate("/subscription");
    }
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/subscription")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Payment</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Plan Summary */}
        <Card className="p-6 space-y-4 bg-card border-border">
          <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Price</span>
              <span className="font-medium">₹{plan.base_price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="font-medium">₹{calculateGST(plan.base_price).toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total Amount</span>
                <span className="text-xl font-bold text-primary">
                  ₹{calculateTotal(plan.base_price).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-6 space-y-4 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </h3>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent">
              <RadioGroupItem value="upi" id="upi" />
              <Label htmlFor="upi" className="flex-1 cursor-pointer">
                UPI (Google Pay, PhonePe, Paytm)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex-1 cursor-pointer">
                Credit/Debit Card
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent">
              <RadioGroupItem value="netbanking" id="netbanking" />
              <Label htmlFor="netbanking" className="flex-1 cursor-pointer">
                Net Banking
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Pay Button */}
        <Button
          onClick={handlePayment}
          disabled={processing}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          {processing ? "Processing..." : `Pay ₹${calculateTotal(plan.base_price).toLocaleString()}`}
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionPayment;
