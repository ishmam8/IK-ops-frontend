// src/features/sales/api/sales.api.ts
import { http } from "@/lib/http";
import type { PayoutRow } from "../../../components/payout/PayoutForm";

export async function createPayouts(payload: { date: string; payouts: PayoutRow[] }) {
  return http.post<{ id: string; date: string; count: number }>("/api/ledger/expenses/", payload);
}

