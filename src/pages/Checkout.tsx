import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, QrCode, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, serviceType, category } = location.state as {
    cart: CartItem[];
    serviceType: string;
    category: string;
  };

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    mobileNo: "",
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(cart || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentId || !formData.studentName || !formData.mobileNo) {
      toast.error("Please fill all fields");
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.mobileNo)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    // Simulate API call (replace with actual n8n webhook)
    setTimeout(() => {
      const orderId = `ORD-${Date.now()}`;
      toast.success("Order submitted successfully!", {
        description: `Order ID: ${orderId}`,
        icon: <QrCode className="w-4 h-4" />,
      });
      setLoading(false);
      navigate("/orders");
    }, 1500);
  };

  const removeItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
    toast.success("Item removed from cart");
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              {getTotalItems()} items in cart
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Cart Items */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Order Items</h3>
            <Badge variant="secondary" className="capitalize">
              {serviceType.replace("-", " ")}
            </Badge>
          </div>
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 bg-secondary/50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </Button>
                <span className="w-8 text-center font-medium">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </Card>

        {/* Student Information Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Student Information</h3>

            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                placeholder="e.g., CS-2025-001"
                value={formData.studentId}
                onChange={(e) =>
                  setFormData({ ...formData, studentId: e.target.value })
                }
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                placeholder="Enter your full name"
                value={formData.studentName}
                onChange={(e) =>
                  setFormData({ ...formData, studentName: e.target.value })
                }
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNo">Mobile Number</Label>
              <Input
                id="mobileNo"
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.mobileNo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                className="h-11"
              />
            </div>
          </Card>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-primary text-base font-semibold"
            disabled={loading || cartItems.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Order...
              </>
            ) : (
              `Submit Order (${getTotalItems()} items)`
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
