import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function Orders() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage supplier orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            The Orders module will feature a spreadsheet interface with columns for Supplier, Order #, Item, Quantity, Unit Cost, and Delivery Date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This module will follow the same multi-step workflow pattern as Sales, with validation and API integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
