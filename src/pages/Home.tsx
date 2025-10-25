import { useState, useEffect } from "react";
import { Sparkles, Shirt, BedDouble, Package, ShoppingCart, Loader2, Trash2, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

type Step = "category" | "items" | "checkout";

const Home = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    mobileNo: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        setFormData({
          studentId: profileData.student_id || "",
          studentName: profileData.student_name || "",
          mobileNo: profileData.mobile_no || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const categories = [
    { id: "others", name: "Others", icon: Package, color: "from-amber-500 to-amber-600" },
    { id: "mens-wear", name: "Men's Wear", icon: Shirt, color: "from-blue-500 to-blue-600" },
    { id: "womens-wear", name: "Women's Wear", icon: Sparkles, color: "from-pink-500 to-pink-600" },
    { id: "bedding", name: "Bedding", icon: BedDouble, color: "from-purple-500 to-purple-600" },
  ];

  const categoryItems: Record<string, { id: string; name: string; price: number }[]> = {
    "womens-wear": [
      { id: "blouse", name: "Blouse", price: 30 },
      { id: "sweater", name: "Sweater", price: 150 },
      { id: "top-regular", name: "Top (Regular)", price: 30 },
      { id: "saree", name: "Saree", price: 75 },
      { id: "socks", name: "Socks", price: 30 },
      { id: "salwar", name: "Salwar", price: 30 },
      { id: "shirt-tshirt", name: "Shirt/T-shirt", price: 30 },
      { id: "pant", name: "Pant", price: 30 },
      { id: "top-long", name: "Top (Long)", price: 30 },
      { id: "frock-skirt", name: "Frock/Skirt", price: 30 },
      { id: "kameez", name: "Kameez", price: 30 },
    ],
    "mens-wear": [
      { id: "shorts", name: "Shorts", price: 30 },
      { id: "socks", name: "Socks", price: 30 },
      { id: "kurta", name: "Kurta", price: 30 },
      { id: "sweater", name: "Sweater", price: 60 },
      { id: "lungi-dhoti", name: "Lungi/Dhoti", price: 50 },
      { id: "shirt-tshirt", name: "Shirt/Tshirt", price: 30 },
      { id: "pant-trouser", name: "Pant/Trouser", price: 30 },
      { id: "pyjama", name: "Pyjama", price: 30 },
    ],
    "bedding": [
      { id: "towel-hand", name: "Towel - Hand", price: 30 },
      { id: "quilt-double", name: "Quilt - Double", price: 300 },
      { id: "pillow-cover", name: "Pillow Cover", price: 20 },
      { id: "bed-sheet-single", name: "Bed Sheet - Single", price: 50 },
      { id: "bedsheet-double", name: "Bedsheet - Double", price: 100 },
      { id: "quilt-single", name: "Quilt - Single", price: 150 },
      { id: "hanky", name: "Hanky", price: 10 },
      { id: "blanket-single", name: "Blanket - Single", price: 150 },
      { id: "towel-bath", name: "Towel - Bath", price: 30 },
      { id: "blanket-double", name: "Blanket - Double", price: 300 },
    ],
    "others": [
      { id: "curtain", name: "Curtain", price: 50 },
      { id: "table-cloth", name: "Table Cloth", price: 40 },
      { id: "cushion-cover", name: "Cushion Cover", price: 20 },
      { id: "napkin", name: "Napkin", price: 15 },
    ],
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep("items");
  };

  const addToCart = (item: { id: string; name: string; price: number }) => {
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

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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

    if (!userId) {
      toast.error("Please log in to submit an order");
      navigate("/auth");
      return;
    }

    if (!formData.studentId || !formData.studentName || !formData.mobileNo) {
      toast.error("Please fill all fields");
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.mobileNo)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (cart.length === 0) {
      toast.error("Please add items to cart");
      return;
    }

    // Check total items limit (6 per day)
    const totalItems = getTotalItems();
    if (totalItems > 6) {
      toast.error("Maximum 6 items allowed per day");
      return;
    }

    // Check day restrictions based on gender
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    if (today === 0) {
      toast.error("Laundry collection is not available on Sunday");
      return;
    }

    if (!profile?.gender) {
      toast.error("Please update your gender in profile settings");
      navigate("/profile");
      return;
    }

    if (profile.gender === "male") {
      // Boys: Monday (1), Wednesday (3), Friday (5)
      if (![1, 3, 5].includes(today)) {
        toast.error("Boys can only submit laundry on Monday, Wednesday, and Friday");
        return;
      }
    } else if (profile.gender === "female") {
      // Girls: Tuesday (2), Thursday (4), Saturday (6)
      if (![2, 4, 6].includes(today)) {
        toast.error("Girls can only submit laundry on Tuesday, Thursday, and Saturday");
        return;
      }
    }

    setLoading(true);

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          order_number: orderNumber,
          customer_name: formData.studentName,
          customer_phone: formData.mobileNo,
          customer_email: profile?.email || null,
          student_id: formData.studentId,
          room_number: profile?.room_number || null,
          status: "pending",
          payment_status: "pending",
          total_amount: getTotalPrice(),
          notes: `Category: ${selectedCategory}`,
        })
        .select()
        .single();

      if (orderError) {
        console.error("Order creation error:", orderError);
        throw new Error("Failed to create order");
      }

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        service_name: "Regular Wash",
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items error:", itemsError);
        await supabase.from("orders").delete().eq("id", order.id);
        throw new Error("Failed to add items to order");
      }

      toast.success("Order submitted successfully!", {
        description: `Order #${orderNumber}. Delivery QR: ${order.delivery_qr_code}`,
        icon: <QrCode className="w-4 h-4" />,
      });

      navigate("/orders");

      // Reset form
      setStep("category");
      setSelectedCategory("");
      setCart([]);
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Failed to submit order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getItemEmoji = (itemId: string) => {
    if (itemId.includes("socks")) return "🧦";
    if (itemId.includes("lungi") || itemId.includes("dhoti")) return "🩳";
    if (itemId.includes("pant") || itemId.includes("trouser")) return "👖";
    if (itemId.includes("shorts")) return "🩳";
    if (itemId.includes("shirt") || itemId.includes("tshirt")) return "👕";
    if (itemId.includes("sweater")) return "🧥";
    if (itemId.includes("saree")) return "🥻";
    if (itemId.includes("blouse")) return "👚";
    if (itemId.includes("top")) return "👚";
    if (itemId.includes("salwar") || itemId.includes("kameez")) return "🥻";
    if (itemId.includes("frock") || itemId.includes("skirt")) return "👗";
    if (itemId.includes("kurta")) return "👔";
    if (itemId.includes("pyjama")) return "🩱";
    if (itemId.includes("towel")) return "🧖";
    if (itemId.includes("quilt") || itemId.includes("blanket")) return "🛏️";
    if (itemId.includes("pillow")) return "🛏️";
    if (itemId.includes("bed") || itemId.includes("sheet")) return "🛏️";
    if (itemId.includes("hanky")) return "🧻";
    if (itemId.includes("curtain")) return "🪟";
    if (itemId.includes("table-cloth")) return "🍽️";
    if (itemId.includes("cushion")) return "🛋️";
    if (itemId.includes("napkin")) return "🧻";
    return "👕";
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
          <button
            onClick={() => setStep("category")}
            className={`w-3 h-3 rounded-full transition-all hover:scale-125 ${step === "category" ? "bg-primary" : "bg-muted hover:bg-muted/80"}`}
            aria-label="Go to category selection"
          />
          <button
            onClick={() => selectedCategory && setStep("items")}
            disabled={!selectedCategory}
            className={`w-3 h-3 rounded-full transition-all ${selectedCategory ? "hover:scale-125 cursor-pointer" : "cursor-not-allowed opacity-50"} ${step === "items" ? "bg-primary" : "bg-muted hover:bg-muted/80"}`}
            aria-label="Go to item selection"
          />
          <button
            onClick={() => cart.length > 0 && setStep("checkout")}
            disabled={cart.length === 0}
            className={`w-3 h-3 rounded-full transition-all ${cart.length > 0 ? "hover:scale-125 cursor-pointer" : "cursor-not-allowed opacity-50"} ${step === "checkout" ? "bg-primary" : "bg-muted hover:bg-muted/80"}`}
            aria-label="Go to checkout"
          />
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
                        <span className="text-2xl">{getItemEmoji(item.id)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">₹{item.price}</p>
                      </div>
                    </div>
                    {cartItem ? (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9" 
                          onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9" 
                          onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9" 
                        onClick={() => addToCart(item)}
                      >
                        +
                      </Button>
                    )}
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
                    <p className="text-sm text-muted-foreground">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>
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
              <div className="pt-3 border-t border-border mt-3">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg">Total Amount:</p>
                  <p className="font-bold text-xl text-primary">₹{getTotalPrice()}</p>
                </div>
              </div>
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
