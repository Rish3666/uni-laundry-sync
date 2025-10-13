import { useState } from "react";
import { Plus, Shirt, Wind, Sparkles, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import OrderModal from "@/components/OrderModal";

const Home = () => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const services = [
    {
      id: "wash",
      name: "Wash & Fold",
      icon: Shirt,
      description: "Regular washing and folding",
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "dry-clean",
      name: "Dry Cleaning",
      icon: Sparkles,
      description: "Professional dry cleaning",
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "iron",
      name: "Ironing",
      icon: Wind,
      description: "Press and iron only",
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "full-service",
      name: "Full Service",
      icon: Package,
      description: "Complete care package",
      color: "from-green-500 to-green-600",
    },
  ];

  const handleServiceClick = (serviceId: string) => {
    setSelectedService(serviceId);
    setShowOrderModal(true);
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

        {/* Quick Order Button */}
        <Card className="p-6 bg-gradient-primary text-white shadow-elevated border-0 cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => setShowOrderModal(true)}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">New Order</h2>
              <p className="text-white/90 text-sm">Start a laundry request</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Plus className="w-7 h-7" />
            </div>
          </div>
        </Card>

        {/* Service Categories */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Select Service</h3>
          <div className="grid grid-cols-2 gap-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card
                  key={service.id}
                  className="p-4 cursor-pointer hover:shadow-elevated transition-all hover:scale-[1.02] border-2 border-transparent hover:border-primary"
                  onClick={() => handleServiceClick(service.id)}
                >
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{service.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
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

      <OrderModal 
        open={showOrderModal} 
        onClose={() => {
          setShowOrderModal(false);
          setSelectedService(null);
        }}
        defaultService={selectedService}
      />
    </div>
  );
};

export default Home;
