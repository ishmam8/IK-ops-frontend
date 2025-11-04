import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpreadsheetGrid, ColumnDef } from "@/components/spreadsheet/SpreadsheetGrid";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { createPayouts } from "@/features/payouts/api/payouts.api";

// ---------- Types ----------
export interface PayoutRow {
  expense_type: string;
  description: string;
  amount: string;
  payment_method: string;
  [key: string]: string | boolean | undefined;
}

interface PayoutFormData {
  date: string;
  items: PayoutRow[];
}

// ---------- Column helpers ----------
type KeyedColumnDef<K extends string> = Omit<ColumnDef, "key"> & { key: K };
type ColumnsOf<T> = ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>>;

const PAYOUT_COLS = [
  { key: "expense_type",      label: "Expense Type",     type: "text", width: "w-28", required: true },
  { key: "description",       label: "Description",      type: "text", width: "w-40", required: true },
  { key: "amount",            label: "Amount(BDT)",      type: "text", width: "w-28", required: true },
  { key: "payment_method",  label: "Payment Method", type: "text", width: "w-32", required: true },
] satisfies ColumnsOf<PayoutRow>;

const payout_table_columns: ColumnDef[] = PAYOUT_COLS;

// ---------- Persistence utils ----------
const LS_KEYS = {
  step: "payout-current-step",
  form: "payout-form-data",
  version: "payout-form-version",
} as const;

