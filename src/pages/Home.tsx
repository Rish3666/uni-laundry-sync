import { useState } from "react";
import { Users, User, Bed, Package, ShoppingCart, Loader2, Trash2, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
}

type Step = "category" | "items" | "checkout";

const Home = () => {
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    mobileNo: "",
  });

  const categories = [
    { id: "others", name: "Others", icon: Package, color: "from-amber-500 to-amber-600" },
    { id: "mens-wear", name: "Men's Wear", icon: User, color: "from-blue-500 to-blue-600" },
    { id: "womens-wear", name: "Women's Wear", icon: Users, color: "from-pink-500 to-pink-600" },
    { id: "bedding", name: "Bedding", icon: Bed, color: "from-purple-500 to-purple-600" },
  ];

  const categoryItems: Record<string, { id: string; name: string }[]> = {
    "womens-wear": [
      { id: "blouse", name: "Blouse" },
      { id: "sweater", name: "Sweater" },
      { id: "top-regular", name: "Top (Regular)" },
      { id: "saree", name: "Saree" },
      { id: "socks", name: "Socks" },
      { id: "salwar", name: "Salwar" },
      { id: "shirt-tshirt", name: "Shirt/T-shirt" },
      { id: "pant", name: "Pant" },
      { id: "top-long", name: "Top (Long)" },
      { id: "frock-skirt", name: "Frock/Skirt" },
      { id: "kameez", name: "Kameez" },
    ],
    "mens-wear": [
      { id: "shorts", name: "Shorts" },
      { id: "socks", name: "Socks" },
      { id: "kurta", name: "Kurta" },
      { id: "sweater", name: "Sweater" },
      { id: "lungi-dhoti", name: "Lungi/Dhoti" },
      { id: "shirt-tshirt", name: "Shirt/Tshirt" },
      { id: "pant-trouser", name: "Pant/Trouser" },
      { id: "pyjama", name: "Pyjama" },
    ],
    "bedding": [
      { id: "towel-hand", name: "Towel - Hand" },
      { id: "quilt-double", name: "Quilt - Double" },
      { id: "pillow-cover", name: "Pillow Cover" },
      { id: "bed-sheet-single", name: "Bed Sheet - Single" },
      { id: "bedsheet-double", name: "Bedsheet - Double" },
      { id: "quilt-single", name: "Quilt - Single" },
      { id: "hanky", name: "Hanky" },
      { id: "blanket-single", name: "Blanket - Single" },
      { id: "towel-bath", name: "Towel - Bath" },
      { id: "blanket-double", name: "Blanket - Double" },
    ],
    "others": [
      { id: "curtain", name: "Curtain" },
      { id: "table-cloth", name: "Table Cloth" },
      { id: "cushion-cover", name: "Cushion Cover" },
      { id: "napkin", name: "Napkin" },
    ],
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep("items");
  };

  const addToCart = (item: { id: string; name: string }) => {
    const existingItem = cart.find((i) => i.id === item.id);
    if (existingItem) {
      setCart(cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const removeItem = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
    toast.success("Item removed from cart");
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }
    setCart(cart.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)));
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error("Please add items to cart");
      return;
    }
    setStep("checkout");
  };

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

    try {
      const orderId = `ORD-${Date.now()}`;
      const orderData = {
        orderId,
        studentId: formData.studentId,
        studentName: formData.studentName,
        mobileNo: formData.mobileNo,
        serviceType: "laundry",
        category: selectedCategory,
        items: cart,
        inTime: new Date().toISOString(),
        status: "Submitted",
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit order");
      }

      toast.success("Order submitted successfully!", {
        description: `Order ID: ${orderId}`,
        icon: <QrCode className="w-4 h-4" />,
      });

      // Reset form
      setStep("category");
      setSelectedCategory("");
      setCart([]);
      setFormData({ studentId: "", studentName: "", mobileNo: "" });
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Failed to submit order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const items = categoryItems[selectedCategory] || [];

  return (
    <div className="min-h-[calc(100vh-8rem)] p-4 pb-24 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            UniLaundry Manager
          </h1>
          <p className="text-muted-foreground">Quick and easy laundry orders for students</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full transition-colors ${step === "category" ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step === "items" ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step === "checkout" ? "bg-primary" : "bg-muted"}`} />
        </div>

        {/* Step 1: Category Selection */}
        {step === "category" && (
          <>
            <Card className="p-6 bg-gradient-primary text-white shadow-elevated border-0">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Welcome!</h2>
                <p className="text-white/90 text-sm">Select a category to start your laundry order</p>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card
                    key={category.id}
                    className="p-0 overflow-hidden cursor-pointer hover:shadow-elevated transition-all hover:scale-[1.02] border-2 border-transparent hover:border-primary"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <div className="aspect-square relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10`} />
                      <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-semibold text-center">{category.name}</h3>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Step 2: Item Selection */}
        {step === "items" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-sm text-muted-foreground">Add items to your cart</p>
              </div>
              {cart.length > 0 && (
                <Badge className="bg-primary text-primary-foreground">{getTotalItems()} items</Badge>
              )}
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const cartItem = cart.find((i) => i.id === item.id);
                return (
                  <Card key={item.id} className="p-4 flex items-center justify-between hover:shadow-card transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        <span className="text-2xl">👕</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        {cartItem && <p className="text-sm text-muted-foreground">Qty: {cartItem.quantity}</p>}
                      </div>
                    </div>
                    <Button onClick={() => addToCart(item)} className="bg-primary hover:bg-primary/90 h-9 px-4">
                      Add
                    </Button>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("category")} className="flex-1">
                Back
              </Button>
              {cart.length > 0 && (
                <Button onClick={handleProceedToCheckout} className="flex-1 bg-gradient-primary">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Checkout ({getTotalItems()})
                </Button>
              )}
            </div>
          </>
        )}

        {/* Step 3: Checkout */}
        {step === "checkout" && (
          <>
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Order Items</h3>
              </div>
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-secondary/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      -
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      +
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </Card>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Card className="p-6 space-y-4">
                <h3 className="font-semibold text-lg">Student Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    placeholder="e.g., CS-2025-001"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    placeholder="Enter your full name"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
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

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep("items")} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-primary" disabled={loading || cart.length === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    `Submit Order (${getTotalItems()})`
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
