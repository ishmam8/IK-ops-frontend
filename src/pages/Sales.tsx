import { SalesForm } from "@/components/sales/SalesForm";
import SalesTable from "@/components/sales/SalesTable";

export default function Sales() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Entry</h1>
        <p className="text-muted-foreground mt-1">Create a new sales transaction</p>
      </div>

      <SalesForm />
      <SalesTable />
    </div>
  );
}
