import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
}

const ItemSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get("service") || "laundry";
  const category = searchParams.get("category") || "others";
  const [cart, setCart] = useState<CartItem[]>([]);

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

  const items = categoryItems[category] || [];

  const addToCart = (item: { id: string; name: string }) => {
    const existingItem = cart.find((i) => i.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error("Please add items to cart");
      return;
    }
    // Navigate to order summary or checkout
    navigate("/checkout", { 
      state: { cart, serviceType, category }
    });
  };

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      "womens-wear": "Women's Wear",
      "mens-wear": "Men's Wear",
      "bedding": "Bedding",
      "others": "Others",
    };
    return names[cat] || cat;
  };

  return (
    <div className="min-h-screen pb-32 animate-fade-in">
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
            <h1 className="text-lg font-semibold">{getCategoryName(category)}</h1>
            <p className="text-sm text-muted-foreground capitalize">
              {serviceType.replace("-", " ")}
            </p>
          </div>
          {getTotalItems() > 0 && (
            <Badge className="bg-primary text-primary-foreground">
              {getTotalItems()} items
            </Badge>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        {items.map((item) => {
          const cartItem = cart.find((i) => i.id === item.id);
          return (
            <Card
              key={item.id}
              className="p-4 flex items-center justify-between hover:shadow-soft transition-all duration-200 border border-border/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <span className="text-2xl">👕</span>
                </div>
                <div>
                  <h3 className="font-medium text-base">{item.name}</h3>
                  {cartItem && (
                    <p className="text-sm text-muted-foreground">
                      Qty: {cartItem.quantity}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => addToCart(item)}
                size="sm"
                className="rounded-full"
              >
                Add
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <Button
              onClick={handleProceedToCheckout}
              className="w-full h-14 bg-gradient-primary text-lg font-semibold shadow-elevated"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Proceed with {getTotalItems()} items
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemSelection;
