// src/hooks/usePayouts.ts
import { useQuery } from "@tanstack/react-query";
import { fetchPayouts } from "@/features/payouts/api/payouts.api";

export type Payout = {
  id: number;
  business_date: string;
  category: string;
  expense_type: string;
  description: string;
  amount: string;
  payment_method: string;
};

type UsePayoutsOptions = {
  month: string; // "YYYY-MM"
};

export function usePayouts({ month }: UsePayoutsOptions) {
  return useQuery<Payout[]>({
    queryKey: ["payouts", month],
    queryFn: async () => fetchPayouts(month),
  });
}
