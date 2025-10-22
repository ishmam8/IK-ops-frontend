import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpreadsheetGrid, ColumnDef } from "@/components/spreadsheet/SpreadsheetGrid";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";

const payoutTableKey = "payout-entry-grid";

// ---------- Types ----------
export interface PayoutRow {
  expense_type: string;
  description: string;
  amount: string;
  transaction_type: string;
  [key: string]: string | boolean | undefined; 
}


interface PayoutFormData {
  date: string;
  items: PayoutRow[];
}


// column helpers
type KeyedColumnDef<K extends string> = Omit<ColumnDef, "key"> & { key: K };
type ColumnsOf<T> = ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>>;

const PAYOUT_COLS = [
  { key: "expense_type",      label: "Expense Type",          type: "text",   width: "w-28", required: true },
  { key: "description",       label: "Description",           type: "text",   width: "w-40", required: true },
  { key: "amount",            label: "Amount(BDT)",           type: "text",   width: "w-28", required: true },
  { key: "transaction_type",  label: "Transaction Type",      type: "text",   width: "w-32", required: true },
] satisfies ColumnsOf<PayoutRow>;

const payout_table_columns: ColumnDef[] = PAYOUT_COLS;


export function PayoutForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PayoutFormData>({
    date: new Date().toISOString().split("T")[0],
    items: [],
  });
  const [headerErrors, setHeaderErrors] = useState<Record<string, string>>({});


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
    cols: ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>> = PAYOUT_COLS as unknown as ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>>
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
  const itemErrors = useMemo(() => computeItemErrors(formData.items, PAYOUT_COLS), [formData.items, computeItemErrors]);
  const hasAnyFilledRow = formData.items.some((row) => rowHasAnyValue(row, PAYOUT_COLS));
  const isHeaderValid = !!formData.date;
  const isStep1Valid = isHeaderValid && hasAnyFilledRow && Object.keys(itemErrors).length === 0;

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
      toast.success("Payout entry created successfully!");
      setFormData({
        date: new Date().toISOString().split("T")[0],
        items: [],
      });
      setHeaderErrors({});
      setStep(1);
      console.log("Submitted Payout Data:", formData);
      //TODO: 
      // integrate with backend API here
    } catch {
      toast.error("Failed to create payout entry");
    }
  };

  console.log("Payout Form Data:", formData);

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
              {s === 1 ? "Payout Entry" : "Submit"}
            </span>
            {s < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Entry */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>IK Daily Payout Entry</CardTitle>
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

          {/* P A Y O U T */}
          <CardContent className="space-y-4">
            <div className="w-full overflow-x-auto">
              <div className="w-max min-w-full">
                <SpreadsheetGrid
                  tableKey={payoutTableKey}
                  columns={payout_table_columns}
                  data={formData.items}
                  onChange={(items) => setFormData({ ...formData, items: items as PayoutRow[]})}
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
          {/* PAYOUT TABLE */}
          <CardContent>
            <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-primary p-2 text-left text-center text-primary-foreground font-semibold">
                    <th colSpan={4}>PAYOUT</th>
                  </tr>
                  <tr className="bg-muted">
                    {PAYOUT_COLS.map((col) => (
                    <th key={col.key} className="border border-border p-2 text-left text-sm font-medium">
                      {col.label}
                    </th>
                  ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/50">
                      {PAYOUT_COLS.map((col) => {
                        const value = row[col.key as keyof PayoutRow];
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
            Submit Expenses Entry
          </Button>
        )}
      </div>
    </div>
  );
}