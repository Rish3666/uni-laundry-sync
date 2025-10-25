import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  DollarSign,
  ShieldX,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    ready: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders: Order[]) => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === "pending").length,
      processing: orders.filter(o => o.status === "processing").length,
      ready: orders.filter(o => o.status === "ready").length,
      revenue: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
    };
    setStats(stats);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          ...(newStatus === "ready" && { ready_at: new Date().toISOString() }),
          ...(newStatus === "delivered" && { delivered_at: new Date().toISOString() }),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const filteredOrders = selectedTab === "all" 
    ? orders 
    : orders.filter(o => o.status === selectedTab);

  const statusColors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    processing: "bg-info/10 text-info",
    ready: "bg-success/10 text-success",
    delivered: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-8">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the admin dashboard.
          </p>
          <Button onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-primary shadow-elevated">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-primary-foreground">Admin Dashboard</h1>
          <p className="text-primary-foreground/80 text-sm">Manage orders & track performance</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card rounded-lg p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Package className="w-4 h-4" />
              <span className="text-sm">Total Orders</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>

          <div className="bg-card rounded-lg p-4 shadow-card">
            <div className="flex items-center gap-2 text-warning mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>

          <div className="bg-card rounded-lg p-4 shadow-card">
            <div className="flex items-center gap-2 text-info mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Processing</span>
            </div>
            <p className="text-2xl font-bold">{stats.processing}</p>
          </div>

          <div className="bg-card rounded-lg p-4 shadow-card">
            <div className="flex items-center gap-2 text-success mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Ready</span>
            </div>
            <p className="text-2xl font-bold">{stats.ready}</p>
          </div>

          <div className="bg-card rounded-lg p-4 shadow-card">
            <div className="flex items-center gap-2 text-primary mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Revenue</span>
            </div>
            <p className="text-2xl font-bold">₹{stats.revenue}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="border-b border-border px-4">
              <TabsList className="bg-transparent h-auto p-0 space-x-6">
                <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3">
                  All Orders
                </TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="processing" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3">
                  Processing
                </TabsTrigger>
                <TabsTrigger value="ready" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3">
                  Ready
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={selectedTab} className="m-0">
              <div className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-primary">
                            {order.order_number}
                          </span>
                          <Badge className={statusColors[order.status]}>
                            {order.status}
                          </Badge>
                          <Badge variant="outline">
                            {order.payment_method}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Customer:</span>
                            <p className="font-medium">{order.customer_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <p className="font-medium">{order.customer_phone}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <p className="font-medium">₹{order.total_amount}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <p className="font-medium">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "processing")}
                          >
                            Start Processing
                          </Button>
                        )}
                        {order.status === "processing" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateOrderStatus(order.id, "ready")}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === "ready" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateOrderStatus(order.id, "delivered")}
                          >
                            Mark Delivered
                          </Button>
                        )}
                        {order.status !== "cancelled" && order.status !== "delivered" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No orders found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
