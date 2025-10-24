// src/features/sales/api/sales.api.ts
import { http } from "@/lib/http";
import type { SalesRow, OrderRow } from "../../../components/sales/SalesForm";

export async function createSales(payload: { date: string; items: SalesRow[] }) {
  return http.post<{ id: string; date: string; count: number }>("/api/ledger/sales/", payload);
}

export async function createOrders(payload: { date: string; items: OrderRow[] }) {
  return http.post<{ id: string; date: string; count: number }>("/api/order/", payload);
}
