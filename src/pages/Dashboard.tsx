import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Receipt, Package, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { label: "Total Sales", value: "$45,231.89", change: "+20.1%", icon: ShoppingCart },
    { label: "Expenses", value: "$12,234.00", change: "+12.3%", icon: Receipt },
    { label: "Active Orders", value: "23", change: "+5", icon: Package },
    { label: "Growth", value: "+12.5%", change: "+2.3%", icon: TrendingUp },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your jewellery business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-success mt-1">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="/sales"
            className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <h3 className="font-medium">Create Sales Entry</h3>
            <p className="text-sm text-muted-foreground mt-1">Record a new sales transaction</p>
          </a>
          <a
            href="/expenses"
            className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <h3 className="font-medium">Record Expense</h3>
            <p className="text-sm text-muted-foreground mt-1">Add a new business expense</p>
          </a>
          <a
            href="/orders"
            className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <h3 className="font-medium">Create Order</h3>
            <p className="text-sm text-muted-foreground mt-1">Place a new order with suppliers</p>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