const SCHEMA_VERSION = "v1"; // bump if you change PayoutFormData shape
const isBrowser = typeof window !== "undefined";

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("persist error", e);
  }
}
function debounce<F extends (...args: PayoutFormData[]) => void>(fn: F, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// =====================================================================

export function PayoutForm() {
  // ---- initial state hydrated from localStorage (no flicker) ----
  const [step, setStep] = useState<number>(() => {
    const saved = isBrowser ? window.localStorage.getItem(LS_KEYS.step) : null;
    return saved ? parseInt(saved, 10) : 1;
  });

  const [formData, setFormData] = useState<PayoutFormData>(() => {
    const savedVer = isBrowser ? window.localStorage.getItem(LS_KEYS.version) : null;
    if (savedVer === SCHEMA_VERSION) {
      return readJSON<PayoutFormData>(LS_KEYS.form, {
        date: new Date().toISOString().split("T")[0],
        items: [],
      });
    }
    if (isBrowser) window.localStorage.setItem(LS_KEYS.version, SCHEMA_VERSION);
    return { date: new Date().toISOString().split("T")[0], items: [] };
  });

  const [headerErrors, setHeaderErrors] = useState<Record<string, string>>({});

  // ---- validation utils (pure; no toasts) ----
  type AnyRow = Record<string, string | boolean | undefined>;

  const isEmpty = useCallback(
    (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === ""),
    []
  );

  const rowHasAnyValue = useCallback(
    <T extends AnyRow,>(row: T, cols: ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>>) => cols.some(c => !isEmpty(row[c.key as keyof T])),
    [isEmpty]
  );

  const computeItemErrors = useCallback(
    <T extends AnyRow,>(
      items: T[],
      cols: ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>> =
        PAYOUT_COLS as unknown as ReadonlyArray<KeyedColumnDef<Extract<keyof T, string>>>
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
    },
    [isEmpty, rowHasAnyValue]
  );

  // Live, derived row errors and step-1 readiness
  const itemErrors = useMemo(
    () => computeItemErrors(formData.items, PAYOUT_COLS),
    [formData.items, computeItemErrors]
  );

  const totalAmount = useMemo(() => {
    return formData.items.reduce((sum, row) => {
      const amount = parseFloat(row.amount) || 0;
      return sum + amount;
    }, 0);
  }, [formData.items]);
  
  const hasAnyFilledRow = formData.items.some((row) => rowHasAnyValue(row, PAYOUT_COLS));
  const isHeaderValid = !!formData.date;
  const isStep1Valid = isHeaderValid && hasAnyFilledRow && Object.keys(itemErrors).length === 0;

  // ---- persist step & form (debounced) ----
  useEffect(() => {
    if (!isBrowser) return;
    window.localStorage.setItem(LS_KEYS.step, String(step));
  }, [step]);

  const saveFormDebounced = useMemo(
    () =>
      debounce((data: PayoutFormData) => {
        writeJSON(LS_KEYS.form, data);
        if (isBrowser) window.localStorage.setItem(LS_KEYS.version, SCHEMA_VERSION);
      }, 300),
    []
  );

  useEffect(() => {
    saveFormDebounced(formData);
  }, [formData, saveFormDebounced]);

  // ---- Navigation Handlers ----
  const handleNext = () => {
    if (!isStep1Valid) {
      toast.error("Please complete required fields in the table and date.");
      return;
    }
    setStep(2);
  };

  // ---- Submission Handler ----
  const handleSubmit = async () => {
      try {
        const res = await createPayouts({ date: formData.date, payouts: formData.items });
        toast.success(`Created ${res.id} for ${res.date} (${res.count} rows)`);
  
        console.log("create sales response", res);
        toast.success("Sales entry created successfully!");
        
        // clear draft on success
        if (isBrowser) {
          window.localStorage.removeItem(LS_KEYS.form);
          window.localStorage.removeItem(LS_KEYS.step);
          window.localStorage.setItem(LS_KEYS.version, SCHEMA_VERSION);
        }
        setFormData({ date: new Date().toISOString().split("T")[0], items: [] });
        setHeaderErrors({});
        setStep(1);
      } catch (e) {
        console.log("create sales error", e);
        toast.error("Failed to create sales entry");
      }
  };

  // =====================================================================

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
                  tableKey="payout-entry-grid"
                  columns={payout_table_columns}
                  data={formData.items}
                  onChange={(items) => setFormData({ ...formData, items: items as PayoutRow[] })}
                  errors={itemErrors} // live errors per row/cell
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Submit / Review */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Submit</CardTitle>
            <CardDescription>
              Date: {formData.date} · Rows: {formData.items.length}
            </CardDescription>
          </CardHeader>

          {/* Issues Panel (only shows places that need updates) */}
          {Object.keys(itemErrors).length > 0 && (
            <CardContent className="mb-2">
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive mb-2">Please fix these before submitting:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(itemErrors).map(([rowIdx, errs]) => (
                    <li key={rowIdx}>
                      Row {Number(rowIdx) + 1}:{" "}
                      {Object.entries(errs)
                        .map(([key, msg]) => `${PAYOUT_COLS.find(c => c.key === key)?.label ?? key} → ${msg}`)
                        .join("; ")}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          )}

          {/* PAYOUT TABLE preview */}
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
                        const val = row[col.key as keyof PayoutRow];
                        const displayValue = String(val ?? "");
                        const hasErr = itemErrors[idx]?.[col.key];
                        return (
                          <td
                            key={col.key}
                            className={`border border-border p-2 text-sm ${
                              hasErr ? "bg-destructive/10 text-destructive" : ""
                            }`}
                          >
                            {displayValue || <span className="opacity-50">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-primary/10 font-semibold">
                    <td colSpan={2} className="border border-border p-2 text-sm text-right">
                      Total:
                    </td>
                    <td className="border border-border p-2 text-sm">
                      {totalAmount.toFixed(2)}
                    </td>
                    <td className="border border-border p-2 text-sm">
                      {/* Empty cell for Transaction Type column */}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (!isBrowser) return;
              window.localStorage.removeItem(LS_KEYS.form);
              window.localStorage.removeItem(LS_KEYS.step);
              window.localStorage.removeItem(LS_KEYS.version);
              setFormData({ date: new Date().toISOString().split("T")[0], items: [] });
              setStep(1);
            }}
          >
            Reset Draft
          </Button>
        </div>

        <div className="flex items-center gap-2">
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
            <Button onClick={handleSubmit} disabled={Object.keys(itemErrors).length > 0}>
              <Check className="h-4 w-4 mr-2" />
              Submit Expenses Entry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
