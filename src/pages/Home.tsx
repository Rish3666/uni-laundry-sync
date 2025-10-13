import { useNavigate } from "react-router-dom";
import { Shirt, Wind, Sparkles, Package } from "lucide-react";
import { Card } from "@/components/ui/card";

const Home = () => {
  const navigate = useNavigate();

  const services = [
    {
      id: "laundry",
      name: "Laundry",
      icon: Shirt,
      description: "Wash & fold service",
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "pressing",
      name: "Pressing",
      icon: Wind,
      description: "Iron and press",
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "dry-cleaning",
      name: "Dry Cleaning",
      icon: Sparkles,
      description: "Professional dry clean",
      color: "from-purple-500 to-purple-600",
    },
  ];

  const handleServiceClick = (serviceId: string) => {
    navigate(`/categories?service=${serviceId}`);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] p-4 pb-24 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            UniLaundry Manager
          </h1>
          <p className="text-muted-foreground">
            Quick and easy laundry orders for students
          </p>
        </div>

        {/* Quick Start Card */}
        <Card className="p-6 bg-gradient-primary text-white shadow-elevated border-0">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Welcome!</h2>
            <p className="text-white/90 text-sm">
              Select a service below to start your laundry order
            </p>
          </div>
        </Card>

        {/* Service Selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Select Service Type</h3>
          <div className="grid grid-cols-1 gap-3">{services.map((service) => {
              const Icon = service.icon;
              return (
                <Card
                  key={service.id}
                  className="p-5 cursor-pointer hover:shadow-elevated transition-all hover:scale-[1.02] border-2 border-transparent hover:border-primary"
                  onClick={() => handleServiceClick(service.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-base">{service.name}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <Card className="p-4 bg-gradient-card shadow-card">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-primary">5</p>
              <p className="text-xs text-muted-foreground mt-1">Active</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-success">12</p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-warning">2</p>
              <p className="text-xs text-muted-foreground mt-1">Ready</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;
