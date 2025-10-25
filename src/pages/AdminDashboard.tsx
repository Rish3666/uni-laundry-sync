import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  DollarSign,
  ShieldX,
  ChevronDown,
  ChevronRight,
  LogOut,
  QrCode,
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
  batch_number: number;
  batch_status: string;
  room_number: string;
}

interface BatchGroup {
  batch_number: number;
  orders: Order[];
  batch_status: string;
  total_amount: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [orders, setOrders] = useState<Order[]>([]);
  const [batchGroups, setBatchGroups] = useState<BatchGroup[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    ready: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/admin-login");
  };

  const toggleBatch = (batchNumber: number) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchNumber)) {
      newExpanded.delete(batchNumber);
    } else {
      newExpanded.add(batchNumber);
    }
    setExpandedBatches(newExpanded);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("batch_number", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      calculateStats(data || []);
      groupOrdersByBatch(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const groupOrdersByBatch = (orders: Order[]) => {
    const batchMap = new Map<number, Order[]>();
    
    orders.forEach(order => {
      const batchNum = order.batch_number || 0;
      if (!batchMap.has(batchNum)) {
        batchMap.set(batchNum, []);
      }
      batchMap.get(batchNum)?.push(order);
    });

    const groups: BatchGroup[] = Array.from(batchMap.entries()).map(([batchNum, orders]) => {
      // Determine batch status from most common order batch_status
      const statusCounts = orders.reduce((acc, o) => {
        acc[o.batch_status || "pending"] = (acc[o.batch_status || "pending"] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const batchStatus = Object.entries(statusCounts).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )[0];

      return {
        batch_number: batchNum,
        orders,
        batch_status: batchStatus,
        total_amount: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      };
    });

    // Sort by batch number descending
    groups.sort((a, b) => b.batch_number - a.batch_number);
    setBatchGroups(groups);
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

  const filteredBatches = batchGroups;

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Admin Dashboard</h1>
              <p className="text-primary-foreground/80 text-sm">Manage orders & track batches</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/admin/scan")} variant="secondary" size="lg">
                <QrCode className="mr-2 h-4 w-4" />
                Scan QR
              </Button>
              <Button onClick={handleLogout} variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20" size="lg">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
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

        {/* Batches List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Batches</h2>
          
          {filteredBatches.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No batches found</p>
            </Card>
          ) : (
            filteredBatches.map((batch) => (
              <Card key={batch.batch_number} className="shadow-card overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleBatch(batch.batch_number)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {expandedBatches.has(batch.batch_number) ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Batch {batch.batch_number}
                      </CardTitle>
                      <Badge className={statusColors[batch.batch_status]}>
                        {batch.batch_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{batch.orders.length} orders</span>
                      <span className="font-semibold text-foreground">₹{batch.total_amount}</span>
                    </div>
                  </div>
                </CardHeader>

                {expandedBatches.has(batch.batch_number) && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {batch.orders.map((order) => (
                        <div 
                          key={order.id} 
                          className="p-4 bg-muted/30 rounded-lg border border-border"
                        >
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
                                  <span className="text-muted-foreground">Room:</span>
                                  <p className="font-medium">{order.room_number}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Amount:</span>
                                  <p className="font-medium">₹{order.total_amount}</p>
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
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
