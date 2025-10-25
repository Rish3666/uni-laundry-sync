import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Banknote, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CartItem {
  id: string;
  itemId: string;
  name: string;
  emoji: string;
  category: string;
  serviceType: string;
  quantity: number;
  price: number;
}

type PaymentMethod = "cash" | "card" | "upi";

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [profile, setProfile] = useState<any>(null);
  const [orderCreated, setOrderCreated] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      toast.error("Your cart is empty");
      navigate("/");
    }
  }, [navigate]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data);
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !profile) {
        toast.error("Please log in to place an order");
        setLoading(false);
        return;
      }

      const totalAmount = getTotalAmount();
      const orderNumber = `LND${Date.now().toString().slice(-8)}`;
      const deliveryQrCode = `DLV-${Date.now().toString()}-${user.id.slice(0, 8)}`;

      // Create order in database immediately
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: profile.student_name,
          customer_phone: profile.mobile_no,
          customer_email: profile.email,
          student_id: profile.student_id,
          room_number: profile.room_number,
          total_amount: totalAmount,
          status: "pending",
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cash" ? "pending" : "paid",
          delivery_qr_code: deliveryQrCode,
        })
        .select()
        .single();

      if (orderError) {
        toast.error("Failed to create order");
        console.error(orderError);
        setLoading(false);
        return;
      }

      // Insert order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        item_id: item.itemId,
        service_type_id: item.id.split("-")[1],
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        service_name: item.serviceType,
        item_name: item.name,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Error inserting order items:", itemsError);
        toast.error("Failed to add order items");
        setLoading(false);
        return;
      }

      // Clear cart
      localStorage.removeItem("cart");
      
      console.log("Order created:", order);
      console.log("QR Code value:", deliveryQrCode);
      console.log("Setting orderCreated state...");

      // Show QR code screen
      setOrderCreated({
        order_number: orderNumber,
        total_amount: totalAmount,
        delivery_qr_code: deliveryQrCode,
      });
      
      toast.success("Order created! Show QR to admin");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: "cash", name: "Cash", icon: Banknote, emoji: "💵" },
    { id: "card", name: "Card", icon: CreditCard, emoji: "💳" },
    { id: "upi", name: "UPI", icon: Smartphone, emoji: "📱" },
  ];

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (orderCreated) {
    console.log("Rendering QR code screen with data:", orderCreated);
    
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-gradient-primary shadow-elevated">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="text-xl font-semibold text-primary-foreground text-center">✅ Order Created</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <Card className="shadow-card border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-center text-lg">📱 Scan This QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-center bg-white p-8 rounded-lg border-2 border-dashed border-primary/30">
                {orderCreated?.delivery_qr_code ? (
                  <QRCodeSVG 
                    value={orderCreated.delivery_qr_code} 
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <div className="text-center text-destructive">
                    <p>Error: QR code value missing</p>
                    <p className="text-xs mt-2">{JSON.stringify(orderCreated)}</p>
                  </div>
                )}
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">Order #{orderCreated.order_number}</p>
                <p className="text-muted-foreground">Total: ₹{orderCreated.total_amount}</p>
                <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                  <p className="text-sm text-info font-medium">
                    🎯 Show this QR code to the admin
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    The admin will scan it to receive your laundry
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Button variant="outline" onClick={() => navigate("/orders")} className="w-full">
                  Go to My Orders
                </Button>
                <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-gradient-primary shadow-elevated">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full text-primary-foreground hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-primary-foreground">Payment</h1>
            <p className="text-sm text-primary-foreground/80">{getTotalItems()} items • ₹{getTotalAmount()}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-card rounded-lg p-4 shadow-card space-y-3">
          <h2 className="font-semibold">Customer Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student Name</span>
              <span className="font-medium">{profile?.student_name || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student ID</span>
              <span className="font-medium">{profile?.student_id || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mobile Number</span>
              <span className="font-medium">{profile?.mobile_no || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room Number</span>
              <span className="font-medium">{profile?.room_number || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{profile?.email || "Not set"}</span>
            </div>
          </div>
          {(!profile?.student_name || !profile?.mobile_no) && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">Please update your profile with complete information before placing an order.</p>
              <Button 
                type="button" 
                variant="link" 
                className="h-auto p-0 text-sm text-destructive hover:text-destructive/80"
                onClick={() => navigate("/profile")}
              >
                Go to Profile →
              </Button>
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg p-4 shadow-card space-y-3">
          <h2 className="font-semibold">Order Summary</h2>
          {cart.slice(0, 3).map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.emoji} {item.name} × {item.quantity}</span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
          {cart.length > 3 && <p className="text-xs text-muted-foreground">+{cart.length - 3} more</p>}
          <div className="border-t pt-3 flex justify-between font-semibold">
            <span>Total</span><span className="text-primary">₹{getTotalAmount()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-lg p-4 shadow-card space-y-4">
            <h2 className="font-semibold">Select Payment</h2>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map(method => (
                <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${paymentMethod === method.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  <span className="text-3xl">{method.emoji}</span>
                  <span className="text-sm font-medium">{method.name}</span>
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full h-14 text-lg font-semibold shadow-elevated" disabled={loading} size="lg">
            {loading ? "Processing..." : `Pay ₹${getTotalAmount()} & Place Order`}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
