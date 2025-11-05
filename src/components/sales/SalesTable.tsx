// src/components/SalesTable.tsx
import React, { useState, useMemo } from "react";
import { useSales } from "../../hooks/useSales";
import { DateFilter, DateFilterValue } from "../dateFilter"; // <-- adjust path
import { cn } from "@/lib/utils";

export default function SalesTable() {
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  
  // state from DateFilter
      const [filter, setFilter] = useState<DateFilterValue>({ mode: "all" });
      const monthParam = filter.mode === "all"
                          ? undefined
                          : filter.monthYear.toISOString().slice(0, 7);
      const { data: sales, isLoading, isError } = useSales({ month: monthParam });
  
      const displayed = React.useMemo(() => {
      if (!sales) return [];
      if (filter.mode === "all") return sales;
      if (filter.mode === "day") {
          const d = filter.day.toISOString().slice(0, 10);
          return sales.filter((p) => p.business_date === d);
      }
      if (filter.mode === "month") {
          const ym = filter.monthYear.toISOString().slice(0, 7); // "2025-11"
          return sales.filter((p) => p.business_date.startsWith(ym));
      }
      return sales;
      }, [sales, filter]);

  const handleSelectSale = (saleId: number) => {
    setSelectedSaleId((prev) => (prev === saleId ? null : saleId));
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading sales…</div>;
  }

  if (isError || !sales) {
    return <div className="p-4 text-sm text-destructive">Failed to load sales.</div>;
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
                <th className="p-2 text-left">Invoice #</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Sold by</th>
                <th className="p-2 text-right">Items</th>
                <th className="p-2 text-right">Weight (g)</th>
                <th className="p-2 text-right">Total Price</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-center">Action</th>
            </tr>
            </thead>
            <tbody>
                {displayed.map((sale) => {
                    const isSelected = sale.id === selectedSaleId;
                    const typeLabel = sale.is_rst ? "RST" : sale.is_order ? "ORDER" : "SALE";

                    return (
                    <React.Fragment key={sale.id}>
                        {/* main row */}
                        <tr
                        onClick={() => handleSelectSale(sale.id)}
                        className={`cursor-pointer transition-colors hover:bg-muted/40 border-b ${
                            isSelected ? "bg-muted/60" : "bg-background"
                        }`}
                        >
                        <td className="p-2 border-r">{sale.invoice_number}</td>
                        <td className="p-2 border-r">{sale.business_date}</td>
                        <td className="p-2 border-r">{sale.customer_name}</td>
                        <td className="p-2 border-r">{sale.sold_by}</td>
                        <td className="p-2 text-right border-r">{sale.item_count}</td>
                        <td className="p-2 text-right border-r">{sale.total_weight}</td>
                        <td className="p-2 text-right border-r">{sale.total_sale_price}</td>
                        <td className="p-2 border-r">
                            <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                typeLabel === "RST"
                                ? "bg-purple-100 text-purple-800"
                                : typeLabel === "ORDER"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-800"
                            }`}
                            >
                            {typeLabel}
                            </span>
                        </td>
                        <td className="p-2 text-center">
                            <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSale(sale.id);
                            }}
                            className="rounded border px-2 py-1 text-xs hover:bg-accent"
                            >
                            {isSelected ? "Hide" : "View"}
                            </button>
                        </td>
                        </tr>

                        {/* expanded row */}
                        {isSelected ? (
                        <tr className="border-b bg-slate-50/70">
                            {/* left accent to show it's linked to above row */}
                            <td colSpan={9} className="p-3 border-l-4 border-l-sky-400">
                            <div className="space-y-3">
                                {/* SALE ITEMS */}
                                <div className="rounded-md border bg-white/60 overflow-hidden">
                                    <div className="border-b bg-slate-100/70 p-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Sale items for invoice #{sale.invoice_number}
                                    </div>
                                    <table className="w-full text-xs table-fixed">
                                    <thead>
                                        <tr className="bg-slate-50">
                                        <th className="p-2 text-left border-b border-r w-28">Item Code</th>
                                        <th className="p-2 text-left border-b border-r w-24">Purity</th>
                                        <th className="p-2 text-right border-b border-r w-24">Weight (g)</th>
                                        <th className="p-2 text-right border-b border-r w-28">Purity Price</th>
                                        <th className="p-2 text-left border-b border-r w-28">Status</th>
                                        <th className="p-2 text-left border-b">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.items.length === 0 ? (
                                        <tr>
                                            <td
                                            className="p-2 text-sm text-muted-foreground border-b"
                                            colSpan={6}
                                            >
                                            No items for this sale.
                                            </td>
                                        </tr>
                                        ) : (
                                        sale.items.map((item) => {
                                            const d = item.item_details;
                                            const itemCode = d.code ?? "—";
                                            const purity = d.purity ?? "—";
                                            const weight = d.weight ?? "—";
                                            const status = d.status ?? "—";
                                            const saleItemDesc = item.description ?? "";
                                            const baseDesc = d.description ?? "";
                                            const finalDesc =
                                            saleItemDesc !== "" ? saleItemDesc : baseDesc || "—";

                                            return (
                                            <tr key={item.id} className="hover:bg-slate-50/80">
                                                <td className="p-2 border-b border-r">{itemCode}</td>
                                                <td className="p-2 border-b border-r">{purity}</td>
                                                <td className="p-2 text-right border-b border-r">
                                                {weight ?? "—"}
                                                </td>
                                                <td className="p-2 text-right border-b border-r">
                                                {item.purity_price ? item.purity_price : "—"}
                                                </td>
                                                <td className="p-2 border-b border-r">
                                                <span
                                                    className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium ${
                                                    status === "SOLD"
                                                        ? "bg-green-100 text-green-800"
                                                        : status === "RST_BOOKED"
                                                        ? "bg-amber-100 text-amber-800"
                                                        : status === "VOIDED"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-slate-100 text-slate-800"
                                                    }`}
                                                >
                                                    {status}
                                                </span>
                                                </td>
                                                <td className="p-2 border-b">{finalDesc}</td>
                                            </tr>
                                            );
                                        })
                                        )}
                                    </tbody>
                                    </table>
                                </div>

                                {/* RST (optional) */}
                                {sale.is_rst && sale.rst_details ? (
                                <div className="rounded-md border bg-white/60 overflow-hidden">
                                    <div className="border-b bg-purple-50/60 p-2 text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center justify-between">
                                    <span>RST details for invoice #{sale.invoice_number}</span>
                                    <span className="text-[10px]">
                                        Status: {sale.rst_details.status ?? "—"}
                                    </span>
                                    </div>
                                    <div className="grid gap-2 p-2 text-xs sm:grid-cols-4 border-b bg-white/40">
                                    <div>
                                        <span className="text-muted-foreground">RST #:</span>{" "}
                                        <span className="font-medium">{sale.rst_details.number ?? "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Advance:</span>{" "}
                                        <span className="font-medium">{sale.rst_details.rst_adv ?? "0.00"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Due:</span>{" "}
                                        <span className="font-medium">{sale.rst_details.rst_due ?? "0.00"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Delivery date:</span>{" "}
                                        <span className="font-medium">
                                        {sale.rst_details.delivery_date ?? "—"}
                                        </span>
                                    </div>
                                    </div>
                                    <table className="w-full text-xs table-fixed">
                                    <thead>
                                        <tr className="bg-slate-50">
                                        <th className="p-2 text-left border-b border-r w-28">Item Code</th>
                                        <th className="p-2 text-left border-b border-r w-24">Purity</th>
                                        <th className="p-2 text-left border-b border-r">Description</th>
                                        <th className="p-2 text-left border-b">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.rst_details.rst_items &&
                                        sale.rst_details.rst_items.length > 0 ? (
                                        sale.rst_details.rst_items.map((rstItem) => {
                                            const d = rstItem.item_details;
                                            return (
                                            <tr key={rstItem.id} className="hover:bg-slate-50/80">
                                                <td className="p-2 border-b border-r">{d?.code ?? "—"}</td>
                                                <td className="p-2 border-b border-r">{d?.purity ?? "—"}</td>
                                                <td className="p-2 border-b border-r">
                                                {rstItem.description && rstItem.description !== ""
                                                    ? rstItem.description
                                                    : d?.description ?? "—"}
                                                </td>
                                                <td className="p-2 border-b">
                                                <span
                                                    className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium ${
                                                    d?.status === "RST_BOOKED"
                                                        ? "bg-amber-100 text-amber-800"
                                                        : "bg-slate-100 text-slate-800"
                                                    }`}
                                                >
                                                    {d?.status ?? "—"}
                                                </span>
                                                </td>
                                            </tr>
                                            );
                                        })
                                        ) : (
                                        <tr>
                                            <td colSpan={4} className="p-2 text-muted-foreground border-b">
                                            No RST items.
                                            </td>
                                        </tr>
                                        )}
                                    </tbody>
                                    </table>
                                </div>
                                ) : null}

                                {/* ORDER (optional) */}
                                {sale.is_order && sale.order_details ? (
                                <div className="rounded-md border bg-white/60 overflow-hidden">
                                    <div className="border-b bg-amber-50/60 p-2 text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center justify-between">
                                    <span>Order details for invoice #{sale.invoice_number}</span>
                                    <span className="text-[10px] uppercase">
                                        {sale.order_details.is_completed ? "Completed" : "In progress"}
                                    </span>
                                    </div>
                                    <div className="grid gap-2 p-2 text-xs sm:grid-cols-4 border-b bg-white/40">
                                    <div>
                                        <span className="text-muted-foreground">Order #:</span>{" "}
                                        <span className="font-medium">{sale.order_details.number ?? "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Assigned to:</span>{" "}
                                        <span className="font-medium">
                                        {sale.order_details.assigned_to ?? "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Delivery date:</span>{" "}
                                        <span className="font-medium">
                                        {sale.order_details.delivery_date ?? "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Completed at:</span>{" "}
                                        <span className="font-medium">
                                        {sale.order_details.completed_at ?? "—"}
                                        </span>
                                    </div>
                                    </div>
                                    <table className="w-full text-xs table-fixed">
                                    <thead>
                                        <tr className="bg-slate-50">
                                        <th className="p-2 text-left border-b border-r">Item / Description</th>
                                        <th className="p-2 text-left border-b border-r w-32">Assigned To</th>
                                        <th className="p-2 text-left border-b w-28">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="hover:bg-slate-50/80">
                                        <td className="p-2 border-b border-r">
                                            {sale.order_details.item_description ?? "—"}
                                        </td>
                                        <td className="p-2 border-b border-r">
                                            {sale.order_details.assigned_to ?? "—"}
                                        </td>
                                        <td className="p-2 border-b">
                                            <span
                                            className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium ${
                                                sale.order_details.is_completed
                                                ? "bg-green-100 text-green-800"
                                                : "bg-amber-100 text-amber-800"
                                            }`}
                                            >
                                            {sale.order_details.is_completed ? "Done" : "Pending"}
                                            </span>
                                        </td>
                                        </tr>
                                    </tbody>
                                    </table>
                                </div>
                                ) : null}
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
