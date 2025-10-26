import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminReceiveScanner = () => {
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
        // Check if this is a new order QR code (starts with ORD-)
        if (decodedText.startsWith("ORD-")) {
          console.log("=== QR CODE SCANNED ===");
          console.log("Raw QR Code:", decodedText);
          
          // Extract user_id from QR code (format: ORD-timestamp-uuid)
          // UUID contains dashes, so we need to rejoin everything after the second dash
          const parts = decodedText.split("-");
          console.log("Split parts:", parts);
          console.log("Parts count:", parts.length);
          
          // Should be: ['ORD', 'timestamp', 'uuid-part1', 'uuid-part2', 'uuid-part3', 'uuid-part4', 'uuid-part5']
          if (parts.length < 7) {
            toast.error("Invalid QR code format. Please generate a new QR code from checkout.");
            setLoading(false);
            setTimeout(() => {
              scanner.render(onScanSuccess, () => {});
            }, 2000);
            return;
          }
          
          const userId = parts.slice(2).join("-"); // Rejoin UUID parts
          
          console.log("Extracted User ID:", userId);
          console.log("User ID length:", userId.length);
          
          // Fetch user's profile to get order details
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          console.log("Profile lookup result:", { profile, profileError });

          if (profileError) {
            console.error("Database error:", profileError);
            toast.error("Database error: " + profileError.message);
            setLoading(false);
            setTimeout(() => {
              scanner.render(onScanSuccess, () => {});
            }, 2000);
            return;
          }

          if (!profile) {
            toast.error(`Customer not found for ID: ${userId.substring(0, 8)}...`);
            console.error("No profile found for user_id:", userId);
            setLoading(false);
            setTimeout(() => {
              scanner.render(onScanSuccess, () => {});
            }, 2000);
            return;
          }

          // Show confirmation dialog
          const confirmed = window.confirm(
            `Accept laundry from ${profile.student_name}?\n` +
            `Student ID: ${profile.student_id}\n` +
            `Room: ${profile.room_number}\n\n` +
            `Note: Order details will be recorded.`
          );

          if (!confirmed) {
            setLoading(false);
            setTimeout(() => {
              scanner.render(onScanSuccess, () => {});
            }, 2000);
            return;
          }

          // Create a placeholder order (items will be added later by customer)
          const orderNumber = `LND${Date.now().toString().slice(-8)}`;
          const { data: { user: adminUser } } = await supabase.auth.getUser();
          
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
              user_id: userId,
              order_number: orderNumber,
              customer_name: profile.student_name,
              customer_phone: profile.mobile_no,
              customer_email: profile.email,
              student_id: profile.student_id,
              room_number: profile.room_number,
              total_amount: 0, // Will be updated when items are added
              status: "received",
              payment_method: "cash",
              payment_status: "pending",
              delivery_qr_code: decodedText,
              received_at: new Date().toISOString(),
              scanned_by: adminUser?.id,
            })
            .select()
            .single();

          if (orderError) {
            console.error("Failed to create order:", orderError);
            toast.error("Failed to create order");
            setLoading(false);
            setTimeout(() => {
              scanner.render(onScanSuccess, () => {});
            }, 2000);
            return;
          }

          toast.success(`✅ Laundry received from ${profile.student_name}!\nOrder: ${orderNumber}`);
          setLoading(false);
          setTimeout(() => {
            scanner.render(onScanSuccess, () => {});
          }, 2000);
          return;
        }
        
        // Check if this is a pickup token (starts with PKP-)
        if (!decodedText.startsWith("PKP-")) {
          toast.error("Invalid QR code. Please scan a valid order or pickup QR code.");
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
            Receive Laundry from Students
          </h1>
          <p className="text-muted-foreground">
            Scan customer's order QR (ORD-) to accept laundry or pickup QR (PKP-) to complete delivery
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

export default AdminReceiveScanner;
