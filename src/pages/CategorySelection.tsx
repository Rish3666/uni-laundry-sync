import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Users, User, Bed, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CategorySelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get("service") || "laundry";

  const categories = [
    {
      id: "others",
      name: "Others",
      icon: Package,
      color: "from-amber-500 to-amber-600",
    },
    {
      id: "mens-wear",
      name: "Men's Wear",
      icon: User,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "womens-wear",
      name: "Women's Wear",
      icon: Users,
      color: "from-pink-500 to-pink-600",
    },
    {
      id: "bedding",
      name: "Bedding",
      icon: Bed,
      color: "from-purple-500 to-purple-600",
    },
  ];

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/items?service=${serviceType}&category=${categoryId}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Select Category</h1>
            <p className="text-sm text-muted-foreground capitalize">{serviceType.replace("-", " ")}</p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="p-0 overflow-hidden cursor-pointer hover:shadow-elevated transition-all hover:scale-[1.02] border-2 border-transparent hover:border-primary"
                onClick={() => handleCategoryClick(category.id)}
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
      </div>
    </div>
  );
};

export default CategorySelection;
