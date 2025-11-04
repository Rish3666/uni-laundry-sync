import { useState, useEffect } from "react";
import { Sparkles, Shirt, BedDouble, ShoppingCart, Loader2, Trash2, QrCode } from "lucide-react";
import kurtaIcon from "@/assets/icons/kurta.png";
import lungiIcon from "@/assets/icons/lungi.png";
import pyjamaIcon from "@/assets/icons/pyjama.png";
import blouseIcon from "@/assets/icons/blouse.png";
import salwarIcon from "@/assets/icons/salwar.png";
import handTowelIcon from "@/assets/icons/hand-towel.png";
import quiltDoubleIcon from "@/assets/icons/quilt-double.png";
import pillowIcon from "@/assets/icons/pillow.png";
import quiltSingleIcon from "@/assets/icons/quilt-single.png";
import hankyIcon from "@/assets/icons/hanky.png";
import blanketSingleIcon from "@/assets/icons/blanket-single.png";
import bathTowelIcon from "@/assets/icons/bath-towel.png";
import blanketDoubleIcon from "@/assets/icons/blanket-double.png";
import kameezIcon from "@/assets/icons/kameez.png";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { orderFormSchema } from "@/lib/validation";
import { isPublicHoliday, getHolidayName } from "@/lib/holidays";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

type Step = "category" | "items" | "checkout";

const Index = () => {
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

    // Validate form data using zod schema
    const validation = orderFormSchema.safeParse(formData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    if (cart.length === 0) {
      toast.error("Please add items to cart");
      return;
    }

    // Check for public holidays
    const currentDate = new Date();
    if (isPublicHoliday(currentDate)) {
      const holidayName = getHolidayName(currentDate);
      toast.error(`Orders are not accepted on ${holidayName}. Please try again on the next working day.`);
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

    // Save cart and navigate to checkout
    localStorage.setItem("cart", JSON.stringify(cart.map(item => ({
      id: item.id,
      itemId: item.id,
      name: item.name,
      emoji: "👕", // Default emoji
      category: selectedCategory,
      serviceType: "Regular Wash",
      quantity: item.quantity,
      price: item.price,
    }))));
    
    navigate("/checkout");
    
    // Reset form
    setStep("category");
    setSelectedCategory("");
    setCart([]);
  };

  const getItemIcon = (itemId: string) => {
    // Custom icons for specific items
    if (itemId === "kurta") return kurtaIcon;
    if (itemId === "lungi-dhoti") return lungiIcon;
    if (itemId === "pyjama") return pyjamaIcon;
    if (itemId === "blouse") return blouseIcon;
    if (itemId === "salwar") return salwarIcon;
    if (itemId === "towel-hand") return handTowelIcon;
    if (itemId === "quilt-double") return quiltDoubleIcon;
    if (itemId === "pillow-cover") return pillowIcon;
    if (itemId === "quilt-single") return quiltSingleIcon;
    if (itemId === "hanky") return hankyIcon;
    if (itemId === "blanket-single") return blanketSingleIcon;
    if (itemId === "towel-bath") return bathTowelIcon;
    if (itemId === "blanket-double") return blanketDoubleIcon;
    if (itemId === "kameez") return kameezIcon;
    
    // Fallback to emojis for items without custom icons
    if (itemId.includes("socks")) return "🧦";
    if (itemId.includes("pant") || itemId.includes("trouser")) return "👖";
    if (itemId.includes("shorts")) return "🩳";
    if (itemId.includes("shirt") || itemId.includes("tshirt")) return "👕";
    if (itemId.includes("sweater")) return "🧥";
    if (itemId.includes("saree")) return "🥻";
    if (itemId.includes("top")) return "👚";
    if (itemId.includes("frock") || itemId.includes("skirt")) return "👗";
    if (itemId.includes("bed") || itemId.includes("sheet")) return "🛏️";
    return "👕";
  };

  const items = categoryItems[selectedCategory] || [];

  return (
    <div className="min-h-[calc(100vh-8rem)] p-4 pb-24 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SpinSync
          </h1>
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
                      <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center overflow-hidden">
                        {typeof getItemIcon(item.id) === 'string' && getItemIcon(item.id).startsWith('/') || typeof getItemIcon(item.id) !== 'string' ? (
                          <img src={getItemIcon(item.id)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{getItemIcon(item.id)}</span>
                        )}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">₹{getTotalPrice()}</span>
              </div>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Card className="p-4 space-y-4">
                <h3 className="font-semibold">Student Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="Enter your student ID"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name *</Label>
                  <Input
                    id="studentName"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNo">Mobile Number *</Label>
                  <Input
                    id="mobileNo"
                    type="tel"
                    value={formData.mobileNo}
                    onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                    placeholder="Enter your 10-digit mobile number"
                    required
                  />
                </div>
              </Card>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep("items")} 
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-gradient-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Submit Order
                    </>
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

export default Index;
