// src/hooks/useSales.ts
import { fetchSales } from "@/features/sales/api/sales.api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";


// ----- types that match your real JSON -----
export type ItemDetails = {
  code: number;
  purity: string;
  weight: string | null;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SaleItem = {
  id: number;
  sale: number;
  item: number;
  purity_price: string | null;
  description?: string; // sometimes empty
  item_details: ItemDetails;
};

export type RSTDetails = {
  id: number;
  status: string;
  rst_adv: string;
  rst_due: string;
  rst_final_price: string | null;
  delivery_date: string | null;
  completed_at: string | null;
  number: number;
  rst_items: Array<{
    id: number;
    description: string;
    item_details: ItemDetails;
  }>;
  voided_info: null | {
    voided_at: string;
  };
};

export type OrderDetails = {
  id: number;
  assigned_to: string;
  is_completed: boolean;
  delivery_date: string | null;
  completed_at: string | null;
  item_description: string;
  number: number;
};

export type Sale = {
  id: number;
  invoice_number: number;
  business_date: string;
  customer_name: string;
  sold_by: string;
  item_count: number;
  total_weight: string;
  total_sale_price: string;
  is_rst: boolean;
  is_order: boolean;
  rst_details: RSTDetails | null;
  order_details: OrderDetails | null;
  items: SaleItem[];
};

type UseSalesOptions = {
  month: string; // "YYYY-MM"
};

export function useSales({ month }: UseSalesOptions) {

  return useQuery<Sale[]>({
    queryKey: ["sales", month],
    queryFn: async () => fetchSales(month),
  });
}
