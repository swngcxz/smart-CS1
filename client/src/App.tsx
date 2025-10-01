import { ThemeProvider } from "@/components/theme-provider"; 
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SmartFloatingRatingButton } from "@/components/ui/smart-floating-rating-button";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import Feedback from "./pages/users/Feedback";
import Notifications from "./pages/admin/pages/Notifications";
import StaffNotifications from "./pages/staff/pages/StaffNotifications";
import StaffDashboard from "./pages/StaffDashboard";
import OtpVerification from "./pages/auth/OtpVerification";
import RequireAuth from "@/components/RequireAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      staleTime: 10000,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin" element={<RequireAuth allowedRoles={["admin"]}><AdminDashboard /></RequireAuth>} />
            <Route path="/admin/notifications" element={<RequireAuth allowedRoles={["admin"]}><Notifications /></RequireAuth>} />
            <Route path="/staff" element={<RequireAuth allowedRoles={["staff","admin"]}><StaffDashboard /></RequireAuth>} />
            <Route path="/staff/notifications" element={<RequireAuth allowedRoles={["staff","admin"]}><StaffNotifications /></RequireAuth>} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
      
      {/* Smart Floating Rating Button - appears after user interaction */}
      <SmartFloatingRatingButton 
        showAfterDelay={5000}
        hideOnPages={['/login', '/register', '/forgot-password', '/verify-otp']}
        showOnlyAfterActions={true}
      />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
