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
      bgColor: "bg-muted",
    },
    {
      id: "mens-wear",
      name: "Men's Wear",
      icon: User,
      bgColor: "bg-primary/20",
    },
    {
      id: "womens-wear",
      name: "Women's Wear",
      icon: Users,
      bgColor: "bg-secondary/60",
    },
    {
      id: "bedding",
      name: "Bedding",
      icon: Bed,
      bgColor: "bg-accent/40",
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
                className="p-6 cursor-pointer hover:shadow-soft transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/30"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className={`w-20 h-20 rounded-3xl ${category.bgColor} flex items-center justify-center`}>
                    <Icon className="w-10 h-10 text-foreground/80" />
                  </div>
                  <h3 className="font-semibold text-center text-base">{category.name}</h3>
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
