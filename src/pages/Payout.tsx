import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { PayoutForm } from "@/components/payout/PayoutForm";
import PayoutTable from "@/components/payout/PayoutTable";

export default function Payouts() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payout Entry</h1>
        <p className="text-muted-foreground mt-1">Create a new payout transaction</p>
      </div>

      <PayoutForm />
      <PayoutTable />
    </div>
  );
}
