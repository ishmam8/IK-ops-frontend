import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SpreadsheetGrid, ColumnDef } from "@/components/spreadsheet/SpreadsheetGrid";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";

interface SalesFormData {
  customer: string;
  date: string;
  currency: string;
  items: any[];
}

const CUSTOMERS = [
  { label: "Customer A", value: "customer-a" },
  { label: "Customer B", value: "customer-b" },
  { label: "Customer C", value: "customer-c" },
];

const CURRENCIES = [
  { label: "USD", value: "usd" },
  { label: "EUR", value: "eur" },
  { label: "GBP", value: "gbp" },
];

const ITEMS = [
  { label: "Gold Ring 18K", value: "gold-ring" },
  { label: "Diamond Necklace", value: "diamond-necklace" },
  { label: "Silver Bracelet", value: "silver-bracelet" },
  { label: "Pearl Earrings", value: "pearl-earrings" },
];

const columns: ColumnDef[] = [
  {
    key: "item",
    label: "Item",
    type: "select",
    width: "w-48",
    required: true,
    options: ITEMS,
  },
  {
    key: "quantity",
    label: "Quantity",
    type: "number",
    width: "w-28",
    required: true,
    min: 1,
  },
  {
    key: "unitPrice",
    label: "Unit Price",
    type: "number",
    width: "w-32",
    required: true,
    min: 0,
  },
  {
    key: "tax",
    label: "Tax %",
    type: "number",
    width: "w-24",
    required: true,
    min: 0,
  },
  {
    key: "lineTotal",
    label: "Line Total",
    type: "calculated",
    width: "w-32",
    calculate: (row) => {
      const subtotal = (row.quantity || 0) * (row.unitPrice || 0);
      const taxAmount = subtotal * ((row.tax || 0) / 100);
      return subtotal + taxAmount;
    },
  },
];

export function SalesForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SalesFormData>({
    customer: "",
    date: new Date().toISOString().split("T")[0],
    currency: "usd",
    items: [],
  });
  const [headerErrors, setHeaderErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<number, Record<string, string>>>({});

  const validateHeader = () => {
    const errors: Record<string, string> = {};
    if (!formData.customer) errors.customer = "Customer is required";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.currency) errors.currency = "Currency is required";
    setHeaderErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateItems = () => {
    const errors: Record<number, Record<string, string>> = {};
    
    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      return false;
    }

    formData.items.forEach((item, index) => {
      const rowErrors: Record<string, string> = {};
      if (!item.item) rowErrors.item = "Item is required";
      if (!item.quantity || item.quantity < 1) rowErrors.quantity = "Quantity must be at least 1";
      if (item.unitPrice === undefined || item.unitPrice < 0) rowErrors.unitPrice = "Unit price is required";
      if (item.tax === undefined || item.tax < 0) rowErrors.tax = "Tax is required";
      
      if (Object.keys(rowErrors).length > 0) {
        errors[index] = rowErrors;
      }
    });

    setItemErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateHeader()) {
      setStep(2);
    } else if (step === 2 && validateItems()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    // Mock API call
    try {
      console.log("Submitting sales data:", formData);
      // await fetch('/api/sales', { method: 'POST', body: JSON.stringify(formData) });
      toast.success("Sales entry created successfully!");
      
      // Reset form
      setFormData({
        customer: "",
        date: new Date().toISOString().split("T")[0],
        currency: "usd",
        items: [],
      });
      setStep(1);
    } catch (error) {
      toast.error("Failed to create sales entry");
    }
  };

  const total = formData.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className="text-sm font-medium">
              {s === 1 ? "Header" : s === 2 ? "Items" : "Review"}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Header Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Entry - Header Information</CardTitle>
            <CardDescription>Enter the basic details for this sales transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">
                  Customer <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.customer}
                  onValueChange={(value) => setFormData({ ...formData, customer: value })}
                >
                  <SelectTrigger id="customer" className={headerErrors.customer ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMERS.map((customer) => (
                      <SelectItem key={customer.value} value={customer.value}>
                        {customer.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {headerErrors.customer && (
                  <p className="text-sm text-destructive">{headerErrors.customer}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={headerErrors.date ? "border-destructive" : ""}
                />
                {headerErrors.date && <p className="text-sm text-destructive">{headerErrors.date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">
                  Currency <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency" className={headerErrors.currency ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {headerErrors.currency && (
                  <p className="text-sm text-destructive">{headerErrors.currency}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Line Items Grid */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Entry - Line Items</CardTitle>
            <CardDescription>Add items to this sales transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <SpreadsheetGrid
              columns={columns}
              data={formData.items}
              onChange={(items) => setFormData({ ...formData, items })}
              errors={itemErrors}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Entry - Review & Confirm</CardTitle>
            <CardDescription>Review your sales entry before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">
                  {CUSTOMERS.find((c) => c.value === formData.customer)?.label}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formData.date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium">{formData.currency.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold text-primary">{total.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Line Items ({formData.items.length})</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Item</th>
                      <th className="text-right p-3 text-sm font-medium">Quantity</th>
                      <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                      <th className="text-right p-3 text-sm font-medium">Tax %</th>
                      <th className="text-right p-3 text-sm font-medium">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="p-3 text-sm">
                          {ITEMS.find((i) => i.value === item.item)?.label}
                        </td>
                        <td className="p-3 text-sm text-right">{item.quantity}</td>
                        <td className="p-3 text-sm text-right">
                          {typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : parseFloat(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {typeof item.tax === 'number' ? item.tax.toFixed(2) : parseFloat(item.tax || 0).toFixed(2)}%
                        </td>
                        <td className="p-3 text-sm text-right font-medium">
                          {typeof item.lineTotal === 'number' ? item.lineTotal.toFixed(2) : parseFloat(item.lineTotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {step < 3 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit}>
            <Check className="h-4 w-4 mr-2" />
            Submit Sales Entry
          </Button>
        )}
      </div>
    </div>
  );
}
