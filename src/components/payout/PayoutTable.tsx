// src/components/PayoutTable.tsx
import React, { useState } from "react";
import { usePayouts } from "../../hooks/usePayouts"; // <-- replace with your real path

// shape we're expecting from the backend:
// {
//   id: number;
//   business_date: string; // "2025-11-04"
//   category: string;      // e.g. "OTHER"
//   expense_type: string;  // e.g. "store"
//   description: string;
//   amount: string;        // "400.00"
//   payment_method: string; // "Cash"
// }

export default function PayoutTable() {
  // keep it parallel with SalesTable
  const [month] = useState("2025-11");
  const { data: payouts, isLoading, isError } = usePayouts({ month });
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  const handleSelectExpense = (id: number) => {
    setSelectedExpenseId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading expenses…</div>;
  }

  if (isError || !payouts) {
    return <div className="p-4 text-sm text-destructive">Failed to load expenses.</div>;
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Expense Type</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-right">Amount</th>
            <th className="p-2 text-left">Payment</th>
            <th className="p-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((exp) => {
            const isSelected = exp.id === selectedExpenseId;

            return (
              <React.Fragment key={exp.id}>
                {/* main row */}
                <tr
                  onClick={() => handleSelectExpense(exp.id)}
                  className={`cursor-pointer transition-colors hover:bg-muted/40 border-b ${
                    isSelected ? "bg-muted/60" : "bg-background"
                  }`}
                >
                  <td className="p-2 border-r">{exp.business_date}</td>
                  <td className="p-2 border-r">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        exp.category === "OTHER"
                          ? "bg-slate-100 text-slate-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {exp.category ?? "—"}
                    </span>
                  </td>
                  <td className="p-2 border-r capitalize">{exp.expense_type ?? "—"}</td>
                  <td className="p-2 border-r">
                    {exp.description && exp.description.trim() !== "" ? exp.description : "—"}
                  </td>
                  <td className="p-2 text-right border-r">{exp.amount ?? "0.00"}</td>
                  <td className="p-2 border-r">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium ${
                        exp.payment_method?.toLowerCase() === "cash"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {exp.payment_method ?? "—"}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectExpense(exp.id);
                      }}
                      className="rounded border px-2 py-1 text-xs hover:bg-accent"
                    >
                      {isSelected ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>

                {/* expanded row – just details, no nested tables */}
                {isSelected ? (
                  <tr className="border-b bg-slate-50/70">
                    <td colSpan={7} className="p-3 border-l-4 border-l-sky-400">
                      <div className="grid gap-3 text-xs sm:grid-cols-4">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">{exp.business_date}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Category</p>
                          <p className="font-medium">{exp.category ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expense type</p>
                          <p className="font-medium capitalize">{exp.expense_type ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">{exp.amount ?? "0.00"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment method</p>
                          <p className="font-medium">{exp.payment_method ?? "—"}</p>
                        </div>
                        <div className="sm:col-span-4">
                          <p className="text-muted-foreground">Description</p>
                          <p className="font-medium">
                            {exp.description && exp.description.trim() !== ""
                              ? exp.description
                              : "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
