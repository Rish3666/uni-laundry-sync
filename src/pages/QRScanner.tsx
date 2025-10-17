import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const QRScanner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    const onScanSuccess = async (decodedText: string) => {
      setLoading(true);
      scanner.clear();
      
      try {
        // Find user by QR code
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("user_id, student_name, customer_number")
          .eq("qr_code", decodedText)
          .maybeSingle();

        if (error || !profile) {
          toast.error("Invalid QR code or customer not found");
          setLoading(false);
          return;
        }

        // Sign in the user (this is simplified - in production you'd want more secure auth)
        toast.success(`Welcome ${profile.student_name}!`);
        navigate("/");
      } catch (error) {
        console.error("QR scan error:", error);
        toast.error("Failed to process QR code");
      } finally {
        setLoading(false);
      }
    };

    scanner.render(onScanSuccess, (error) => {
      // Ignore continuous scanning errors
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SmartWash
          </h1>
          <p className="text-muted-foreground">Scan your QR code to get started</p>
        </div>

        <div className="bg-card rounded-lg p-4 shadow-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Processing...</p>
            </div>
          ) : (
            <div id="qr-reader" className="w-full"></div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline text-sm"
          >
            Don't have a QR code? Sign up here
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
