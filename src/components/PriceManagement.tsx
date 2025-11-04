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
import { Edit2, Save, X, Plus } from "lucide-react";

// Import all item icons
import bathTowelIcon from "@/assets/icons/bath-towel.png";
import blanketDoubleIcon from "@/assets/icons/blanket-double.png";
import blanketSingleIcon from "@/assets/icons/blanket-single.png";
import blouseIcon from "@/assets/icons/blouse.png";
import handTowelIcon from "@/assets/icons/hand-towel.png";
import hankyIcon from "@/assets/icons/hanky.png";
import kameezIcon from "@/assets/icons/kameez.png";
import kurtaIcon from "@/assets/icons/kurta.png";
import lungiIcon from "@/assets/icons/lungi.png";
import pillowIcon from "@/assets/icons/pillow.png";
import pyjamaIcon from "@/assets/icons/pyjama.png";
import quiltDoubleIcon from "@/assets/icons/quilt-double.png";
import quiltSingleIcon from "@/assets/icons/quilt-single.png";
import salwarIcon from "@/assets/icons/salwar.png";

// Icon mapping by item name
const iconMap: Record<string, string> = {
  "Bath Towel": bathTowelIcon,
  "Blanket (Double)": blanketDoubleIcon,
  "Blanket (Single)": blanketSingleIcon,
  "Blouse": blouseIcon,
  "Hand Towel": handTowelIcon,
  "Hanky": hankyIcon,
  "Kameez": kameezIcon,
  "Kurta": kurtaIcon,
  "Lungi": lungiIcon,
  "Pillow": pillowIcon,
  "Pyjama": pyjamaIcon,
  "Quilt (Double)": quiltDoubleIcon,
  "Quilt (Single)": quiltSingleIcon,
  "Salwar": salwarIcon,
};

interface Item {
  id: string;
  name: string;
  emoji: string;
}

interface ServiceType {
  id: string;
  name: string;
}

interface ItemPrice {
  id?: string;
  item_id: string;
  service_type_id: string;
  price: number;
  item_name?: string;
  service_name?: string;
}

interface PriceEditState {
  item_id: string;
  service_type_id: string;
  price: string;
  isNew?: boolean;
}

export const PriceManagement = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [priceMap, setPriceMap] = useState<Map<string, ItemPrice>>(new Map());
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<PriceEditState | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("id, name, emoji")
        .order("display_order");

      if (itemsError) throw itemsError;

      // Fetch service types
      const { data: servicesData, error: servicesError } = await supabase
        .from("service_types")
        .select("id, name")
        .order("display_order");

      if (servicesError) throw servicesError;

      // Fetch all prices
      const { data: pricesData, error: pricesError } = await supabase
        .from("item_prices")
        .select("*");

      if (pricesError) throw pricesError;

      setItems(itemsData || []);
      setServiceTypes(servicesData || []);

      // Create a map for quick price lookup
      const pMap = new Map<string, ItemPrice>();
      (pricesData || []).forEach(price => {
        const key = `${price.item_id}-${price.service_type_id}`;
        pMap.set(key, price);
      });
      setPriceMap(pMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (itemId: string, serviceTypeId: string): ItemPrice | null => {
    const key = `${itemId}-${serviceTypeId}`;
    return priceMap.get(key) || null;
  };

  const startEdit = (itemId: string, serviceTypeId: string, existingPrice?: number) => {
    setEditingPrice({
      item_id: itemId,
      service_type_id: serviceTypeId,
      price: existingPrice?.toString() || "",
      isNew: !existingPrice,
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
      const key = `${editingPrice.item_id}-${editingPrice.service_type_id}`;
      const existingPrice = priceMap.get(key);

      if (existingPrice) {
        // Update existing price
        const { error } = await supabase
          .from("item_prices")
          .update({ price: newPrice })
          .eq("id", existingPrice.id);

        if (error) throw error;
      } else {
        // Insert new price
        const { error } = await supabase
          .from("item_prices")
          .insert({
            item_id: editingPrice.item_id,
            service_type_id: editingPrice.service_type_id,
            price: newPrice,
          });

        if (error) throw error;
      }

      toast.success("Price saved successfully");
      setEditingPrice(null);
      fetchData();
    } catch (error) {
      console.error("Error saving price:", error);
      toast.error("Failed to save price");
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
        {items.length === 0 || serviceTypes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No items or service types found</p>
            <p className="text-sm text-muted-foreground">
              Please add items and service types to the database first
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Item</TableHead>
                  {serviceTypes.map((service) => (
                    <TableHead key={service.id} className="text-center min-w-[150px]">
                      {service.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          <img 
                            src={iconMap[item.name]} 
                            alt={item.name}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    {serviceTypes.map((service) => {
                      const price = getPrice(item.id, service.id);
                      const isEditing = editingPrice?.item_id === item.id && 
                                       editingPrice?.service_type_id === service.id;
                      
                      return (
                        <TableCell key={`${item.id}-${service.id}`} className="text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-2 justify-center">
                              <Input
                                type="number"
                                value={editingPrice.price}
                                onChange={(e) =>
                                  setEditingPrice({ ...editingPrice, price: e.target.value })
                                }
                                className="w-24"
                                min="0"
                                step="1"
                                placeholder="₹"
                                autoFocus
                              />
                              <Button size="sm" onClick={savePrice} className="h-8 w-8 p-0">
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant={price ? "outline" : "ghost"}
                              onClick={() => startEdit(item.id, service.id, price?.price)}
                              className="w-full"
                            >
                              {price ? (
                                <>
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  ₹{price.price}
                                </>
                              ) : (
                                <>
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Edit Price
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};