// src/components/PayoutTable.tsx
"use client";

import React, { useState, useMemo } from "react";
import { usePayouts } from "../../hooks/usePayouts";
import { DateFilter, DateFilterValue } from "../dateFilter"; // <-- adjust path
import { cn } from "@/lib/utils";

export default function PayoutTable() {
    // you still have your API month hardcoded for now
    const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);
    
    // state from DateFilter
    const [filter, setFilter] = useState<DateFilterValue>({ mode: "all" });
    const monthParam = filter.mode === "all"
                        ? undefined
                        : filter.monthYear.toISOString().slice(0, 7);
    const { data: payouts, isLoading, isError } = usePayouts({ month: monthParam });

    const displayed = React.useMemo(() => {
    if (!payouts) return [];
    if (filter.mode === "all") return payouts;
    if (filter.mode === "day") {
        const d = filter.day.toISOString().slice(0, 10);
        return payouts.filter((p) => p.business_date === d);
    }
    if (filter.mode === "month") {
        const ym = filter.monthYear.toISOString().slice(0, 7); // "2025-11"
        return payouts.filter((p) => p.business_date.startsWith(ym));
    }
    return payouts;
    }, [payouts, filter]);

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
        <div className="space-y-3">
        <DateFilter
            value={filter}
            onChange={setFilter}
            // later: build ?month=YYYY-MM from val.monthYear
        />

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
                {displayed.map((exp) => {
                const isSelected = exp.id === selectedExpenseId;

                return (
                    <React.Fragment key={exp.id}>
                    <tr
                        onClick={() => handleSelectExpense(exp.id)}
                        className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/40 border-b",
                        isSelected ? "bg-muted/60" : "bg-background"
                        )}
                    >
                        <td className="p-2 border-r">{exp.business_date}</td>
                        <td className="p-2 border-r">
                        <span
                            className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            exp.category === "OTHER"
                                ? "bg-slate-100 text-slate-800"
                                : "bg-emerald-100 text-emerald-800"
                            )}
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
                            className={cn(
                            "inline-flex rounded px-2 py-0.5 text-[10px] font-medium",
                            exp.payment_method?.toLowerCase() === "cash"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            )}
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
        </div>
    );
}
