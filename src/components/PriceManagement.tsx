import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Save, X } from "lucide-react";

interface ItemPrice {
  id: string;
  item_id: string;
  service_type_id: string;
  price: number;
  item_name?: string;
  service_name?: string;
}

interface PriceEditState {
  id: string;
  price: string;
}

export const PriceManagement = () => {
  const [itemPrices, setItemPrices] = useState<ItemPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<PriceEditState | null>(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      // Fetch item prices with related item and service type names
      const { data: prices, error: pricesError } = await supabase
        .from("item_prices")
        .select("*")
        .order("item_id");

      if (pricesError) throw pricesError;

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("id, name");

      if (itemsError) throw itemsError;

      // Fetch service types
      const { data: services, error: servicesError } = await supabase
        .from("service_types")
        .select("id, name");

      if (servicesError) throw servicesError;

      // Map prices with item and service names
      const enrichedPrices = (prices || []).map(price => {
        const item = items?.find(i => i.id === price.item_id);
        const service = services?.find(s => s.id === price.service_type_id);
        return {
          ...price,
          item_name: item?.name || "Unknown",
          service_name: service?.name || "Unknown",
        };
      });

      setItemPrices(enrichedPrices);
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast.error("Failed to load prices");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (price: ItemPrice) => {
    setEditingPrice({
      id: price.id,
      price: price.price.toString(),
    });
  };

  const cancelEdit = () => {
    setEditingPrice(null);
  };

  const savePrice = async () => {
    if (!editingPrice) return;

    const newPrice = parseFloat(editingPrice.price);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      const { error } = await supabase
        .from("item_prices")
        .update({ price: newPrice })
        .eq("id", editingPrice.id);

      if (error) throw error;

      toast.success("Price updated successfully");
      setEditingPrice(null);
      fetchPrices();
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Failed to update price");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Management</CardTitle>
      </CardHeader>
      <CardContent>
        {itemPrices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No item prices found</p>
            <p className="text-sm text-muted-foreground">
              Items and prices need to be added to the database first
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Price (₹)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemPrices.map((price) => (
                <TableRow key={price.id}>
                  <TableCell className="font-medium">{price.item_name}</TableCell>
                  <TableCell>{price.service_name}</TableCell>
                  <TableCell>
                    {editingPrice?.id === price.id ? (
                      <Input
                        type="number"
                        value={editingPrice.price}
                        onChange={(e) =>
                          setEditingPrice({ ...editingPrice, price: e.target.value })
                        }
                        className="w-24"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      `₹${price.price}`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingPrice?.id === price.id ? (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={savePrice}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(price)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
