// src/features/sales/api/sales.api.ts
import { http } from "@/lib/http";
import type { SalesRow, OrderRow } from "../../../components/sales/SalesForm";
import { Sale } from "@/hooks/useSales";

export async function createSales(payload: { date: string; sales: SalesRow[]; orders: OrderRow[] }) {
  return http.post<{ id: string; date: string; count: number }>("/api/ledger/sales/", payload);
}

export async function fetchSales(month: string) {
  return http.get<Sale[]>(`/api/ledger/sales/all/?month=${month}&include_items=true`);
}