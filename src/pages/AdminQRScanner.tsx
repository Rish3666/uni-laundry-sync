import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminQRScanner = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<any>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
      return;
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
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
      scanner.clear().catch(console.error);

      try {
        // Check if this is a pickup token (starts with PKP-)
        if (decodedText.startsWith("PKP-")) {
          // Call edge function to redeem pickup token
          const { data, error } = await supabase.functions.invoke("redeem-pickup-token", {
            body: { token: decodedText }
          });

          if (error) {
            console.error("Edge function error:", error);
            toast.error(error.message || "Failed to redeem pickup token");
            setLoading(false);
            setTimeout(() => {
              scanner.render(onScanSuccess, () => {});
            }, 2000);
            return;
          }

          if (data?.success) {
            toast.success(`Order ${data.order.order_number} completed! ✅`);
            setLoading(false);
            setTimeout(() => {
              scanner.render(onScanSuccess, () => {});
            }, 2000);
          }
          return;
        }

        // Otherwise, treat as delivery QR code (old flow)
        const { data: order, error } = await supabase
          .from("orders")
          .select("*")
          .eq("delivery_qr_code", decodedText)
          .maybeSingle();

        if (error) {
          console.error("Database error:", error);
          toast.error("Database error");
          setLoading(false);
          setTimeout(() => {
            scanner.render(onScanSuccess, () => {});
          }, 2000);
          return;
        }

        if (!order) {
          toast.error("Invalid QR code");
          setLoading(false);
          setTimeout(() => {
            scanner.render(onScanSuccess, () => {});
          }, 2000);
          return;
        }

        // Check if order is ready for pickup
        if (order.status !== "ready") {
          toast.error(`Order is ${order.status}, not ready for pickup`);
          setLoading(false);
          setTimeout(() => {
            scanner.render(onScanSuccess, () => {});
          }, 2000);
          return;
        }

        setScannedOrder(order);
        toast.success("Valid delivery QR code scanned!");
      } catch (error) {
        console.error("QR scan error:", error);
        toast.error("Failed to process QR code");
        setLoading(false);
      }
    };

    scanner.render(onScanSuccess, () => {});

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isAdmin]);

  const markAsDelivered = async () => {
    if (!scannedOrder) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
          delivered_at: new Date().toISOString(),
          scanned_by: user?.id,
        })
        .eq("id", scannedOrder.id);

      if (error) throw error;

      toast.success("Laundry delivered successfully! ✅");
      setScannedOrder(null);
      setLoading(false);
      
      // Restart scanner
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Scan QR Code
          </h1>
          <p className="text-muted-foreground">
            Scan student's pickup QR code or delivery QR code
          </p>
        </div>

        {scannedOrder ? (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold">{scannedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold text-success">Ready for Pickup</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold">{scannedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{scannedOrder.customer_phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="font-semibold">{scannedOrder.room_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch</p>
                  <p className="font-semibold">Batch {scannedOrder.batch_number}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-semibold text-lg">₹{scannedOrder.total_amount}</p>
              </div>
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-success font-medium">
                  ✅ Valid QR Code - Ready for Delivery
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={markAsDelivered} className="flex-1" size="lg">
                  Confirm Delivery
                </Button>
                <Button variant="outline" onClick={() => setScannedOrder(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">Processing...</p>
                </div>
              ) : (
                <div id="qr-reader" className="w-full"></div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminQRScanner;
