import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminPickupScanner = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
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
        if (!decodedText.startsWith("PKP-")) {
          toast.error("Invalid pickup token. Please scan a pickup QR code.");
          setLoading(false);
          setTimeout(() => {
            scanner.render(onScanSuccess, () => {});
          }, 2000);
          return;
        }

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
          toast.success(`Order ${data.order.order_number} completed! ✅\nCustomer: ${data.order.customer_name}`);
          setLoading(false);
          setTimeout(() => {
            scanner.render(onScanSuccess, () => {});
          }, 2000);
        }
      } catch (error) {
        console.error("QR scan error:", error);
        toast.error("Failed to process QR code");
        setLoading(false);
        setTimeout(() => {
          scanner.render(onScanSuccess, () => {});
        }, 2000);
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
            Scan Pickup QR Code
          </h1>
          <p className="text-muted-foreground">
            Scan student's pickup QR code to complete order
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-card p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Processing...</p>
            </div>
          ) : (
            <div id="qr-reader" className="w-full"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPickupScanner;
