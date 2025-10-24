import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthProvider } from '@/features/auth/AuthProvider';
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Payouts from "./pages/Payout";
import NotFound from "./pages/NotFound";
import { LoginPage } from "./pages/LoginPage";
import { TestAuth } from "./pages/TestAuth";
import { ProtectedRoute } from "./components/ProtectedRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/test" element={<TestAuth />} />
            <Route path="/" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><DashboardLayout><Sales /></DashboardLayout></ProtectedRoute>} />
            <Route path="/payouts" element={<ProtectedRoute><DashboardLayout><Payouts /></DashboardLayout></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
