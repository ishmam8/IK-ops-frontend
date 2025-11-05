// src/features/sales/api/sales.api.ts
import { http } from "@/lib/http";
import type { PayoutRow } from "../../../components/payout/PayoutForm";
import { Payout } from "@/hooks/usePayouts";

export async function createPayouts(payload: { date: string; payouts: PayoutRow[] }) {
  return http.post<{ id: string; date: string; count: number }>("/api/ledger/expenses/", payload);
}

export async function fetchPayouts(month: string) {
  return http.get<Payout[]>(`/api/ledger/expenses/all/?month=${month}&include_items=true`);
}

