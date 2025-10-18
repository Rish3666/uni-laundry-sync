import { useState, useEffect } from "react";
import { X, QrCode, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  defaultService?: string | null;
}

const OrderModal = ({ open, onClose, defaultService }: OrderModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    mobileNo: "",
    laundryType: defaultService || "",
    quantity: "1",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!open) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("student_id, student_name, mobile_no")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        if (profile) {
          setFormData(prev => ({
            ...prev,
            studentId: profile.student_id || "",
            studentName: profile.student_name || "",
            mobileNo: profile.mobile_no || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.studentId || !formData.studentName || !formData.mobileNo || !formData.laundryType || !formData.quantity) {
      toast.error("Please fill all fields");
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.mobileNo)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    // Simulate API call (replace with actual n8n webhook)
    setTimeout(() => {
      const orderId = `ORD-${Date.now()}`;
      toast.success("Order submitted successfully!", {
        description: `Order ID: ${orderId}`,
        icon: <QrCode className="w-4 h-4" />,
      });
      setLoading(false);
      onClose();
      // Reset form
      setFormData({
        studentId: "",
        studentName: "",
        mobileNo: "",
        laundryType: "",
        quantity: "1",
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-xl">New Laundry Order</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              placeholder="e.g., CS-2025-001"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentName">Student Name</Label>
            <Input
              id="studentName"
              placeholder="Enter your full name"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobileNo">Mobile Number</Label>
            <Input
              id="mobileNo"
              type="tel"
              placeholder="10-digit mobile number"
              value={formData.mobileNo}
              onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="laundryType">Laundry Type</Label>
            <Select 
              value={formData.laundryType} 
              onValueChange={(value) => setFormData({ ...formData, laundryType: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wash">Wash & Fold</SelectItem>
                <SelectItem value="dry-clean">Dry Cleaning</SelectItem>
                <SelectItem value="iron">Ironing</SelectItem>
                <SelectItem value="full-service">Full Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (Items)</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData({ ...formData, quantity: Math.max(1, parseInt(formData.quantity) - 1).toString() })}
                className="h-11 w-11"
              >
                -
              </Button>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="h-11 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData({ ...formData, quantity: Math.min(100, parseInt(formData.quantity) + 1).toString() })}
                className="h-11 w-11"
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 bg-gradient-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Order"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
