import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/components/AuthProvider";
import Index from "./pages/Index";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import SubscriptionPayment from "./pages/SubscriptionPayment";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import QRScanner from "./pages/QRScanner";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQRScanner from "./pages/AdminQRScanner";
import AdminReturnScanner from "./pages/AdminReturnScanner";
import AdminReceiveScanner from "./pages/AdminReceiveScanner";
import OrderConfirmScanner from "./pages/OrderConfirmScanner";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/qr-scanner" element={<QRScanner />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                <Route path="/subscription/payment" element={<ProtectedRoute><SubscriptionPayment /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/scan" element={<ProtectedRoute><AdminQRScanner /></ProtectedRoute>} />
                <Route path="/admin/scan-delivery" element={<ProtectedRoute><AdminReturnScanner /></ProtectedRoute>} />
                <Route path="/admin/scan-pickup" element={<ProtectedRoute><AdminReceiveScanner /></ProtectedRoute>} />
                <Route path="/order-confirm-scanner" element={<ProtectedRoute><OrderConfirmScanner /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNav />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
