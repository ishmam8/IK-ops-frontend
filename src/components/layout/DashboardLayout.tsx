import { ReactNode, useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Receipt, Package, Menu, X  } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '@/features/auth/AuthProvider';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/sales", icon: ShoppingCart, label: "Sales" },
  { to: "/payouts", icon: Receipt, label: "Payouts" },
  { to: "/logout", icon: Package, label: "Logout" },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">Jewellery ERP</h1>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
              onClick={(e) => {
                if (item.to === "/logout") {
                  e.preventDefault();
                  logout();
                }
              }}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-2 left-0 z-50 p-1 bg-sidebar border border-sidebar-border rounded-r-lg shadow-lg hover:bg-sidebar-accent transition-all duration-300 ease-in-out"
        style={{
          transform: isSidebarOpen ? "translateX(256px)" : "translateX(0)",
        }}
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5 text-sidebar-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-sidebar-foreground" />
        )}
      </button>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
