import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function Expenses() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground mt-1">Manage business expenses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            The Expenses module will feature a similar spreadsheet-like interface with columns for Expense Type, Description, Amount, Date, and Payment Method.
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
