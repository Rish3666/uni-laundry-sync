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
import { Loader2, Search, QrCode, Package, X, LogOut, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  user_id: string;
  profiles?: {
    gender: string;
  };
}

interface Batch {
  batch_number: number;
  orders: Order[];
  batch_status: string;
  total_orders: number;
  date: string;
  gender: string;
}

interface GroupedBatches {
  [date: string]: {
    male: Batch[];
    female: Batch[];
  };
}

const AdminBatches = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [groupedBatches, setGroupedBatches] = useState<GroupedBatches>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<"all" | "male" | "female">("all");
  const [batchToComplete, setBatchToComplete] = useState<number | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/admin-login");
  };

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
        .select(`
          *,
          profiles!orders_user_id_fkey (
            gender
          )
        `)
        .order("batch_number", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTotalOrders(data?.length || 0);

      // Group orders by date and gender, then by batch
      const grouped: GroupedBatches = {};
      
      data?.forEach((order: any) => {
        const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const gender = order.profiles?.gender?.toLowerCase() || "unknown";
        const batchNum = order.batch_number || 0;

        // Initialize date group if not exists
        if (!grouped[orderDate]) {
          grouped[orderDate] = { male: [], female: [] };
        }

        // Find or create batch for this gender
        const genderBatches = gender === "male" ? grouped[orderDate].male : grouped[orderDate].female;
        let batch = genderBatches.find((b) => b.batch_number === batchNum);

        if (!batch) {
          batch = {
            batch_number: batchNum,
            orders: [],
            batch_status: order.batch_status || "pending",
            total_orders: 0,
            date: orderDate,
            gender: gender,
          };
          genderBatches.push(batch);
        }

        batch.orders.push(order);
        batch.total_orders = batch.orders.length;

        // Update batch status based on most common status
        const statusCounts = batch.orders.reduce((acc, o) => {
          acc[o.batch_status || "pending"] = (acc[o.batch_status || "pending"] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        batch.batch_status = Object.entries(statusCounts).reduce((a, b) =>
          a[1] > b[1] ? a : b
        )[0];
      });

      // Sort batches within each gender group
      Object.values(grouped).forEach((dateGroup) => {
        dateGroup.male.sort((a, b) => b.batch_number - a.batch_number);
        dateGroup.female.sort((a, b) => b.batch_number - a.batch_number);
      });

      setGroupedBatches(grouped);
      
      // Set initial selected date to today
      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setSelectedDate(Object.keys(grouped).includes(today) ? today : Object.keys(grouped)[0] || "");
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const confirmMarkBatchComplete = (batchNumber: number) => {
    setBatchToComplete(batchNumber);
  };

  const markBatchComplete = async () => {
    if (!batchToComplete) return;
    
    try {
      // First, ensure all orders in the batch have delivery QR codes
      const { data: ordersToUpdate, error: fetchError } = await supabase
        .from("orders")
        .select("id, delivery_qr_code")
        .eq("batch_number", batchToComplete);

      if (fetchError) throw fetchError;

      // Generate QR codes for orders that don't have them
      for (const order of ordersToUpdate || []) {
        if (!order.delivery_qr_code) {
          const { error: qrError } = await supabase.rpc("generate_delivery_qr_code");
          if (qrError) console.error("Error generating QR:", qrError);
        }
      }

      // Update all orders in the batch to ready status
      const { error } = await supabase
        .from("orders")
        .update({ 
          batch_status: "completed",
          status: "ready",
          ready_at: new Date().toISOString()
        })
        .eq("batch_number", batchToComplete);

      if (error) throw error;

      // Send notifications via edge function
      await supabase.functions.invoke("notify-batch-complete", {
        body: { batchNumber: batchToComplete },
      });

      toast.success(`Batch ${batchToComplete} marked as completed! Notifications sent with QR codes.`);
      setBatchToComplete(null);
      fetchBatches();
    } catch (error) {
      console.error("Error completing batch:", error);
      toast.error("Failed to complete batch");
      setBatchToComplete(null);
    }
  };

  const unmarkBatchComplete = async (batchNumber: number) => {
    try {
      // Revert all orders in the batch back to pending
      const { error } = await supabase
        .from("orders")
        .update({ 
          batch_status: "pending",
          status: "pending",
          ready_at: null
        })
        .eq("batch_number", batchNumber);

      if (error) throw error;

      toast.success(`Batch ${batchNumber} unmarked and reverted to pending.`);
      fetchBatches();
    } catch (error) {
      console.error("Error unmarking batch:", error);
      toast.error("Failed to unmark batch");
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

  // Get batches for selected date and gender
  const getDisplayBatches = () => {
    if (!selectedDate || !groupedBatches[selectedDate]) return [];
    
    const dateGroup = groupedBatches[selectedDate];
    let batches: Batch[] = [];

    if (selectedGender === "all") {
      batches = [...dateGroup.male, ...dateGroup.female];
    } else if (selectedGender === "male") {
      batches = dateGroup.male;
    } else {
      batches = dateGroup.female;
    }

    // Apply search filter
    if (searchQuery) {
      return batches.filter((batch) =>
        batch.orders.some(
          (order) =>
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_phone.includes(searchQuery)
        )
      );
    }

    return batches;
  };

  const displayBatches = getDisplayBatches();
  const dates = Object.keys(groupedBatches).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
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
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/admin/dashboard")} variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Batch Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Total Orders: {totalOrders} | Dates: {dates.length}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/admin/scan")} size="lg">
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Select Date</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full h-11 px-3 rounded-md border border-input bg-background"
          >
            {dates.map((date) => {
              const maleCount = groupedBatches[date].male.reduce((sum, b) => sum + b.total_orders, 0);
              const femaleCount = groupedBatches[date].female.reduce((sum, b) => sum + b.total_orders, 0);
              return (
                <option key={date} value={date}>
                  {date} - Male: {maleCount}, Female: {femaleCount}
                </option>
              );
            })}
          </select>
        </div>

        {/* Gender Filter */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedGender === "all" ? "default" : "outline"}
            onClick={() => setSelectedGender("all")}
            className="flex-1"
          >
            All ({selectedDate && groupedBatches[selectedDate] ? 
              groupedBatches[selectedDate].male.reduce((sum, b) => sum + b.total_orders, 0) +
              groupedBatches[selectedDate].female.reduce((sum, b) => sum + b.total_orders, 0) : 0})
          </Button>
          <Button
            variant={selectedGender === "male" ? "default" : "outline"}
            onClick={() => setSelectedGender("male")}
            className="flex-1"
          >
            Male ({selectedDate && groupedBatches[selectedDate] ? 
              groupedBatches[selectedDate].male.reduce((sum, b) => sum + b.total_orders, 0) : 0})
          </Button>
          <Button
            variant={selectedGender === "female" ? "default" : "outline"}
            onClick={() => setSelectedGender("female")}
            className="flex-1"
          >
            Female ({selectedDate && groupedBatches[selectedDate] ? 
              groupedBatches[selectedDate].female.reduce((sum, b) => sum + b.total_orders, 0) : 0})
          </Button>
        </div>

        {/* Search */}
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

        {/* Batches Display */}
        <div className="space-y-6">
          {displayBatches.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No batches found for the selected filters</p>
            </Card>
          ) : (
            displayBatches.map((batch) => {
              const statusConfig = getStatusConfig(batch.batch_status);
              return (
                <Card key={batch.batch_number} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Batch {batch.batch_number} ({batch.gender})
                        </CardTitle>
                        <Badge variant={statusConfig.variant} className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {batch.total_orders} orders
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {batch.batch_status === "completed" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unmarkBatchComplete(batch.batch_number)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Unmark
                          </Button>
                        ) : (
                          <>
                            <Checkbox
                              id={`batch-${batch.batch_number}`}
                              checked={false}
                              onCheckedChange={() => confirmMarkBatchComplete(batch.batch_number)}
                            />
                            <label
                              htmlFor={`batch-${batch.batch_number}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              Mark Complete
                            </label>
                          </>
                        )}
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
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.customer_name} • {order.customer_phone} • Room {order.room_number}
                            </div>
                            <div className="text-sm font-medium mt-1">₹{order.total_amount}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={batchToComplete !== null} onOpenChange={() => setBatchToComplete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark Batch {batchToComplete} as Complete?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark all orders in this batch as "Ready for Pickup" and send notifications to all customers. 
                Students will see their laundry is ready in their orders page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={markBatchComplete}>
                Confirm & Send Notifications
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminBatches;
