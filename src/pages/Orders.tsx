import { useState, useEffect } from "react";
import { Search, QrCode, Clock, CheckCircle2, Loader2, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  student_id: string;
  status: string;
  created_at: string;
  ready_at: string | null;
  delivered_at: string | null;
  picked_up_at: string | null;
  delivery_qr_code: string;
  pickup_token: string | null;
  order_items: Array<{
    item_name: string;
    quantity: number;
  }>;
}

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [batchInfo, setBatchInfo] = useState<{ batch_number: number; batch_status: string } | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchOrders();

    // Setup real-time subscription
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchOrders(); // Refresh orders on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            item_name,
            quantity
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);

      // Get batch info if there are orders
      if (data && data.length > 0 && data[0].batch_number) {
        setBatchInfo({
          batch_number: data[0].batch_number,
          batch_status: data[0].batch_status || "pending",
        });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { label: "Submitted", variant: "default" as const, icon: Package, color: "text-info" };
      case "processing":
        return { label: "Processing", variant: "secondary" as const, icon: Loader2, color: "text-warning" };
      case "ready":
        return { label: "Ready", variant: "default" as const, icon: CheckCircle2, color: "text-success" };
      case "completed":
        return { label: "Completed", variant: "outline" as const, icon: CheckCircle2, color: "text-muted-foreground" };
      default:
        return { label: status, variant: "default" as const, icon: Package, color: "text-info" };
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalItems = (orderItems: Order["order_items"]) => {
    return orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const handleViewQR = (order: Order) => {
    setSelectedOrder(order);
    setShowQR(true);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Separate orders into delivery and pickup
  const deliveryOrders = filteredOrders.filter(o => 
    o.status === "pending" || o.status === "processing"
  );
  const pickupOrders = filteredOrders.filter(o => 
    (o.status === "ready" || o.status === "completed" || o.status === "delivered") && o.pickup_token
  );

  const renderOrderCard = (order: Order, showPickupQR: boolean) => {
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
              <h3 className="font-bold text-lg">{order.order_number}</h3>
              <p className="text-sm text-muted-foreground">{order.student_id || "N/A"}</p>
            </div>
            <Badge variant={statusConfig.variant} className="gap-1.5">
              <StatusIcon className={`w-3.5 h-3.5 ${order.status === "processing" ? "animate-spin" : ""}`} />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Items</p>
              <p className="font-medium">{getTotalItems(order.order_items)} items</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">QR Code</p>
              <p className="font-mono text-xs">
                {showPickupQR && order.pickup_token 
                  ? order.pickup_token 
                  : order.delivery_qr_code}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-4 text-sm bg-secondary/50 rounded-lg p-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Submitted:</span>
              <span className="font-medium">{format(new Date(order.created_at), "MMM d, h:mm a")}</span>
            </div>
            {order.ready_at && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Ready:</span>
                  <span className="font-medium">{format(new Date(order.ready_at), "MMM d, h:mm a")}</span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {showPickupQR && order.pickup_token ? (
            <Button 
              variant="default" 
              className="w-full" 
              size="sm"
              onClick={() => handleViewQR(order)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              View Pickup QR Code
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={() => handleViewQR(order)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              View Delivery QR Code
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] p-4 pb-24 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Batch Info Banner */}
        {batchInfo && (
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Batch</p>
                <p className="text-2xl font-bold">Batch {batchInfo.batch_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={
                  batchInfo.batch_status === "completed" ? "default" : 
                  batchInfo.batch_status === "processing" ? "secondary" : "outline"
                } className="text-sm capitalize">
                  {batchInfo.batch_status}
                </Badge>
              </div>
            </div>
            {batchInfo.batch_status === "completed" && (
              <div className="mt-3 p-3 bg-success/10 border border-success/20 rounded-md">
                <p className="text-sm text-success font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  🎉 Your laundry is ready for pickup!
                </p>
              </div>
            )}
          </Card>
        )}
        
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

        {/* Pickup QR Codes Section */}
        {pickupOrders.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px bg-success/30 flex-1" />
              <h2 className="text-lg font-semibold text-success flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Ready for Pickup
              </h2>
              <div className="h-px bg-success/30 flex-1" />
            </div>
            <p className="text-sm text-muted-foreground text-center mb-2">
              Show the pickup QR code when collecting your laundry
            </p>
            {pickupOrders.map(order => renderOrderCard(order, true))}
          </div>
        )}

        {/* Delivery QR Codes Section */}
        {deliveryOrders.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px bg-border flex-1" />
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                In Progress
              </h2>
              <div className="h-px bg-border flex-1" />
            </div>
            <p className="text-sm text-muted-foreground text-center mb-2">
              Delivery tracking code for your laundry
            </p>
            {deliveryOrders.map(order => renderOrderCard(order, false))}
          </div>
        )}

        {/* No Orders */}
        {filteredOrders.length === 0 && (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No orders found</p>
          </Card>
        )}

        {/* QR Code Dialog */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedOrder?.status === "ready" && selectedOrder?.pickup_token 
                  ? "Pickup QR Code" 
                  : "Delivery QR Code"}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                {selectedOrder.status === "ready" && selectedOrder.pickup_token ? (
                  <>
                    <div className="bg-success/10 p-3 rounded-lg border border-success/20">
                      <p className="text-sm text-success font-medium text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Your laundry is ready for pickup!
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg flex items-center justify-center">
                      <QRCodeSVG 
                        value={selectedOrder.pickup_token} 
                        size={200}
                        level="H"
                        includeMargin
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Number:</span>
                        <span className="font-medium">{selectedOrder.order_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pickup Token:</span>
                        <span className="font-mono text-xs">{selectedOrder.pickup_token}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Student ID:</span>
                        <span className="font-medium">{selectedOrder.student_id}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Show this QR code to collect your laundry
                    </p>
                  </>
                ) : (
                  <>
                    <div className="bg-white p-6 rounded-lg flex items-center justify-center">
                      <QRCodeSVG 
                        value={selectedOrder.delivery_qr_code} 
                        size={200}
                        level="H"
                        includeMargin
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Number:</span>
                        <span className="font-medium">{selectedOrder.order_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">QR Code:</span>
                        <span className="font-mono text-xs">{selectedOrder.delivery_qr_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Student ID:</span>
                        <span className="font-medium">{selectedOrder.student_id}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      This is your delivery tracking code
                    </p>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Orders;
