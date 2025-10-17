import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

interface Item {
  id: string;
  name: string;
  emoji: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  slug: string;
}

interface ServiceType {
  id: string;
  name: string;
  emoji: string;
}

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("men");
  const [selectedService, setSelectedService] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes, serviceTypesRes] = await Promise.all([
        supabase.from("categories").select("*").order("display_order"),
        supabase.from("items").select("*").order("display_order"),
        supabase.from("service_types").select("*").order("display_order"),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
      if (serviceTypesRes.data) {
        setServiceTypes(serviceTypesRes.data);
        setSelectedService(serviceTypesRes.data[0]?.id || "");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: Item) => {
    if (!selectedService) {
      toast.error("Please select a service type");
      return;
    }

    const serviceType = serviceTypes.find(s => s.id === selectedService);
    const cartItemId = `${item.id}-${selectedService}`;
    
    const existingItem = cart.find(i => i.id === cartItemId);
    
    if (existingItem) {
      setCart(cart.map(i => 
        i.id === cartItemId 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        itemId: item.id,
        name: item.name,
        emoji: item.emoji,
        category: categories.find(c => c.id === item.category_id)?.name || "",
        serviceType: serviceType?.name || "",
        quantity: 1,
        price: 50, // Default price - should fetch from item_prices
      };
      setCart([...cart, newItem]);
    }
    
    toast.success(`Added ${item.name} to cart`);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === cartItemId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(cart.filter(item => item.id !== cartItemId));
    toast.success("Item removed from cart");
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    navigate("/checkout");
  };

  const filteredItems = items.filter(item => {
    const category = categories.find(c => c.id === item.category_id);
    return category?.slug === selectedCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-primary shadow-elevated">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-primary-foreground">SmartWash</h1>
          <p className="text-primary-foreground/80 text-sm">Select items & service</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Service Type Selection */}
        <div className="bg-card rounded-lg p-4 shadow-card space-y-3">
          <h3 className="font-semibold text-card-foreground">Select Service</h3>
          <div className="flex gap-2 flex-wrap">
            {serviceTypes.map(service => (
              <Button
                key={service.id}
                variant={selectedService === service.id ? "default" : "outline"}
                onClick={() => setSelectedService(service.id)}
                className="flex-1 min-w-[120px]"
              >
                <span className="mr-2">{service.emoji}</span>
                {service.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="men">👦 Boys/Men</TabsTrigger>
            <TabsTrigger value="women">👧 Girls/Women</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-3 mt-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-card rounded-lg p-4 shadow-card hover:shadow-elevated transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.emoji}</span>
                    <div>
                      <h4 className="font-medium text-card-foreground">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">₹50 per item</p>
                    </div>
                  </div>
                  <Plus className="w-6 h-6 text-primary" />
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Cart Items */}
        {cart.length > 0 && (
          <div className="bg-card rounded-lg p-4 shadow-elevated space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Your Cart ({getTotalItems()} items)
              </h3>
            </div>

            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.serviceType}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-background rounded-full px-2 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, -1);
                        }}
                        className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded-full"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold min-w-[20px] text-center">{item.quantity}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, 1);
                        }}
                        className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded-full"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.id);
                      }}
                      className="text-destructive hover:bg-destructive/10 p-2 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Checkout Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleCheckout}
              className="w-full h-14 text-lg font-semibold shadow-elevated"
              size="lg"
            >
              <span className="flex items-center justify-between w-full">
                <span>Proceed to Checkout</span>
                <span className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-base">
                    ₹{getTotalAmount()}
                  </Badge>
                  <ArrowRight className="w-5 h-5" />
                </span>
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
