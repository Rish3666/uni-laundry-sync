import { useState } from "react";
import { Search, QrCode, Clock, CheckCircle2, Loader2, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  studentId: string;
  studentName: string;
  mobileNo: string;
  laundryType: string;
  quantity: number;
  inTime: string;
  outTime: string | null;
  status: "submitted" | "processing" | "ready" | "completed";
}

const mockOrders: Order[] = [
  {
    id: "ORD-1001",
    studentId: "CS-2025-001",
    studentName: "Rahul Kumar",
    mobileNo: "98XXXX5678",
    laundryType: "Wash & Fold",
    quantity: 5,
    inTime: "2:30 PM",
    outTime: null,
    status: "processing",
  },
  {
    id: "ORD-1002",
    studentId: "CS-2025-001",
    studentName: "Rahul Kumar",
    mobileNo: "98XXXX5678",
    laundryType: "Dry Cleaning",
    quantity: 2,
    inTime: "10:15 AM",
    outTime: "4:45 PM",
    status: "ready",
  },
  {
    id: "ORD-1003",
    studentId: "CS-2025-001",
    studentName: "Rahul Kumar",
    mobileNo: "98XXXX5678",
    laundryType: "Ironing",
    quantity: 3,
    inTime: "Yesterday 3:00 PM",
    outTime: "Yesterday 5:30 PM",
    status: "completed",
  },
];

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [orders] = useState<Order[]>(mockOrders);

  const getStatusConfig = (status: Order["status"]) => {
    switch (status) {
      case "submitted":
        return { label: "Submitted", variant: "default" as const, icon: Package, color: "text-info" };
      case "processing":
        return { label: "Processing", variant: "secondary" as const, icon: Loader2, color: "text-warning" };
      case "ready":
        return { label: "Ready", variant: "default" as const, icon: CheckCircle2, color: "text-success" };
      case "completed":
        return { label: "Completed", variant: "outline" as const, icon: CheckCircle2, color: "text-muted-foreground" };
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-8rem)] p-4 pb-24 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">My Orders</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID or Status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No orders found</p>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card
                  key={order.id}
                  className="p-4 hover:shadow-elevated transition-all cursor-pointer border-l-4"
                  style={{ 
                    borderLeftColor: order.status === "ready" ? "hsl(var(--success))" :
                                    order.status === "processing" ? "hsl(var(--warning))" :
                                    order.status === "completed" ? "hsl(var(--muted-foreground))" :
                                    "hsl(var(--info))"
                  }}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{order.id}</h3>
                        <p className="text-sm text-muted-foreground">{order.studentId}</p>
                      </div>
                      <Badge variant={statusConfig.variant} className="gap-1.5">
                        <StatusIcon className={`w-3.5 h-3.5 ${order.status === "processing" ? "animate-spin" : ""}`} />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Service</p>
                        <p className="font-medium">{order.laundryType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Quantity</p>
                        <p className="font-medium">{order.quantity} items</p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-4 text-sm bg-secondary/50 rounded-lg p-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">In:</span>
                        <span className="font-medium">{order.inTime}</span>
                      </div>
                      {order.outTime && (
                        <>
                          <div className="w-px h-4 bg-border" />
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Out:</span>
                            <span className="font-medium">{order.outTime}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    {order.status === "ready" && (
                      <Button variant="outline" className="w-full" size="sm">
                        <QrCode className="w-4 h-4 mr-2" />
                        View QR Code
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
