import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpreadsheetGrid, ColumnDef } from "@/components/spreadsheet/SpreadsheetGrid";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";

const salesTableKey = "sales-entry-grid";

// ---------- Types ----------
export interface SalesRow {
  invoice_number: string;
  customer: string;
  quantity: string;
  item_code: string;
  item: string;
  sold_by: string;
  gold_weight: string;
  kdm_vori: string;
  is_rst: boolean;
  sale_price: string;
  cash_card_payment: string;
  gold_payment?: string;
  rst_payment?: string;
  rst_advanced?: string;
  customer_due?: string;
  due_by?: string;
  payment_type: string;
  [key: string]: string | boolean | undefined; 
}

interface SalesFormData {
  date: string;
  items: SalesRow[];
}

// column helpers
type KeyedColumnDef<K extends string> = Omit<ColumnDef, "key"> & { key: K };
type ColumnsOf<T> = ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>>;

const SALE_COLS = [
  { key: "invoice_number",     label: "Invoice #",          type: "text", width: "w-28", required: true },
  { key: "customer",           label: "Customer Name",      type: "text",   width: "w-40", required: true },
  { key: "quantity",           label: "Quantity",           type: "text", width: "w-28", required: true },
  { key: "item_code",          label: "Item Code",          type: "text",   width: "w-32", required: true },
  { key: "item",               label: "Item",               type: "text",   width: "w-48", required: true },
  { key: "sold_by",            label: "Sold By",            type: "text",   width: "w-32", required: true },
  { key: "gold_weight",        label: "Gold Weight",        type: "text", width: "w-32", required: true },
  { key: "is_rst",             label: "IS RST",             type: "boolean", width: "w-32" },
  { key: "kdm_vori",           label: "KDM-Vori",           type: "text",   width: "w-28", required: true },
  { key: "sale_price",         label: "Sale Price",         type: "text",   width: "w-32" },
  { key: "cash_card_payment",  label: "Cash/Card Payment",  type: "text", width: "w-36", required: true },
  { key: "gold_payment",       label: "Gold Payment",       type: "text", width: "w-32" },
  { key: "rst_payment",        label: "RST Payment",        type: "text", width: "w-32" },
  { key: "rst_advanced",       label: "RST Advanced",       type: "text", width: "w-32" },
  { key: "customer_due",       label: "Customer Due",       type: "text", width: "w-32" },
  { key: "due_by",             label: "Due By",             type: "text",   width: "w-28" },
  { key: "payment_type",       label: "Payment Type",       type: "text",   width: "w-32", required: true },
] satisfies ColumnsOf<SalesRow>;

const sale_table_columns: ColumnDef[] = SALE_COLS;

export function SalesForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SalesFormData>({
    date: new Date().toISOString().split("T")[0],
    items: [],
  });
  const [headerErrors, setHeaderErrors] = useState<Record<string, string>>({});

  // ---- validation utils (pure; no toasts) ----
  const isEmpty = (v: unknown) =>
    v === undefined || v === null || (typeof v === "string" && v.trim() === "");

  const rowHasAnyValue = (row: SalesRow) =>
    SALE_COLS.some(c => !isEmpty(row[c.key as keyof SalesRow]));

  const computeItemErrors = useCallback((items: SalesRow[]) => {
    const errs: Record<number, Record<string, string>> = {};
    items.forEach((row, idx) => {
      if (!rowHasAnyValue(row)) return; // ignore completely empty rows
      const rowErrs: Record<string, string> = {};
      for (const col of SALE_COLS) {
        const key = col.key as keyof SalesRow;
        const value = row[key];

        if (col.required && isEmpty(value)) {
          rowErrs[col.key] = `${col.label} is required`;
        }
      }
      if (Object.keys(rowErrs).length) errs[idx] = rowErrs;
    });
    return errs;
  }, []);

  // Live, derived row errors and step-1 readiness
  const itemErrors = useMemo(() => computeItemErrors(formData.items), [formData.items, computeItemErrors]);
  const hasAnyFilledRow = formData.items.some(rowHasAnyValue);
  const isHeaderValid = !!formData.date;
  const isStep1Valid = isHeaderValid && hasAnyFilledRow && Object.keys(itemErrors).length === 0;

  const handleNext = () => {
    // extra guard if someone bypasses the disabled button
    if (!isStep1Valid) {
      toast.error("Please complete required fields in the table and date.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    try {
      console.log("Submitting sales data:", formData);
      toast.success("Sales entry created successfully!");
      setFormData({
        date: new Date().toISOString().split("T")[0],
        items: [],
      });
      setHeaderErrors({});
      setStep(1);
      //TODO: 
      // integrate with backend API here
    } catch {
      toast.error("Failed to create sales entry");
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator (2 steps now) */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className="text-sm font-medium">
              {s === 1 ? "Sales Entry" : "Submit"}
            </span>
            {s < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Entry */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>IK Daily Sales Entry</CardTitle>
            <CardDescription>Fill the date and at least one line item</CardDescription>
          </CardHeader>
          {/* BUSINESS DATE */}
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Business Date <span className="text-destructive">*</span>
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
            </div>
          </CardContent>
          {/* S A L E S */}
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-9">
                <Button size="sm" variant="outline">
                  Add Order
                </Button>
            </div>
            <div className="w-full overflow-x-auto">
              <div className="w-max min-w-full">
                <SpreadsheetGrid
                  tableKey={salesTableKey}
                  columns={sale_table_columns}
                  data={formData.items}
                  onChange={(items) => setFormData({ ...formData, items: items as SalesRow[]})}
                  errors={itemErrors} // live errors
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: lightweight submit screen */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Submit</CardTitle>
            <CardDescription>Date: {formData.date} · Rows: {formData.items.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    {SALE_COLS.map((col) => (
                      <th key={col.key} className="border border-border p-2 text-left text-sm font-medium">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/50">
                      {SALE_COLS.map((col) => {
                        const value = row[col.key as keyof SalesRow];
                        let displayValue: string;
                        
                        if (col.type === 'boolean') {
                          displayValue = value ? 'Yes' : 'No';
                        } else if (value === undefined || value === null || value === '') {
                          displayValue = '-';
                        } else {
                          displayValue = String(value);
                        }
                        
                        return (
                          <td key={col.key} className="border border-border p-2 text-sm">
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {step === 1 ? (
          <Button onClick={handleNext} disabled={!isStep1Valid}>
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