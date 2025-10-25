import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const OrderConfirmScanner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "order-qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );
    scannerRef.current = scanner;

    const onScanSuccess = async (decodedText: string) => {
      setLoading(true);
      scanner.clear();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please log in first");
          navigate("/auth");
          return;
        }

        // Get pending order from localStorage
        const pendingOrderStr = localStorage.getItem("pendingOrder");
        if (!pendingOrderStr) {
          toast.error("No pending order found");
          navigate("/");
          return;
        }

        const pendingOrder = JSON.parse(pendingOrderStr);

        // Verify QR code matches
        if (pendingOrder.delivery_qr_code !== decodedText) {
          toast.error("QR code doesn't match your order");
          setLoading(false);
          return;
        }

        // Verify user matches
        if (pendingOrder.user_id !== user.id) {
          toast.error("This order belongs to a different user");
          setLoading(false);
          return;
        }

        // Now insert order into database
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: pendingOrder.user_id,
            order_number: pendingOrder.order_number,
            customer_name: pendingOrder.customer_name,
            customer_phone: pendingOrder.customer_phone,
            customer_email: pendingOrder.customer_email,
            student_id: pendingOrder.student_id,
            room_number: pendingOrder.room_number,
            total_amount: pendingOrder.total_amount,
            status: "pending",
            payment_method: pendingOrder.payment_method,
            payment_status: pendingOrder.payment_status,
            delivery_qr_code: pendingOrder.delivery_qr_code,
            received_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (orderError) {
          toast.error("Failed to create order");
          console.error(orderError);
          setLoading(false);
          return;
        }

        // Insert order items
        const orderItems = pendingOrder.cart.map((item: any) => ({
          order_id: order.id,
          item_id: item.itemId,
          service_type_id: item.id.split("-")[1],
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          service_name: item.serviceType,
          item_name: item.name,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) {
          console.error("Error inserting order items:", itemsError);
        }

        // Call submit-order edge function
        const { error: functionError } = await supabase.functions.invoke("submit-order", {
          body: { orderId: order.id },
        });

        if (functionError) {
          console.error("Error calling submit-order:", functionError);
        }

        // Clear cart and pending order
        localStorage.removeItem("cart");
        localStorage.removeItem("pendingOrder");

        toast.success("Order confirmed successfully!");
        navigate("/orders");
      } catch (error) {
        console.error("QR scan error:", error);
        toast.error("Failed to process QR code");
        setLoading(false);
      }
    };

    scanner.render(onScanSuccess, (error) => {
      // Ignore continuous scanning errors
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-gradient-primary shadow-elevated">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")} 
            className="rounded-full text-primary-foreground hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-primary-foreground">Confirm Order</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Scan the QR code shown on checkout to confirm your order</p>
          </div>

          <div className="bg-card rounded-lg p-4 shadow-card">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Confirming order...</p>
              </div>
            ) : (
              <div id="order-qr-reader" className="w-full"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmScanner;
