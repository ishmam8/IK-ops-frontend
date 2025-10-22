import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpreadsheetGrid, ColumnDef } from "@/components/spreadsheet/SpreadsheetGrid";
import { ChevronLeft, ChevronRight, Check, PlusCircle } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";import { toast } from "sonner";

const salesTableKey = "sales-entry-grid";
const orderTableKey = "order-entry-grid";

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

export interface OrderRow {
  invoice_number: string;
  customer: string;
  quantity: string;
  item_code: string;
  item_name: string;
  gold_carat: string;
  artisan: string;
  estimated_order_price: string;
  estimated_order_delivery_date: string;
  final_order_price?: string;
  [key: string]: string | boolean | undefined; 
}

interface SalesFormData {
  date: string;
  items: SalesRow[];
}

interface OrderFormData {
  date: string;
  items: OrderRow[];
}

// column helpers
type KeyedColumnDef<K extends string> = Omit<ColumnDef, "key"> & { key: K };
type ColumnsOf<T> = ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>>;

const SALE_COLS = [
  { key: "invoice_number",     label: "Invoice #",          type: "text", width: "w-28", required: true },
  { key: "customer",           label: "Customer Name",      type: "text",   width: "w-40", required: true },
  { key: "quantity",           label: "Quantity",           type: "text", width: "w-28", required: true },
  { key: "item_code",          label: "Item Code",          type: "text",   width: "w-32" },
  { key: "item",               label: "Item",               type: "text",   width: "w-48" },
  { key: "sold_by",            label: "Sold By",            type: "text",   width: "w-32", required: true },
  { key: "gold_weight",        label: "Gold Weight",        type: "text", width: "w-32" },
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

const ORDER_COLS = [
  { key: "invoice_number",               label: "Invoice #",                   type: "text",   width: "w-28", required: true },
  { key: "customer",                     label: "Customer Name",               type: "text",   width: "w-40", required: true },
  { key: "quantity",                     label: "Quantity",                    type: "text",   width: "w-28", required: true },
  { key: "item_code",                    label: "Item Code",                   type: "text",   width: "w-32" },
  { key: "item_name",                    label: "Item Name",                   type: "text",   width: "w-48", required: true },
  { key: "gold_carat",                   label: "Gold Carat",                  type: "text",   width: "w-32", required: true },
  { key: "artisan",                       label: "Artisan",                    type: "text",   width: "w-32" },
  { key: "estimated_order_price",       label: "Estimated Order Price",        type: "text",   width: "w-36" },
  { key: "estimated_order_delivery_date", label: "Est. Order Delivery Date",   type: "text",   width: "w-44" },
  { key: "final_order_price",           label: "Final Order Price",            type: "text",   width: "w-32" },
] satisfies ColumnsOf<OrderRow>;

const sale_table_columns: ColumnDef[] = SALE_COLS;
const order_table_columns: ColumnDef[] = ORDER_COLS;

const mapOrderToSales = (o: OrderRow): SalesRow => ({
  invoice_number: o.invoice_number ?? "",
  customer: o.customer ?? "",
  quantity: o.quantity ?? "",
  item_code: o.item_code ?? "",
  item: o.item_name ?? "",
  sold_by: "",                                   // PLACEHOLDER: set from current user / selector
  gold_weight: "",                               // PLACEHOLDER: if known
  kdm_vori: "",                                  // PLACEHOLDER: not derivable from carat; decide conversion rule
  is_rst: false,                                 // PLACEHOLDER: default false unless UI indicates otherwise
  sale_price: "",
  cash_card_payment: "",                         // PLACEHOLDER: depends on POS/payment screen
  gold_payment: "",                              // PLACEHOLDER
  rst_payment: "",                               // PLACEHOLDER
  rst_advanced: "",                              // PLACEHOLDER
  customer_due: "",                              // PLACEHOLDER: compute at submit if you want
  due_by: "",
  payment_type: "",                              // PLACEHOLDER: ("cash" | "card" | etc.)
});

export function SalesForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SalesFormData>({
    date: new Date().toISOString().split("T")[0],
    items: [],
  });
  const [orderFormData, setOrderFormData] = useState<OrderRow[]>([]);
  const [headerErrors, setHeaderErrors] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<OrderRow[]>([]);
  const [modalErrors, setModalErrors] = useState<Record<number, Record<string, string>>>({});

  
  // ---- validation utils (pure; no toasts) ----
  // ---- validation utils (pure; no toasts) ----
  type AnyRow = Record<string, string | boolean | undefined>;

  const isEmpty = useCallback((v: unknown) =>
    v === undefined || v === null || (typeof v === "string" && v.trim() === ""), []);

  const rowHasAnyValue = useCallback(<T extends AnyRow,>(
    row: T,
    cols: ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>>
  ) => cols.some(c => !isEmpty(row[c.key as keyof T])), [isEmpty]);

  const computeItemErrors = useCallback(<T extends AnyRow,>(
    items: T[],
    cols: ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>> = SALE_COLS as unknown as ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>>
  ) => {
    const errs: Record<number, Record<string, string>> = {};
    items.forEach((row, idx) => {
      if (!rowHasAnyValue(row, cols)) return;
      const rowErrs: Record<string, string> = {};
      for (const col of cols) {
        const key = col.key as keyof T;
        const value = row[key];
        if (col.required && isEmpty(value)) {
          rowErrs[col.key] = `${col.label} is required`;
        }
      }
      if (Object.keys(rowErrs).length) errs[idx] = rowErrs;
    });
    return errs;
  }, [isEmpty, rowHasAnyValue]);

  // Live, derived row errors and step-1 readiness
  const itemErrors = useMemo(() => computeItemErrors(formData.items, SALE_COLS), [formData.items, computeItemErrors]);
  const hasAnyFilledRow = formData.items.some((row) => rowHasAnyValue(row, SALE_COLS));
  const isHeaderValid = !!formData.date;
  const isStep1Valid = isHeaderValid && hasAnyFilledRow && Object.keys(itemErrors).length === 0;

  // ---- Modal Handlers ----
  const validateModalItems = () => {
    const errs = computeItemErrors(modalItems, ORDER_COLS);
    setModalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleModalSubmit = () => {
    if (!validateModalItems()) {
      toast.error("Please fix errors in the modal before submitting");
      return;
    }
    if (modalItems.length === 0) {
      toast.error("Please add at least one entry");
      return;
    }
    const filledOrders = modalItems.filter(r => rowHasAnyValue<OrderRow>(r, ORDER_COLS));
    if (filledOrders.length === 0) {
      toast.error("Please add at least one complete entry");
      return;
    }
    
    const mappedSalesRows = filledOrders.map(mapOrderToSales);

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, ...mappedSalesRows],
    }));
    
    setOrderFormData(modalItems);
    setModalItems([]);
    setModalErrors({});
    setIsModalOpen(false);
    toast.success(`${mappedSalesRows.length} row(s) added to sales entry!`);
  };

  // ---- Navigation Handlers ----
  const handleNext = () => {
    // extra guard if someone bypasses the disabled button
    if (!isStep1Valid) {
      toast.error("Please complete required fields in the table and date.");
      return;
    }
    setStep(2);
  };

  // ---- Submission Handler ---- 
  const handleSubmit = async () => {
    try {
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
      {/* Progress Indicator */}
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

          {/* ADD MODAL TRIGGER */}
          <CardContent>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Order Table</DialogTitle>
                  <DialogDescription>
                    Use the spreadsheet below to add multiple entries at once. Click "Add to Sales" when done.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-auto">
                  <div className="w-full overflow-x-auto">
                    <div className="w-max min-w-full">
                      <SpreadsheetGrid
                        tableKey="order-modal-grid"
                        columns={order_table_columns}
                        data={modalItems}
                        onChange={(items) => setModalItems(items as OrderRow[])}
                        errors={modalErrors}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {modalItems.filter((r) => rowHasAnyValue(r, ORDER_COLS)).length} filled row(s)
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsModalOpen(false);
                        setModalItems([]);
                        setModalErrors({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleModalSubmit}
                      disabled={modalItems.filter((r) => rowHasAnyValue(r, ORDER_COLS)).length === 0}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Add to Sales ({modalItems.filter((r) => rowHasAnyValue(r, ORDER_COLS)).length})
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>

          {/* S A L E S */}
          <CardContent className="space-y-4">
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

      {/* Step 2: submit screen */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Submit</CardTitle>
            <CardDescription>Date: {formData.date} · Rows: {formData.items.length}</CardDescription>
          </CardHeader>
          {/* SALES TABLE */}
          <CardContent>
            <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-primary p-2 text-left text-center text-primary-foreground font-semibold">
                  <th colSpan={SALE_COLS.length}>SALES</th>
                  </tr>
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
          {/* ORDER TABLE */}
          <CardContent>
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-primary p-2 text-left text-center text-primary-foreground font-semibold">
                  <th colSpan={ORDER_COLS.length}>ORDERS</th>
                  </tr>
                  <tr className="bg-muted">
                    {ORDER_COLS.map((col) => (
                      <th key={col.key} className="border border-border p-2 text-left text-sm font-medium">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderFormData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/50">
                      {ORDER_COLS.map((col) => {
                        const value = row[col.key as keyof OrderRow];
                        // const displayValue: string;
                        const displayValue = String(value);
                        
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