import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Search, QrCode, Package, CheckCircle2 } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  room_number: string;
  total_amount: number;
  status: string;
  batch_number: number;
  batch_status: string;
  received_at: string | null;
  created_at: string;
}

interface Batch {
  batch_number: number;
  orders: Order[];
  batch_status: string;
  total_orders: number;
}

const AdminBatches = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
      return;
    }
    if (isAdmin) {
      fetchBatches();
    }
  }, [isAdmin, roleLoading, navigate]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("batch_number", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTotalOrders(data?.length || 0);

      // Group orders by batch
      const batchMap = new Map<number, Order[]>();
      data?.forEach((order) => {
        const batchNum = order.batch_number || 0;
        if (!batchMap.has(batchNum)) {
          batchMap.set(batchNum, []);
        }
        batchMap.get(batchNum)?.push(order as Order);
      });

      // Convert to array and calculate batch status
      const batchesArray: Batch[] = Array.from(batchMap.entries()).map(
        ([batch_number, orders]) => {
          // Batch status is the most common status among orders
          const statusCounts = orders.reduce((acc, order) => {
            acc[order.batch_status || "pending"] = (acc[order.batch_status || "pending"] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const batch_status = Object.entries(statusCounts).reduce((a, b) =>
            a[1] > b[1] ? a : b
          )[0];

          return {
            batch_number,
            orders,
            batch_status,
            total_orders: orders.length,
          };
        }
      );

      setBatches(batchesArray);
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const markBatchComplete = async (batchNumber: number) => {
    try {
      // Update all orders in the batch
      const { error } = await supabase
        .from("orders")
        .update({ batch_status: "completed" })
        .eq("batch_number", batchNumber);

      if (error) throw error;

      // Send notifications via edge function
      await supabase.functions.invoke("notify-batch-complete", {
        body: { batchNumber },
      });

      toast.success(`Batch ${batchNumber} marked as completed! Notifications sent.`);
      fetchBatches();
    } catch (error) {
      console.error("Error completing batch:", error);
      toast.error("Failed to complete batch");
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === "processing") {
        updates.received_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order status updated");
      fetchBatches();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pending", variant: "secondary" as const, color: "text-yellow-500" };
      case "processing":
        return { label: "In Progress", variant: "default" as const, color: "text-blue-500" };
      case "completed":
        return { label: "Completed", variant: "default" as const, color: "text-green-500" };
      default:
        return { label: status, variant: "outline" as const, color: "text-muted-foreground" };
    }
  };

  const filteredBatches = batches.filter((batch) =>
    batch.orders.some(
      (order) =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_phone.includes(searchQuery)
    )
  );

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Batch Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Total Orders: {totalOrders} | Batches: {batches.length}
            </p>
          </div>
          <Button onClick={() => navigate("/admin/scan")} size="lg">
            <QrCode className="mr-2 h-4 w-4" />
            Scan QR
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by order number, name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-6">
          {filteredBatches.map((batch) => {
            const statusConfig = getStatusConfig(batch.batch_status);
            return (
              <Card key={batch.batch_number} className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Batch {batch.batch_number}
                      </CardTitle>
                      <Badge variant={statusConfig.variant} className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {batch.total_orders} orders
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`batch-${batch.batch_number}`}
                        checked={batch.batch_status === "completed"}
                        onCheckedChange={() => markBatchComplete(batch.batch_number)}
                        disabled={batch.batch_status === "completed"}
                      />
                      <label
                        htmlFor={`batch-${batch.batch_number}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        Mark Complete
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {batch.orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-card/50 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{order.order_number}</span>
                            <Badge variant="outline">{order.status}</Badge>
                            {order.received_at && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer_name} • {order.customer_phone} • Room {order.room_number}
                          </div>
                          <div className="text-sm font-medium mt-1">₹{order.total_amount}</div>
                        </div>
                        <div className="flex gap-2">
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, "processing")}
                            >
                              Mark Received
                            </Button>
                          )}
                          {order.status === "processing" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, "ready")}
                            >
                              Mark Ready
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminBatches;
